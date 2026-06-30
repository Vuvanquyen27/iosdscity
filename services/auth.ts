/**
 * DSCITY — Xác thực (Supabase Auth).
 *
 * App đang đăng nhập bằng SỐ ĐIỆN THOẠI + mật khẩu (xem app/login.tsx). Supabase
 * hỗ trợ phone+password (cần bật SMS provider) hoặc OTP. Ở đây bọc sẵn các hàm
 * thường dùng; có thêm email/Google/Apple để dùng dần.
 *
 * Lưu ý: trigger handle_new_user (0002_functions.sql) tự tạo profile + preferences
 * khi đăng ký, lấy full_name/phone/avatar từ `options.data` truyền vào signUp.
 */
import { supabase } from '@/lib/supabase';

/** Đăng ký bằng số điện thoại + mật khẩu. Tên hiển thị lưu vào metadata. */
export async function signUpWithPhone(phone: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
    options: { data: { full_name: fullName, phone } },
  });
  if (error) throw error;
  return data;
}

/** Đăng nhập bằng số điện thoại + mật khẩu. */
export async function signInWithPhone(phone: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
  if (error) throw error;
  return data;
}

/** Đăng nhập/đăng ký bằng email + mật khẩu (dự phòng khi chưa bật SMS). */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Gửi OTP qua SMS (luồng không mật khẩu). */
export async function sendPhoneOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

/** Xác minh OTP đã nhận. */
export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Session hiện tại (null nếu chưa đăng nhập). */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Lắng nghe thay đổi đăng nhập (gắn ở RootLayout để điều hướng login/home). */
export function onAuthChange(cb: (signedIn: boolean) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(!!session);
  });
  return () => data.subscription.unsubscribe();
}
