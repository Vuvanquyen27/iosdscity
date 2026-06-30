-- =============================================================================
-- DSCITY — Trigger + hàm RPC (giao dịch tiền cần ACID)
-- =============================================================================
-- Chạy SAU 0001_init.sql. Các hàm SECURITY DEFINER chạy quyền owner nhưng tự
-- kiểm tra auth.uid() bên trong → an toàn với RLS.
-- =============================================================================

-- --- updated_at tự cập nhật --------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

create trigger profiles_touch  before update on profiles
  for each row execute function touch_updated_at();
create trigger prefs_touch     before update on user_preferences
  for each row execute function touch_updated_at();

-- =============================================================================
-- Tạo profile + preferences tự động khi có user mới (đăng ký).
-- Lấy tên/sđt từ raw_user_meta_data nếu app truyền vào lúc signUp.
-- =============================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name  text := coalesce(new.raw_user_meta_data->>'full_name', '');
  v_first text := nullif(trim(regexp_replace(v_name, '^.*\s', '')), '');
begin
  insert into public.profiles (id, full_name, first_name, phone, email, avatar_url)
  values (
    new.id,
    v_name,
    coalesce(v_first, v_name),
    new.raw_user_meta_data->>'phone',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- nearby_places — tìm bãi đỗ gần một toạ độ, kèm khoảng cách (m), sắp theo gần.
-- Map cho map.tsx / services/geo.ts (MY_LOCATION).
-- =============================================================================
create or replace function nearby_places(
  lat double precision,
  lng double precision,
  radius_m double precision default 5000
)
returns table (
  id text, name text, distance_m double precision,
  price_per_hour bigint, price_per_day bigint,
  slots_left integer, slots_total integer,
  open_hours text, rating numeric, reviews_count integer,
  floor text, image_url text, payments payment_method[],
  latitude double precision, longitude double precision
)
language sql stable as $$
  select p.id, p.name,
         st_distance(p.geo, st_makepoint(lng, lat)::geography) as distance_m,
         p.price_per_hour, p.price_per_day, p.slots_left, p.slots_total,
         p.open_hours, p.rating, p.reviews_count, p.floor, p.image_url, p.payments,
         st_y(p.geo::geometry) as latitude, st_x(p.geo::geometry) as longitude
  from places p
  where p.active
    and st_dwithin(p.geo, st_makepoint(lng, lat)::geography, radius_m)
  order by distance_m asc;
$$;

-- =============================================================================
-- wallet_topup — nạp tiền vào ví (cộng số dư + ghi sổ cái). Atomic.
-- Trả về số dư mới. Map cho app/topup.tsx.
-- =============================================================================
create or replace function wallet_topup(
  p_amount bigint,
  p_method payment_method default 'momo'
)
returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_balance bigint;
begin
  if v_uid is null then raise exception 'Chưa đăng nhập'; end if;
  if p_amount <= 0 then raise exception 'Số tiền nạp phải lớn hơn 0'; end if;

  -- Khoá hàng profile để tránh race khi nạp/trừ đồng thời.
  update profiles set balance = balance + p_amount
   where id = v_uid
  returning balance into v_balance;

  insert into wallet_transactions (user_id, type, amount, balance_after, method, description)
  values (v_uid, 'topup', p_amount, v_balance, p_method, 'Nạp tiền vào ví');

  return v_balance;
end; $$;

-- =============================================================================
-- create_booking — đặt chỗ + trừ ví + (nếu bãi đỗ) giảm slot. TẤT CẢ trong 1
-- transaction → hoặc thành công trọn vẹn, hoặc rollback. Đây là phần ACID cốt lõi.
-- Trả về id booking vừa tạo.
-- =============================================================================
create or replace function create_booking(
  p_kind       booking_kind,
  p_target_id  text,                       -- place_id | vehicle_id | trip_id
  p_amount     bigint,
  p_name       text,
  p_start_at   timestamptz default now(),
  p_end_at     timestamptz default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_balance bigint;
  v_booking uuid;
  v_place   text := case when p_kind = 'parking'             then p_target_id end;
  v_vehicle text := case when p_kind in ('car','motorbike')  then p_target_id end;
  v_trip    text := case when p_kind = 'trip'                then p_target_id end;
begin
  if v_uid is null then raise exception 'Chưa đăng nhập'; end if;
  if p_amount < 0 then raise exception 'Số tiền không hợp lệ'; end if;

  -- 1) Khoá & kiểm tra số dư.
  select balance into v_balance from profiles where id = v_uid for update;
  if v_balance < p_amount then
    raise exception 'Số dư không đủ (cần %, có %)', p_amount, v_balance
      using errcode = 'P0001';
  end if;

  -- 2) Nếu đặt bãi đỗ: giảm 1 slot (chỉ khi còn chỗ).
  if p_kind = 'parking' then
    update places set slots_left = slots_left - 1
     where id = v_place and slots_left > 0;
    if not found then raise exception 'Bãi đỗ đã hết chỗ'; end if;
  elsif p_kind = 'trip' then
    update trips set seats_left = seats_left - 1
     where id = v_trip and seats_left > 0;
    if not found then raise exception 'Chuyến đã hết ghế'; end if;
  end if;

  -- 3) Trừ tiền ví.
  update profiles set balance = balance - p_amount
   where id = v_uid returning balance into v_balance;

  -- 4) Tạo booking.
  insert into bookings (user_id, kind, place_id, vehicle_id, trip_id, name, amount, status, start_at, end_at)
  values (v_uid, p_kind, v_place, v_vehicle, v_trip, p_name, p_amount, 'ongoing', p_start_at, p_end_at)
  returning id into v_booking;

  -- 5) Ghi sổ cái (số âm = trừ tiền).
  insert into wallet_transactions (user_id, booking_id, type, amount, balance_after, description)
  values (v_uid, v_booking, 'payment', -p_amount, v_balance, p_name);

  -- 6) Thông báo trong app.
  insert into notifications (user_id, icon, title, body)
  values (v_uid, 'checkmark-circle', 'Đặt chỗ thành công', p_name || ' đã được xác nhận.');

  return v_booking;
end; $$;
