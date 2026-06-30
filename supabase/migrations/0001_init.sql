-- =============================================================================
-- DSCITY — Schema khởi tạo (Supabase / PostgreSQL)
-- =============================================================================
-- Suy trực tiếp từ các type trong data/mock.ts. Tiền tệ lưu bằng BIGINT (đồng VND,
-- số nguyên — KHÔNG dùng float cho tiền). Toạ độ dùng PostGIS để tìm "bãi gần tôi".
--
-- Thứ tự chạy: 0001_init → 0002_functions → seed.sql (xem supabase/README.md).
-- =============================================================================

-- --- Extensions --------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- --- Enums -------------------------------------------------------------------
create type payment_method    as enum ('visa', 'mastercard', 'momo', 'cash');
create type vehicle_kind      as enum ('car', 'motorbike');
create type booking_kind      as enum ('car', 'motorbike', 'parking', 'trip');
create type booking_status    as enum ('pending', 'ongoing', 'completed', 'cancelled');
create type wallet_entry_type as enum ('topup', 'payment', 'refund');
create type review_target     as enum ('place', 'vehicle', 'trip');

-- =============================================================================
-- 1) PROFILES — hồ sơ người dùng (1-1 với auth.users)
--    Map từ data/mock.ts → User { name, firstName, phone, email, balance, avatar }
-- =============================================================================
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null default '',
  first_name  text        not null default '',
  phone       text,
  email       text,
  avatar_url  text,
  -- Số dư ví, đơn vị: đồng VND (số nguyên). Chỉ đổi qua hàm wallet_* / create_booking.
  balance     bigint      not null default 0 check (balance >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on column profiles.balance is 'Số dư ví (VND, số nguyên). Chỉ thay đổi qua RPC giao dịch.';

-- =============================================================================
-- 2) USER_PREFERENCES — map từ hooks/use-preferences.tsx
-- =============================================================================
create table user_preferences (
  user_id         uuid primary key references profiles (id) on delete cascade,
  push            boolean        not null default true,
  promo           boolean        not null default false,
  location        boolean        not null default true,
  biometric       boolean        not null default false,
  default_payment payment_method not null default 'momo',
  language        text           not null default 'vi',  -- map i18n
  theme           text           not null default 'system', -- 'light'|'dark'|'system'
  updated_at      timestamptz    not null default now()
);

-- =============================================================================
-- 3) PLACES — bãi đậu xe. Map từ mock places[]
--    coordinate → PostGIS geography(Point); slots_left là counter realtime.
-- =============================================================================
create table places (
  id           text primary key,                 -- slug: 'central-plaza' (khớp route parking/[id])
  name         text             not null,
  geo          geography(Point) not null,         -- lng/lat
  price_per_hour bigint         not null check (price_per_hour >= 0),
  price_per_day  bigint         not null check (price_per_day  >= 0),
  slots_total  integer          not null check (slots_total >= 0),
  slots_left   integer          not null check (slots_left >= 0),
  open_hours   text             not null default '00:00 - 24:00',
  rating       numeric(2,1)     not null default 0 check (rating between 0 and 5),
  reviews_count integer         not null default 0,
  floor        text,
  image_url    text,
  payments     payment_method[] not null default '{}',
  active       boolean          not null default true,
  created_at   timestamptz      not null default now()
);
create index places_geo_idx on places using gist (geo);
create index places_active_idx on places (active) where active;

-- =============================================================================
-- 4) VEHICLES — xe cho thuê (ô tô + xe máy). Map từ mock vehicles[]
-- =============================================================================
create table vehicles (
  id             text primary key,               -- slug: 'toyota-corolla-cross'
  kind           vehicle_kind not null,
  name           text         not null,
  attributes     text[]       not null default '{}',   -- ['Tự động','5 chỗ','Xăng']
  price_per_hour bigint       not null check (price_per_hour >= 0),
  price_per_day  bigint       not null check (price_per_day  >= 0),
  price_per_week bigint       not null check (price_per_week >= 0),
  rating         numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews_count  integer      not null default 0,
  amenities      jsonb        not null default '[]',    -- [{icon,label}]
  image_url      text,
  available      boolean      not null default true,
  created_at     timestamptz  not null default now()
);
create index vehicles_kind_idx on vehicles (kind) where available;

-- =============================================================================
-- 5) TRIPS — chuyến đi chung. Map từ mock trips[]
-- =============================================================================
create table trips (
  id          text primary key,                  -- 'trip-1'
  driver_id   uuid references profiles (id) on delete set null,
  driver_name text         not null,
  rating      numeric(2,1) not null default 0,
  from_label  text         not null,
  to_label    text         not null,
  depart_at   timestamptz  not null,
  price       bigint       not null check (price >= 0),
  seats_total integer      not null default 1,
  seats_left  integer      not null check (seats_left >= 0),
  avatar_url  text,
  active      boolean      not null default true,
  created_at  timestamptz  not null default now()
);

