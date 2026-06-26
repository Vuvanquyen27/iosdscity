/**
 * DSCITY — Hook lấy vị trí thực của thiết bị (expo-location).
 *
 * Xin quyền vị trí khi-dùng, lấy vị trí hiện tại rồi theo dõi liên tục để
 * khoảng cách tới bãi đỗ tự cập nhật khi người dùng di chuyển.
 *
 * Khi chưa có quyền / chưa lấy được, `location` là null — màn hình tự rơi về
 * vị trí giả lập (MY_LOCATION) để giao diện vẫn chạy.
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LatLng } from '@/data/mock';

export type LocationStatus = 'loading' | 'granted' | 'denied';

interface UseLocationResult {
  /** Vị trí thực, hoặc null nếu chưa có quyền/đang lấy. */
  location: LatLng | null;
  /** Trạng thái quyền + tiến trình lấy vị trí. */
  status: LocationStatus;
  /** Xin quyền lại + lấy vị trí (gọi khi người dùng bấm nút định vị). */
  refresh: () => void;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationStatus>('loading');
  const subRef = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    setStatus('loading');
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      setStatus('denied');
      return;
    }
    setStatus('granted');

    // Lấy ngay vị trí hiện tại để không phải chờ lần cập nhật đầu.
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      /* bỏ qua — sẽ nhận từ watch bên dưới */
    }

    // Theo dõi: cập nhật mỗi khi di chuyển ~25m.
    subRef.current?.remove();
    subRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
      (loc) =>
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
    );
  }, []);

  useEffect(() => {
    start();
    return () => subRef.current?.remove();
  }, [start]);

  return { location, status, refresh: start };
}
