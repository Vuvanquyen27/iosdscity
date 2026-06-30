/**
 * DSCITY — Mở chỉ đường bằng ứng dụng bản đồ ngoài.
 *
 * Ưu tiên app Google Maps (comgooglemaps://); nếu máy không có thì rơi về
 * link Google Maps trên web (tự mở app Maps hoặc trình duyệt). Trên iOS còn
 * có lựa chọn cuối cùng là Apple Maps để luôn mở được.
 */

import { router } from 'expo-router';
import { Linking, Platform } from 'react-native';

import type { LatLng } from '@/data/mock';

/**
 * Mở tab Bản đồ trong app và canh giữa vào địa điểm này (hiện thẻ chỉ đường).
 * Dùng cho các màn khác (Trang chủ, Chi tiết) khi muốn "xem trên bản đồ".
 *
 * Truyền kèm toạ độ + tên để bản đồ canh được ngay cả khi địa điểm chưa nằm
 * trong danh sách đã nạp; `ts` là nonce để bấm lại CÙNG địa điểm vẫn canh lại.
 */
export function viewPlaceOnMap(place: {
  id: string;
  name: string;
  coordinate: LatLng;
}): void {
  router.push({
    pathname: '/map',
    params: {
      focusId: place.id,
      focusLat: String(place.coordinate.latitude),
      focusLng: String(place.coordinate.longitude),
      focusName: place.name,
      ts: String(Date.now()),
    },
  });
}

/**
 * Mở chỉ đường lái xe tới điểm đích.
 *
 * @param dest  Toạ độ bãi đỗ.
 * @param label Tên hiển thị trên app bản đồ (tuỳ chọn).
 */
export async function openDirections(dest: LatLng, label?: string): Promise<void> {
  const latLng = `${dest.latitude},${dest.longitude}`;
  const q = label ? encodeURIComponent(label) : latLng;

  const googleApp = `comgooglemaps://?daddr=${latLng}&directionsmode=driving`;
  const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=driving`;
  const appleMaps = `http://maps.apple.com/?daddr=${latLng}&q=${q}`;

  // 1) Thử mở app Google Maps.
  try {
    if (await Linking.canOpenURL(googleApp)) {
      await Linking.openURL(googleApp);
      return;
    }
  } catch {
    /* bỏ qua — thử cách kế tiếp */
  }

  // 2) Link Google Maps phổ thông (mở app nếu có, không thì trình duyệt).
  try {
    await Linking.openURL(googleWeb);
    return;
  } catch {
    /* bỏ qua — thử cách kế tiếp */
  }

  // 3) Apple Maps (chỉ iOS) như phương án cuối.
  if (Platform.OS === 'ios') {
    try {
      await Linking.openURL(appleMaps);
    } catch {
      /* hết cách mở */
    }
  }
}
