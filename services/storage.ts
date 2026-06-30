/**
 * DSCITY — Tải tệp lên Supabase Storage (ảnh xe).
 *
 * React Native KHÔNG có Blob/File chuẩn như web, nên cách đáng tin cậy nhất để
 * đẩy ảnh lên Supabase là: lấy chuỗi base64 (từ expo-image-picker) → giải mã
 * thành ArrayBuffer → upload. Ảnh lưu trong bucket công khai `vehicles` nên URL
 * trả về xem được ngay (giống các ảnh xe khác trong danh sách thuê).
 *
 * Yêu cầu hạ tầng (chạy supabase/migrations/0003_vehicle_storage.sql một lần):
 *   - Bucket công khai tên `vehicles`.
 *   - RLS: ai cũng đọc; người đã đăng nhập được upload vào thư mục của mình.
 */
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';

/** Tên bucket ảnh xe trên Supabase Storage. */
export const VEHICLE_BUCKET = 'vehicles';

/** Đuôi ảnh + content-type suy từ mimeType / uri của ảnh đã chọn. */
function resolveExt(mimeType?: string | null, uri?: string): { ext: string; contentType: string } {
  const fromMime = mimeType?.split('/')[1];
  const fromUri = uri?.split('.').pop()?.split('?')[0];
  const raw = (fromMime ?? fromUri ?? 'jpg').toLowerCase();
  const ext = raw === 'jpeg' ? 'jpg' : raw;
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return { ext, contentType };
}

/**
 * Tải ảnh (dạng base64) lên bucket `vehicles`, trả về URL công khai để lưu vào
 * cột `image_url` của bảng vehicles. Ném lỗi nếu chưa đăng nhập hoặc upload hỏng.
 */
export async function uploadVehicleImage(
  base64: string,
  opts?: { mimeType?: string | null; uri?: string }
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Bạn cần đăng nhập để tải ảnh lên.');

  const { ext, contentType } = resolveExt(opts?.mimeType, opts?.uri);
  const rand = Math.random().toString(36).slice(2, 8);
  // Đặt trong thư mục theo user.id → khớp policy "chỉ ghi thư mục của mình".
  const path = `${user.id}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from(VEHICLE_BUCKET)
    .upload(path, decode(base64), { contentType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(VEHICLE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