-- =============================================================================
-- 6) BOOKINGS — đặt chỗ (cốt lõi giao dịch). Map từ booking.tsx / transactions[]
--    Chính xác 1 trong (place_id | vehicle_id | trip_id) tuỳ kind.
-- =============================================================================
create table bookings (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid           not null references profiles (id) on delete cascade,
  kind       booking_kind   not null,
  place_id   text references places (id),
  vehicle_id text references vehicles (id),
  trip_id    text references trips (id),
  name       text           not null,            -- tên hiển thị (denormalized)
  start_at   timestamptz    not null default now(),
  end_at     timestamptz,
  amount     bigint         not null check (amount >= 0),
  status     booking_status not null default 'pending',
  created_at timestamptz    not null default now(),
  constraint booking_target_chk check (
    (kind = 'parking'                    and place_id   is not null) or
    (kind in ('car','motorbike')         and vehicle_id is not null) or
    (kind = 'trip'                       and trip_id    is not null)
  )
);
create index bookings_user_idx on bookings (user_id, created_at desc);

-- =============================================================================
-- 7) WALLET_TRANSACTIONS — sổ cái ví (immutable ledger). Map từ transactions[]
--    balance_after = số dư ngay sau bút toán → dễ đối soát.
-- =============================================================================
create table wallet_transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid              not null references profiles (id) on delete cascade,
  booking_id    uuid references bookings (id) on delete set null,
  type          wallet_entry_type not null,
  -- amount > 0: cộng tiền (topup/refund); amount < 0: trừ tiền (payment).
  amount        bigint            not null,
  balance_after bigint            not null,
  method        payment_method,
  description   text              not null default '',
  created_at    timestamptz       not null default now()
);
create index wallet_tx_user_idx on wallet_transactions (user_id, created_at desc);

-- =============================================================================
-- 8) REVIEWS — đánh giá bãi đỗ / xe / chuyến
-- =============================================================================
create table reviews (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid          not null references profiles (id) on delete cascade,
  target_type review_target not null,
  target_id   text          not null,
  rating      numeric(2,1)  not null check (rating between 0 and 5),
  comment     text,
  created_at  timestamptz   not null default now()
);
create index reviews_target_idx on reviews (target_type, target_id);

-- =============================================================================
-- 9) NOTIFICATIONS — map từ notifications.tsx
-- =============================================================================
create table notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid        not null references profiles (id) on delete cascade,
  icon       text        not null default 'notifications',
  title      text        not null,
  body       text        not null default '',
  read       boolean     not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- =============================================================================
-- 10) PROMOTIONS — map từ mock promos[]
-- =============================================================================
create table promotions (
  id         text primary key,                    -- 'weekend'
  tag        text        not null,
  title      text        not null,
  icon       text,                                -- tên/khoá icon (map ServiceIcons)
  active     boolean     not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security — bật cho TẤT CẢ bảng
-- =============================================================================
alter table profiles            enable row level security;
alter table user_preferences    enable row level security;
alter table places              enable row level security;
alter table vehicles            enable row level security;
alter table trips               enable row level security;
alter table bookings            enable row level security;
alter table wallet_transactions enable row level security;
alter table reviews             enable row level security;
alter table notifications       enable row level security;
alter table promotions          enable row level security;

-- --- Dữ liệu danh mục: ai cũng đọc được (kể cả khách chưa đăng nhập) ----------
create policy "places: public read"     on places      for select using (active);
create policy "vehicles: public read"   on vehicles    for select using (available);
create policy "trips: public read"      on trips       for select using (active);
create policy "promotions: public read" on promotions  for select using (active);
create policy "reviews: public read"    on reviews     for select using (true);

-- --- Hồ sơ: chủ tài khoản đọc/sửa của chính mình -----------------------------
create policy "profiles: read own"   on profiles for select using (auth.uid() = id);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

create policy "prefs: read own"   on user_preferences for select using (auth.uid() = user_id);
create policy "prefs: write own"  on user_preferences for insert with check (auth.uid() = user_id);
create policy "prefs: update own" on user_preferences for update using (auth.uid() = user_id);

-- --- Dữ liệu cá nhân: chỉ chủ sở hữu -----------------------------------------
create policy "bookings: read own"   on bookings for select using (auth.uid() = user_id);
-- Lưu ý: KHÔNG cho insert booking trực tiếp — phải qua RPC create_booking (xem 0002).

create policy "wallet: read own"     on wallet_transactions for select using (auth.uid() = user_id);
-- Bút toán ví chỉ tạo qua RPC (security definer), không insert trực tiếp.

create policy "reviews: write own"   on reviews for insert with check (auth.uid() = user_id);
create policy "reviews: update own"  on reviews for update using (auth.uid() = user_id);

create policy "noti: read own"       on notifications for select using (auth.uid() = user_id);
create policy "noti: update own"     on notifications for update using (auth.uid() = user_id);
