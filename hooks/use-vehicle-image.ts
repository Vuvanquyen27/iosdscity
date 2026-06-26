import { useEffect, useState } from 'react';

import type { VehicleKind } from '@/data/mock';
import { fetchVehicleImage } from '@/services/vehicle-image';

/**
 * Lấy ảnh xe theo TÊN (online). Trả `fallback` trong lúc tải và khi không
 * tìm được ảnh. Tự tra lại khi `name` thay đổi -> đổi tên là ảnh đổi theo.
 */
export function useVehicleImage(name: string, kind: VehicleKind, fallback: string): string {
  const [url, setUrl] = useState(fallback);

  useEffect(() => {
    let active = true;
    setUrl(fallback); // hiện ảnh tạm trong lúc tra ảnh theo tên mới
    fetchVehicleImage(name, kind)
      .then((found) => {
        if (active && found) setUrl(found);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [name, kind, fallback]);

  return url;
}
