-- =============================================================================
-- DSCITY — 0003: Cho phép CHỦ XE tự đăng xe cho thuê
-- =============================================================================
-- LƯU Ý QUAN TRỌNG về schema:
--   0001_init / 0002_functions / seed.sql là schema CŨ (schema A: places, trips,
--   vehicles.kind/available, profiles.balance). App đang chạy KHÔNG dùng schema A.
--   App thật dùng SCHEMA B (xem types/database.ts + services/api.ts):
--   bảng vehicles có owner_id / type / status / transmission / seats /
--   engine_capacity / fuel_type / features[] ...
--
-- Migration này bám SCHEMA B và CHỈ động tới bảng `vehicles`. Idempotent — chạy
-- lại an toàn (create ... if not exists, add column if not exists, drop policy
-- if exists trước khi create). Áp dụng bằng Supabase SQL Editor hoặc CLI.
-- =============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- 1) Đảm bảo bảng vehicles (schema B) tồn tại. Nếu DB đã có bảng này thì câu
--    create bị bỏ qua (if not exists) — phần quan trọng là RLS ở mục 2.
create table if not exists vehicles (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users (id) on delete cascade, -- null = xe hệ thống
  type            text         not null check (type in ('car', 'motorbike')),
  name            text         not null,
  brand           text,
  image_url       text,
  transmission    text         check (transmission in ('auto', 'manual')),
  seats           integer      check (seats is null or seats > 0),       -- ô tô
  engine_capacity integer      check (engine_capacity is null or engine_capacity > 0), -- xe máy (cc)
  fuel_type       text,
  price_per_hour  bigint       check (price_per_hour is null or price_per_hour >= 0),
  price_per_day   bigint       check (price_per_day  is null or price_per_day  >= 0),
  price_per_week  bigint       check (price_per_week is null or price_per_week >= 0),
  features        text[]       not null default '{}',
  rating          numeric(2,1) not null default 0 check (rating between 0 and 5),
  rating_count    integer      not null default 0,
  status          text         not null default 'available'
                    check (status in ('available', 'rented', 'maintenance')),
  created_at      timestamptz  not null default now()
);

-- Nếu bảng đã tồn tại từ trước mà thiếu owner_id -> bổ sung (an toàn nếu đã có).
alter table vehicles add column if not exists owner_id uuid references auth.users (id) on delete cascade;

alter table vehicles enable row level security;

create index if not exists vehicles_owner_idx       on vehicles (owner_id);
create index if not exists vehicles_type_status_idx on vehicles (type, status);

-- 2) RLS: ai cũng đọc xe đang cho thuê; CHỦ XE tự thêm/sửa/xoá xe của mình.
drop policy if exists "vehicles: public read" on vehicles;
create policy "vehicles: public read" on vehicles
  for select using (status = 'available' or auth.uid() = owner_id);

drop policy if exists "vehicles: insert own" on vehicles;
create policy "vehicles: insert own" on vehicles
  for insert with check (auth.uid() = owner_id);

drop policy if exists "vehicles: update own" on vehicles;
create policy "vehicles: update own" on vehicles
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "vehicles: delete own" on vehicles;
create policy "vehicles: delete own" on vehicles
  for delete using (auth.uid() = owner_id);
