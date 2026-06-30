# DSCITY — Cơ sở dữ liệu (Supabase)

Toàn bộ dữ liệu thật của app nằm ở Supabase (PostgreSQL + PostGIS + Auth +
Realtime + Storage). App hiện chạy bằng mock (`data/mock.ts`); các file dưới đây
là nền tảng để chuyển sang dữ liệu thật.

## 1. Cấu trúc thư mục

```
supabase/
  migrations/
    0001_init.sql        # Bảng, enum, index, RLS
    0002_functions.sql   # Trigger tạo profile + RPC: nearby_places, wallet_topup, create_booking
  seed.sql               # Dữ liệu danh mục từ mock (bãi đỗ, xe, chuyến, khuyến mãi)
  README.md
lib/supabase.ts          # Client cho Expo (session lưu AsyncStorage)
types/database.ts        # Kiểu TypeScript của schema
services/api.ts          # Hàm đọc/ghi dữ liệu, trả về kiểu UI đang dùng
services/auth.ts         # Đăng ký / đăng nhập / OTP / đăng xuất
.env.example             # Mẫu biến môi trường
```

## 2. Các bảng (suy từ data/mock.ts)

| Bảng | Map từ | Ghi chú |
|------|--------|---------|
| `profiles` | `User` | 1-1 với `auth.users`; `balance` = số dư ví (VND) |
| `user_preferences` | `usePreferences` | push, promo, location, biometric, payment, ngôn ngữ, theme |
| `places` | `places[]` | toạ độ PostGIS, `slots_left` realtime |
| `vehicles` | `vehicles[]` | ô tô + xe máy, `amenities` jsonb |
| `trips` | `trips[]` | chuyến đi chung |
| `bookings` | `booking.tsx` | đặt chỗ — chỉ tạo qua RPC `create_booking` |
| `wallet_transactions` | `transactions[]` | sổ cái ví (immutable) |
| `reviews` / `notifications` / `promotions` | rating, noti, promo | |

Tiền tệ dùng `bigint` (đồng VND, số nguyên). Số dư chỉ đổi qua RPC để đảm bảo
ACID (kiểm tra số dư + trừ tiền + ghi sổ trong cùng 1 transaction).

## 3. Tạo project & nạp schema

**Cách A — Dashboard (nhanh nhất):**
1. Tạo project tại https://supabase.com → mở **SQL Editor**.
2. Dán nội dung `0001_init.sql` → Run. Rồi `0002_functions.sql` → Run. Rồi `seed.sql` → Run.
3. Vào **Project Settings → API**, copy `Project URL` và `anon public key`.

**Cách B — Supabase CLI (khuyến nghị khi làm lâu dài):**
```bash
npm i -g supabase
supabase link --project-ref <PROJECT_REF>
supabase db push          # đẩy migrations/
# rồi chạy seed.sql trong SQL Editor, hoặc: supabase db execute -f supabase/seed.sql
```

## 4. Cấu hình app

```bash
cp .env.example .env       # điền EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
npx expo install @supabase/supabase-js react-native-url-polyfill
npx expo start -c          # -c để xoá cache env
```

## 5. Bật các tính năng

- **Auth bằng số điện thoại**: Dashboard → Authentication → Providers → Phone →
  bật và cấu hình SMS provider (Twilio/Vonage…). Chưa có SMS thì dùng tạm
  email/password (`services/auth.ts → signInWithEmail`).
- **Google/Apple**: Authentication → Providers, khai báo OAuth + deep link
  `myexpoiosapp://` (đã có `scheme` trong app.json).
- **Realtime slot/booking**: Database → Replication → bật cho `places`, `bookings`.
- **Storage ảnh**: tạo bucket `avatars`, `vehicles`, `places` (hiện ảnh đang trỏ
  Unsplash/Wikipedia — thay bằng URL Storage khi có ảnh thật).

## 6. Chuyển màn hình từ mock sang DB (làm dần)

Thay `import { vehicles } from '@/data/mock'` bằng:
```ts
import { fetchVehicles } from '@/services/api';
const data = await fetchVehicles('car');   // trả đúng kiểu Vehicle
```
Tương tự: `fetchNearbyPlaces(lat, lng)`, `fetchTrips()`, `fetchPromotions()`,
`fetchMyBookings()`, `topup()`, `createBooking()`. JSX không phải đổi.
