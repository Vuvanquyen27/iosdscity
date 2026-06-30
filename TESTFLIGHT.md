# Hướng dẫn đưa DSCITY lên TestFlight

App đã được cấu hình sẵn để build & nộp lên TestFlight bằng EAS (build trên cloud Mac của Expo
— bạn không cần máy Mac).

## Trạng thái đã chuẩn bị (DONE)
- [x] Tên app hiển thị: **DSCITY** (`app.json` → `expo.name`)
- [x] Icon app = logo dự án DSCITY, bản iOS đã bỏ kênh alpha để Apple không từ chối
      (`assets/brand/app-icon-ios.png`, 1024×1024, no transparency)
- [x] `eas.json` với profile `production` (build) + `production` (submit)
- [x] Dự án đã liên kết EAS: `@vuvanquyen27/my-expo-ios-app`
- [x] `expo-doctor` 18/18 PASS
- Bundle ID: `com.vuvanquyen.myexpoiosapp`

## ĐIỀU KIỆN BẮT BUỘC: Apple Developer Program
TestFlight là dịch vụ của Apple → **bắt buộc** có tài khoản Apple Developer Program (99$/năm).
Không có tài khoản này thì KHÔNG thể build ký số hay up TestFlight (không có cách miễn phí thay thế
cho TestFlight trên Windows).

### Cách đăng ký
1. Vào https://developer.apple.com/programs/enroll/
2. Đăng nhập bằng Apple ID (bật sẵn xác thực 2 bước / 2FA).
3. Chọn loại tài khoản: **Individual** (cá nhân) là nhanh & đơn giản nhất.
4. Thanh toán 99$/năm. Apple duyệt thường trong vài giờ → 48h.
5. Sau khi được duyệt, đăng nhập https://appstoreconnect.apple.com và bấm đồng ý các thỏa thuận
   (Agreements) nếu được nhắc.

## Sau khi có tài khoản Apple Developer — chạy 3 bước sau

> Gõ ngay trong khung chat của Claude Code, có dấu `!` ở đầu để Claude thấy được output.
> Tất cả lệnh chạy trong thư mục `my-expo-ios-app`.

### 1) Đảm bảo đã đăng nhập Expo (đã đăng nhập sẵn là `vuvanquyen27`)
```
! eas whoami
```

### 2) Build bản production cho iOS (build + tự nộp TestFlight luôn)
```
! eas build --platform ios --profile production --auto-submit
```
Trong quá trình này EAS sẽ hỏi:
- “Log in to your Apple account?” → **Yes** → nhập Apple ID + mã 2FA.
- EAS **tự tạo** chứng chỉ phân phối (Distribution Certificate), Provisioning Profile,
  đăng ký Bundle ID, và tạo app record trên App Store Connect nếu chưa có.
- Build chạy trên cloud ~10–20 phút. Khi xong, `--auto-submit` tự đẩy file `.ipa` lên TestFlight.

> Nếu muốn tách riêng: bỏ `--auto-submit` ở lệnh build, rồi sau khi build xong chạy:
> ```
> ! eas submit --platform ios --profile production --latest
> ```

### 3) Bật build trong TestFlight & thêm người test
1. Vào https://appstoreconnect.apple.com → **My Apps** → DSCITY → tab **TestFlight**.
2. Đợi build chuyển từ trạng thái “Processing” sang sẵn sàng (~5–15 phút).
3. Có thể cần điền **Export Compliance** (chọn “No” nếu app không dùng mã hóa đặc biệt).
4. **Internal Testing** (nhanh, không cần Apple duyệt, tối đa 100 người trong team):
   - Thêm chính Apple ID của bạn vào nhóm Internal Testers.
   - Trên iPhone, cài app **TestFlight** từ App Store → đăng nhập đúng Apple ID đó → tải DSCITY về.
5. **External Testing** (mời người ngoài bằng email/link): cần Apple duyệt beta (Beta App Review),
   thường 1 ngày.

## Ghi chú
- Mỗi lần sửa code và muốn bản mới: chỉ cần chạy lại bước (2). Số build tự tăng (autoIncrement).
- `react-native-maps` trên iOS dùng Apple Maps mặc định nên 2 key Google Maps placeholder trong
  `app.json` không làm hỏng build. Muốn dùng Google Maps thì thay key thật sau.
