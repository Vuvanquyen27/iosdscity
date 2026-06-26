# DSCITY – Digital Smart City 🏙️

> Nền tảng giao thông thông minh cho cuộc sống hiện đại.

App mobile **DSCITY** dựng bằng **Expo SDK 54** + **TypeScript** + **Expo Router** (file-based routing). Gồm **10 màn hình UI** (Splash, Đăng nhập, Trang chủ, Bản đồ, Chi tiết bãi đậu xe, Thuê ô tô, Thuê xe máy, Chia sẻ phương tiện, Thanh toán thành công, Tài khoản) cùng 2 tab phụ (Đặt chỗ, Thông báo).

> ⚠️ Project **giữ nguyên SDK 54** (không nâng lên 56) vì app **Expo Go** trên thiết bị chỉ hỗ trợ SDK 54.

Toàn bộ chạy bằng **mock data** (chưa cần backend / API thật).

## ✨ Đặc điểm

- **Design system tập trung** ở `constants/theme.ts` — 5 màu thương hiệu, font Be Vietnam Pro (4 cấp), spacing / bo góc / shadow. Không hardcode màu rải rác.
- **Font Google** Be Vietnam Pro qua `@expo-google-fonts/be-vietnam-pro` (nạp ở root layout, chặn render tới khi sẵn sàng).
- **Icon vector** `@expo/vector-icons` (Ionicons + MaterialCommunityIcons).
- **QR thật** sinh từ mã đặt chỗ bằng `react-native-qrcode-svg` (màn Thành công).
- **Custom bottom tab bar** tự build (5 tab) — dùng classic `Tabs` từ `expo-router` (SDK 54, bọc `@react-navigation/bottom-tabs` v7).
- **State thật ở mức UI**: nhập form đăng nhập, chọn gói giá thuê xe, lọc đơn hàng, chuyển tab tìm/chia sẻ chuyến.

## ⚠️ Lưu ý môi trường

- **Build native iOS** (`npx expo run:ios`, Simulator) **chỉ chạy được trên macOS có Xcode**.
- Trên **Windows** vẫn dev được bằng:
  - **Expo Go** trên iPhone thật: `npx expo start` rồi quét QR (chung mạng Wi-Fi).
  - **EAS Build** (cloud): `npx eas build -p ios` — không cần máy Mac.
- Yêu cầu **Node ≥ 20.19** (SDK 54). iOS tối thiểu **15.1+**.
- **Quan trọng:** giữ SDK 54 để khớp Expo Go trên máy. Đừng chạy `expo install expo@latest` / nâng SDK.

## 🚀 Cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Chạy dev server (mọi hệ điều hành)
npx expo start
```

Quét QR bằng **Expo Go**, hoặc bấm `i` (iOS Simulator – macOS) / `a` (Android) / `w` (web) trong terminal.

```bash
# iOS Simulator / thiết bị thật (chỉ macOS)
npx expo run:ios
```

## 🧭 Luồng điều hướng

```
Splash (index)
  └─(2.5s hoặc chạm)→ Đăng nhập (login)
        └─"Đăng nhập"→ (tabs)/home
Trang chủ ──ServiceTile──→ parking/[id] · car/[id] · motorbike/[id] · share
Bản đồ ──chọn địa điểm──→ parking/[id]
parking/[id] ──"Đặt chỗ ngay"──→ success
car|motorbike/[id] ──"Tiếp tục đặt xe"──→ success
success ──"Về trang chủ"──→ (tabs)/home
```

## 📁 Cấu trúc thư mục

```
my-expo-ios-app/
├─ app/                      # Route theo file (Expo Router)
│  ├─ _layout.tsx            # Root stack + nạp font + splash
│  ├─ index.tsx              # 1. Splash / Onboarding
│  ├─ login.tsx              # 2. Đăng nhập / Đăng ký
│  ├─ (tabs)/
│  │  ├─ _layout.tsx         # Bottom tabs + CustomTabBar
│  │  ├─ home.tsx            # 3. Trang chủ
│  │  ├─ map.tsx             # 4. Bản đồ tìm kiếm
│  │  ├─ booking.tsx         # Tab phụ: Đặt chỗ
│  │  ├─ notifications.tsx   # Tab phụ: Thông báo
│  │  └─ account.tsx         # 10. Tài khoản / Lịch sử
│  ├─ parking/[id].tsx       # 5. Chi tiết bãi đậu xe
│  ├─ car/[id].tsx           # 6. Thuê ô tô
│  ├─ motorbike/[id].tsx     # 7. Thuê xe máy
│  ├─ share.tsx              # 8. Chia sẻ phương tiện
│  └─ success.tsx            # 9. Thanh toán / Xác nhận
├─ components/               # 14 component tái sử dụng
│  ├─ app-button.tsx · chip.tsx · card.tsx · text-field.tsx
│  ├─ service-tile.tsx · place-list-item.tsx · rating-badge.tsx
│  ├─ price-option.tsx · section-header.tsx · wallet-card.tsx
│  ├─ app-header.tsx · custom-tab-bar.tsx
│  └─ detail-hero.tsx · vehicle-detail.tsx
├─ constants/theme.ts        # Design tokens
├─ data/mock.ts              # Mock data + types + formatVND()
├─ assets/                   # Ảnh / icon / splash
├─ app.json · tsconfig.json · package.json
```

## 🎨 Design tokens (tóm tắt)

| Token        | Giá trị     | Dùng cho                          |
|--------------|-------------|-----------------------------------|
| `navy`       | `#0D1B3D`   | Splash, tiêu đề, nút phụ          |
| `green`      | `#0A683E`   | Nút chính, accent, tab active     |
| `yellow`     | `#FFC107`   | Sao đánh giá, highlight, banner   |
| `bg`         | `#F3F6FA`   | Nền màn hình                      |
| `white`      | `#FFFFFF`   | Card, surface                     |

Font: **Be Vietnam Pro** — `h1` 24/Bold, `h2` 18/SemiBold, `body` 14/Regular, `bodyMed` 14/Medium, `caption` 12/Regular.

## 📝 Ghi chú

- App dùng **mock data** trong `data/mock.ts`. Đổi/ thêm dữ liệu tại đây, các màn tự render lại.
- Ảnh xe / nhà xe dùng link Unsplash, avatar dùng ui-avatars làm **placeholder** — tìm `// TODO: thay ảnh thật` để thay asset chính thức.
- Bản đồ (màn 4) là **placeholder** styled (View + pin). Muốn bản đồ thật, thay khối `map` bằng `react-native-maps`.

## 🔧 Lệnh khác

```bash
npx tsc --noEmit   # Kiểm tra TypeScript
npx expo lint      # Lint
```
