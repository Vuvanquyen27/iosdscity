/**
 * DSCITY — Tiện ích địa lý (geo).
 *
 * Tính khoảng cách thực giữa hai toạ độ và định dạng cho dễ đọc.
 * Dùng để cập nhật khoảng cách từ vị trí của tôi tới từng bãi đỗ.
 */

import type { LatLng } from '@/data/mock';

const EARTH_RADIUS_M = 6_371_000; // bán kính Trái Đất (mét)

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Khoảng cách đường chim bay giữa hai điểm (công thức Haversine), tính bằng mét.
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Định dạng khoảng cách: <1km hiển thị theo mét ("120m"), còn lại theo km
 * một chữ số thập phân kiểu Việt Nam ("1,2km").
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10}m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1).replace('.', ',')}km`;
}

/** Khoảng cách từ vị trí của tôi tới điểm đích, đã định dạng. */
export function distanceTo(from: LatLng, to: LatLng): string {
  return formatDistance(haversineMeters(from, to));
}
