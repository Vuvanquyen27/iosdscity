/**
 * DSCITY — Hook lấy bãi đỗ "khám phá" từ Google Places quanh tâm khung nhìn.
 *
 * - Chỉ chạy khi đã cấu hình key (services/places). Chưa có key → trả [] và app
 *   dùng dữ liệu mock như cũ.
 * - Debounce + ngưỡng khoảng cách: chỉ gọi lại API khi tâm bản đồ dời > ~500m,
 *   tránh spam request lúc người dùng lướt bản đồ.
 */

import { useEffect, useRef, useState } from 'react';

import type { LatLng, Place } from '@/data/mock';
import { haversineMeters } from '@/services/geo';
import { fetchNearbyParking, hasPlacesKey } from '@/services/places';

const MIN_REFETCH_METERS = 500; // tâm dời ít hơn mức này thì giữ kết quả cũ
const DEBOUNCE_MS = 500;

export function useNearbyParking(center: LatLng | null, radius = 2000): Place[] {
  const [result, setResult] = useState<Place[]>([]);
  const lastCenter = useRef<LatLng | null>(null);

  const lat = center?.latitude;
  const lng = center?.longitude;

  useEffect(() => {
    if (lat == null || lng == null || !hasPlacesKey()) return;
    const here: LatLng = { latitude: lat, longitude: lng };
    if (
      lastCenter.current &&
      haversineMeters(lastCenter.current, here) < MIN_REFETCH_METERS
    ) {
      return; // chưa dời đủ xa → khỏi gọi lại
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      const list = await fetchNearbyParking(here, radius);
      if (cancelled) return;
      lastCenter.current = here;
      setResult(list);
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [lat, lng, radius]);

  return result;
}
