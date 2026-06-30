/**
 * DSCITY — Tra cứu địa điểm bất kỳ bằng geocode của hệ điều hành (expo-location).
 *
 * KHÔNG cần Google API key: trên iOS dùng bộ geocode của Apple, trên Android dùng
 * dịch vụ hệ thống. Nhờ vậy người dùng tìm/được chỉ đường tới MỌI địa điểm (không
 * chỉ bãi đỗ đối tác), việc dẫn đường thật vẫn do Google Maps ngoài đảm nhiệm
 * (services/maps.ts → openDirections).
 *
 * Lưu ý: geocode tốn tài nguyên, chỉ gọi khi người dùng chủ động tìm / nhấn giữ,
 * không gọi liên tục. Cần quyền vị trí (app đã xin ở hooks/use-location).
 */

import * as Location from 'expo-location';

import type { LatLng } from '@/data/mock';
import { haversineMeters } from '@/services/geo';
import { reverseNearestPlace, searchPlacesByText } from '@/services/places';

/** Ghép các thành phần địa chỉ thành nhãn ngắn dễ đọc.
 *  `formattedAddress` chỉ có trên Android nên iOS phải tự ghép. */
function formatLabel(a: Location.LocationGeocodedAddress): string {
  if (a.formattedAddress) return a.formattedAddress;
  const line1 = a.name || [a.streetNumber, a.street].filter(Boolean).join(' ');
  const line2 = [a.district, a.city].filter(Boolean).join(', ');
  return [line1, line2].filter((s) => !!s && s.length > 0).join(', ');
}

/** Khu vực của người dùng dạng "Quận 1, Hồ Chí Minh, Việt Nam" — để kèm vào câu
 *  geocode cho khỏi nhảy ra địa điểm cùng tên ở nơi khác. Rỗng nếu không tra được. */
async function localityOf(near: LatLng): Promise<string> {
  try {
    const a = (await Location.reverseGeocodeAsync(near))[0];
    if (!a) return '';
    return [a.district || a.subregion, a.city || a.region, a.country]
      .filter((s) => !!s && s.length > 0)
      .join(', ');
  } catch {
    return '';
  }
}

/**
 * Tìm địa điểm theo tên/địa chỉ bất kỳ → toạ độ + nhãn. `near` (vị trí người dùng)
 * dùng để THIÊN VỊ kết quả về gần đó. Trả null nếu không tìm thấy hoặc lỗi.
 *
 * 1) Ưu tiên Google Places Text Search — đúng cho tên quán/doanh nghiệp (vd.
 *    "One Coffee"); kết quả được ghim quanh `near`. Chỉ chạy khi đã cấu hình key.
 * 2) Không có key (hoặc không ra) → geocode hệ điều hành: kèm tên khu vực để khỏi
 *    nhảy ra nước ngoài, và nếu có nhiều kết quả thì chọn cái GẦN người dùng nhất.
 */
export async function geocodePlace(
  query: string,
  near?: LatLng | null
): Promise<{ coordinate: LatLng; name: string } | null> {
  const q = query.trim();
  if (!q) return null;

  // 1) Google Places Text Search (tốt nhất cho tên quán/doanh nghiệp).
  const hits = await searchPlacesByText(q, near);
  if (hits[0]) return { coordinate: hits[0].coordinate, name: hits[0].name };

  // 2) Fallback: geocode hệ điều hành, thiên vị theo khu vực + chọn gần nhất.
  try {
    let results = await Location.geocodeAsync(q);
    if (near) {
      const ctx = await localityOf(near);
      if (ctx) {
        const biased = await Location.geocodeAsync(`${q}, ${ctx}`);
        if (biased.length) results = biased;
      }
      results = [...results].sort(
        (a, b) => haversineMeters(near, a) - haversineMeters(near, b)
      );
    }
    const hit = results[0];
    if (!hit) return null;
    return { coordinate: { latitude: hit.latitude, longitude: hit.longitude }, name: q };
  } catch {
    return null;
  }
}

/**
 * Toạ độ → TÊN địa điểm dễ đọc cho ghim thả (nhấn giữ).
 * 1) Ưu tiên TÊN ĐỊA ĐIỂM THẬT (POI) gần nhất từ Google Places (vd. "One Coffee").
 * 2) Không có key / không có POI gần → địa chỉ từ geocode hệ điều hành.
 * Trả chuỗi rỗng nếu không tra được gì.
 */
export async function describeCoordinate(coordinate: LatLng): Promise<string> {
  const near = await reverseNearestPlace(coordinate);
  if (near?.name) return near.name;
  try {
    const results = await Location.reverseGeocodeAsync(coordinate);
    return results[0] ? formatLabel(results[0]) : '';
  } catch {
    return '';
  }
}
