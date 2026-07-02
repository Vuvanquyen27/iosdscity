-- =============================================================================
-- DSCITY — 0005: Bảo mật tiền (RPC atomic + siết RLS)   [SCHEMA B]
-- =============================================================================
-- VÌ SAO CẦN:
--   Trước đây topup()/bookAndPay() trong services/api.ts ghi THẲNG bảng `wallets`
--   từ client. Muốn chạy được thì RLS phải cho user tự UPDATE ví của mình →
--   BẤT KỲ AI cũng có thể tự đặt số dư tuỳ ý (tiền chùa). Migration này chuyển
--   toàn bộ thao tác tiền sang 2 hàm SECURITY DEFINER (chạy quyền owner, tự kiểm
--   auth.uid() bên trong) và KHOÁ mọi ghi trực tiếp lên wallets /
--   wallet_transactions / bookings từ phía client. Sau migration, đường DUY NHẤT
--   để tiền thay đổi là qua RPC → an toàn với RLS + atomic (không double-spend).
--
-- BÁM SCHEMA B (types/database.ts) — categorical là text + CHECK, KHÔNG enum:
--   wallets(id, user_id, balance, updated_at)
--   wallet_transactions(id, wallet_id, type, amount, balance_after, description,
--                       booking_id, created_at)
--   bookings(id, code, user_id, service_type, parking_lot_id, vehicle_id,
--            trip_id, rate_type, start_time, end_time, total_amount, status,
--            qr_payload, created_at)
--   parking_lots(available_slots), shared_trips(available_seats)
--
-- IDEMPOTENT: chạy lại an toàn. Áp dụng bằng Supabase SQL Editor hoặc CLI:
--   supabase db push   (hoặc dán file này vào SQL Editor rồi Run)
-- =============================================================================

-- --- 0) Bật RLS cho 3 bảng tiền (no-op nếu đã bật) ---------------------------
alter table public.wallets              enable row level security;
alter table public.wallet_transactions  enable row level security;
alter table public.bookings             enable row level security;

-- --- 1) Mỗi user chỉ 1 ví — để khoá hàng (FOR UPDATE) & tra cứu chắc chắn ----
--     Nếu DB đang có ví trùng user_id thì index không tạo được → chỉ cảnh báo,
--     không làm hỏng phần còn lại của migration.
do $$
begin
  create unique index if not exists wallets_user_id_key on public.wallets (user_id);
exception when others then
  raise notice 'Bỏ qua unique index wallets(user_id): %', sqlerrm;
end $$;

-- --- 2) GỠ mọi policy đang có trên 3 bảng tiền -------------------------------
--     Không biết trước tên policy hiện tại (schema B dựng tay, không có trong
--     version control) → duyệt pg_policies và drop hết, rồi tạo lại ĐÚNG các
--     policy CHỈ-ĐỌC-CỦA-MÌNH bên dưới. Ghi tiền = qua RPC (bypass RLS).
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('wallets', 'wallet_transactions', 'bookings')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- --- 3) Chỉ cho ĐỌC dữ liệu của chính mình (KHÔNG insert/update/delete) ------
create policy "wallets: read own" on public.wallets
  for select using (auth.uid() = user_id);

create policy "bookings: read own" on public.bookings
  for select using (auth.uid() = user_id);

