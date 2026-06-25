# my-expo-ios-app 📱

Dự án [Expo](https://expo.dev) (React Native) tối ưu cho **iOS**, dùng **TypeScript** + **Expo Router** (file-based routing) với template tabs mặc định. Hỗ trợ sẵn **Light & Dark mode** (`userInterfaceStyle: "automatic"`).

## ⚠️ Lưu ý môi trường

- **Build/chạy native iOS** (`npx expo run:ios`, cài CocoaPods/Pods, mở **iOS Simulator**) **chỉ thực hiện được trên macOS có Xcode**. Không build được iOS native trên Windows/Linux.
- Trên **Windows**, bạn vẫn dev được bằng:
  - **Expo Go** trên iPhone thật: chạy `npx expo start` rồi quét QR (máy tính và iPhone cùng mạng Wi-Fi).
  - **EAS Build** (build trên cloud của Expo): `npx eas build -p ios` — không cần máy Mac.

## 1. Cài đặt dependencies

```bash
npm install
```

## 2. Chạy app

### Cách A — Expo Go / Dev server (mọi hệ điều hành)

```bash
npx expo start
```

Trong terminal sẽ hiện QR code và menu phím tắt (xem mục [Phím tắt khi dev](#phím-tắt-khi-dev)).

### Cách B — iOS Simulator hoặc thiết bị thật (chỉ macOS)

```bash
# Build & cài bản native lên iOS Simulator (lần đầu sẽ tự chạy prebuild + pod install)
npx expo run:ios

# Chọn thiết bị / simulator cụ thể
npx expo run:ios --device

# Build cấu hình Release
npx expo run:ios --configuration Release
```

## 3. CocoaPods / Pods (chỉ macOS)

Project hiện theo mô hình **Continuous Native Generation (CNG)** — không có sẵn thư mục `ios/`. Khi chạy `npx expo run:ios` lần đầu, Expo sẽ tự:

1. `npx expo prebuild` → sinh thư mục `ios/` từ `app.json`.
2. Tự chạy `pod install` trong `ios/`.

Nếu cần cài/chỉnh Pods thủ công (sau khi đã có thư mục `ios/`):

```bash
# Cần CocoaPods: sudo gem install cocoapods   (hoặc: brew install cocoapods)
cd ios
pod install
# hoặc dùng helper của Expo:
npx pod-install
```

> Mẹo: nếu sửa `app.json`/thêm native module, chạy lại `npx expo prebuild --clean` rồi `npx pod-install`.

## 4. Mở iOS Simulator (macOS)

```bash
# Mở Simulator app
open -a Simulator

# Liệt kê các simulator có sẵn
xcrun simctl list devices

# Khi dev server đang chạy, bấm phím "i" trong terminal để mở iOS Simulator
```

## Phím tắt khi dev

Khi `npx expo start` đang chạy, gõ các phím sau trong terminal:

| Phím        | Tác dụng                                   |
|-------------|--------------------------------------------|
| `i`         | Mở trên **iOS Simulator** (macOS)          |
| `shift + i` | Chọn iOS Simulator cụ thể để mở            |
| `a`         | Mở trên **Android emulator/device**        |
| `w`         | Mở trên **web**                            |
| `r`         | **Reload** app                             |
| `j`         | Mở **debugger** (JS)                        |
| `m`         | Mở **dev menu** trên thiết bị              |
| `o`         | Mở project trong editor                    |
| `?`         | Hiện tất cả phím tắt                       |
| `Ctrl + C`  | Dừng dev server                            |

Trên thiết bị/simulator: lắc máy hoặc bấm `Cmd + D` (iOS Simulator) để mở **Developer Menu**.

## Cấu trúc thư mục

```
my-expo-ios-app/
├─ src/
│  ├─ app/          # Route theo file (Expo Router): index.tsx, explore.tsx, _layout.tsx
│  ├─ components/   # UI components dùng lại (themed-text, app-tabs, ...)
│  ├─ hooks/        # Custom hooks (use-color-scheme, use-theme, ...)
│  └─ constants/    # Hằng số & theme (theme.ts)
├─ assets/          # Ảnh, icon, splash, app icon (expo.icon)
├─ app.json         # Cấu hình Expo (ios.bundleIdentifier, userInterfaceStyle, ...)
├─ tsconfig.json
└─ package.json
```

## Reset về project trống

```bash
npm run reset-project
```

Lệnh này chuyển code mẫu sang `app-example/` và tạo thư mục `app/` trống để bắt đầu.

## Lint

```bash
npx expo lint
```

## Tài liệu

- [Expo docs](https://docs.expo.dev/) · [Expo Router](https://docs.expo.dev/router/introduction/) · [Chạy trên iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/) · [EAS Build cho iOS](https://docs.expo.dev/build/setup/)
