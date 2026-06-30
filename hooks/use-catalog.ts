/**
 * DSCITY — Hook nạp dữ liệu DANH MỤC từ Supabase (đọc công khai).
 *
 * Mỗi hook trả `{ data, loading, error }`. Khoảng cách tới bãi đỗ KHÔNG tính ở
 * đây — màn hình tự tính theo vị trí thật (distanceTo) như trước, nên các hook
 * này chỉ nạp dữ liệu thô một lần (không phụ thuộc vị trí → không gọi lại liên tục).
 *
 * Dùng: `const { data: places, loading } = useParkingLots();`
 */
import { useEffect, useState } from 'react';

import type { Place, Trip, Vehicle, VehicleKind } from '@/data/mock';
import {
  fetchParkingLot,
  fetchParkingLots,
  fetchTrips,
  fetchVehicle,
  fetchVehicles,
} from '@/services/api';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

/** Chạy `run` khi `deps` đổi; trả {data, loading, error}. `initial` là giá trị đầu. */
function useAsync<T>(run: () => Promise<T>, initial: T, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: initial, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    run()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: Error) => {
        if (!cancelled) setState({ data: initial, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

/** Tất cả bãi đỗ đối tác (đặt + thanh toán được). */
export function useParkingLots(): AsyncState<Place[]> {
  return useAsync<Place[]>(() => fetchParkingLots(), [], []);
}

/** Một bãi đỗ theo id (null khi không có / đang tải). */
export function useParkingLot(id?: string): AsyncState<Place | null> {
  return useAsync<Place | null>(() => (id ? fetchParkingLot(id) : Promise.resolve(null)), null, [id]);
}

/** Danh sách xe (lọc theo loại nếu truyền `kind`). */
export function useVehicles(kind?: VehicleKind): AsyncState<Vehicle[]> {
  return useAsync<Vehicle[]>(() => fetchVehicles(kind), [], [kind]);
}

/** Một xe theo id (null khi không có / đang tải). */
export function useVehicle(id?: string): AsyncState<Vehicle | null> {
  return useAsync<Vehicle | null>(() => (id ? fetchVehicle(id) : Promise.resolve(null)), null, [id]);
}

/** Các chuyến đi chung đang mở. */
export function useTrips(): AsyncState<Trip[]> {
  return useAsync<Trip[]>(() => fetchTrips(), [], []);
}