create policy "wallet_tx: read own" on public.wallet_transactions
  for select using (
    exists (
      select 1 from public.wallets w
      where w.id = wallet_transactions.wallet_id
        and w.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 4) wallet_topup — nạp tiền (tạo ví nếu chưa có) + ghi sổ cái. ATOMIC.
--    Trả về số dư MỚI (VND). Map cho services/api.ts -> topup().
-- =============================================================================
create or replace function public.wallet_topup(
  p_amount bigint,
  p_method text default 'momo'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wid uuid;
  v_bal bigint;
begin
  if v_uid is null then raise exception 'Chưa đăng nhập'; end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Số tiền nạp phải lớn hơn 0';
  end if;

  -- Khoá ví (tạo mới nếu user chưa có ví).
  select id, balance into v_wid, v_bal
    from wallets where user_id = v_uid for update;
  if not found then
    insert into wallets (user_id, balance) values (v_uid, 0)
      returning id, balance into v_wid, v_bal;
  end if;

  update wallets
     set balance = balance + p_amount, updated_at = now()
   where id = v_wid
   returning balance into v_bal;

  insert into wallet_transactions (wallet_id, type, amount, balance_after, description)
  values (v_wid, 'topup', p_amount, v_bal, 'Nạp tiền (' || coalesce(p_method, 'ví') || ')');

  return v_bal;
end;
$$;

-- =============================================================================
-- 5) book_and_pay — đặt chỗ + trừ ví (+ giảm slot/ghế) trong 1 TRANSACTION.
--    Trả jsonb { booking, balance }. Ném 'insufficient' (P0001) khi thiếu tiền.
--    Map cho services/api.ts -> bookAndPay().
-- =============================================================================
create or replace function public.book_and_pay(
  p_service_type text,
  p_target_id    uuid,
  p_amount       bigint,
  p_name         text,
  p_rate_type    text        default null,
  p_start_time   timestamptz default null,
  p_end_time     timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_wid     uuid;
  v_bal     bigint;
  v_prefix  text;
  v_code    text;
  v_booking bookings%rowtype;
begin
  if v_uid is null then raise exception 'Chưa đăng nhập'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'Số tiền không hợp lệ'; end if;
  if p_service_type not in ('parking', 'car', 'motorbike', 'sharing') then
    raise exception 'Loại dịch vụ không hợp lệ: %', p_service_type;
  end if;

  -- 1) Khoá ví + kiểm tra số dư (tạo ví nếu chưa có → số dư 0 → insufficient).
  select id, balance into v_wid, v_bal
    from wallets where user_id = v_uid for update;
  if not found then
    insert into wallets (user_id, balance) values (v_uid, 0)
      returning id, balance into v_wid, v_bal;
  end if;
  if v_bal < p_amount then
    raise exception 'insufficient' using errcode = 'P0001';
  end if;

  -- 2) Giảm chỗ/ghế nếu là bãi đỗ / chuyến đi chung.
  if p_service_type = 'parking' then
    update parking_lots set available_slots = available_slots - 1
     where id = p_target_id and available_slots > 0;
    if not found then raise exception 'Bãi đỗ đã hết chỗ'; end if;
  elsif p_service_type = 'sharing' then
    update shared_trips set available_seats = available_seats - 1
     where id = p_target_id and available_seats > 0;
    if not found then raise exception 'Chuyến đã hết ghế'; end if;
  end if;

  -- 3) Trừ ví.
  update wallets set balance = balance - p_amount, updated_at = now()
   where id = v_wid returning balance into v_bal;

  -- 4) Sinh mã đơn (PARK-260702-8X7A) + tạo booking.
  v_prefix := case p_service_type
                when 'parking'   then 'PARK'
                when 'car'       then 'CAR'
                when 'motorbike' then 'BIKE'
                when 'sharing'   then 'RIDE'
              end;
  v_code := v_prefix || '-' || to_char(now(), 'YYMMDD') || '-'
            || upper(substr(md5(random()::text), 1, 4));

  insert into bookings (
    code, user_id, service_type,
    parking_lot_id, vehicle_id, trip_id,
    rate_type, start_time, end_time, total_amount, status
  ) values (
    v_code, v_uid, p_service_type,
    case when p_service_type = 'parking'            then p_target_id end,
    case when p_service_type in ('car', 'motorbike') then p_target_id end,
    case when p_service_type = 'sharing'            then p_target_id end,
    p_rate_type, p_start_time, p_end_time, p_amount, 'ongoing'
  )
  returning * into v_booking;

  -- 5) Ghi sổ ví (amount âm = trừ tiền).
  insert into wallet_transactions (wallet_id, type, amount, balance_after, description, booking_id)
  values (v_wid, 'payment', -p_amount, v_bal, p_name, v_booking.id);

  return jsonb_build_object('booking', to_jsonb(v_booking), 'balance', v_bal);
end;
$$;

-- --- 6) Quyền gọi RPC: chỉ user đã đăng nhập (revoke default PUBLIC) ----------
revoke all on function public.wallet_topup(bigint, text) from public;
revoke all on function public.book_and_pay(text, uuid, bigint, text, text, timestamptz, timestamptz) from public;
grant execute on function public.wallet_topup(bigint, text) to authenticated;
grant execute on function public.book_and_pay(text, uuid, bigint, text, text, timestamptz, timestamptz) to authenticated;

-- =============================================================================
-- KIỂM TRA NHANH sau khi chạy (chạy riêng, không bắt buộc):
--   -- Phải KHÔNG còn policy insert/update/delete trên 3 bảng tiền:
--   select tablename, policyname, cmd from pg_policies
--    where schemaname='public' and tablename in ('wallets','wallet_transactions','bookings');
--   -- 2 hàm phải tồn tại:
--   select proname from pg_proc where proname in ('wallet_topup','book_and_pay');
-- =============================================================================
