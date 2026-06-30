/**
 * DSCITY — Lớp "khám phá" bãi đỗ từ Google Places API (New).
 *
 * Hướng B (lai): Google lo phần "có bãi đỗ nào, ở đâu" trên toàn quốc — CHỈ để
 * xem + chỉ đường. Còn bãi ĐỐI TÁC (data/mock.ts, sau này là backend riêng) mới
 * có giá thật, chỗ trống thật và đặt chỗ + thanh toán trong app.
 *
 * Cấu hình key (1 trong 2 cách, ưu tiên cách 1):
 *   1) app.json  →  expo.extra.googlePlacesApiKey
 *   2) biến môi trường  EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
 * Key này là key Google Cloud đã BẬT "Places API (New)". Chưa có key → mọi hàm
 * trả rỗng và app rơi về dữ liệu mock như cũ (không crash).
 *
 * Lưu ý ToS Google: chỉ được lưu lâu dài `place_id`; KHÔNG dựng database riêng từ
 * các field khác. Ở đây chỉ cache trong RAM cho từng phiên dùng.
 */

import Constants from 'expo-constants';

import { type LatLng, type Place } from '@/data/mock';
import { formatDistance, haversineMeters } from '@/services/geo';

const API_KEY: string =
  (Constants.expoConfig?.extra as { googlePlacesApiKey?: string } | undefined)
    ?.googlePlacesApiKey ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
  '';

/** Đã cấu hình key Places chưa? (chưa thì caller dùng mock). */
export const hasPlacesKey = (): boolean => API_KEY.length > 0;

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchNearby';
const TEXT_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

// Chỉ xin đúng field cần dùng — Places API (New) tính tiền theo field mask.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.regularOpeningHours.openNow',
].join(',');

// Ảnh mặc định khi bãi không có photo trên Google.
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=60';

// Cache RAM theo phiên: để màn chi tiết tra lại bãi Google theo id sau khi map đã nạp.
const cache = new Map<string, Place>();

/** Tra bãi GOOGLE đã nạp trong phiên (RAM cache). Bãi đối tác lấy từ Supabase (useParkingLot). */
export function getPlaceById(id: string): Place | undefined {
  return cache.get(id);
}

/** URL ảnh từ photo "name" của Places API (New). Trả ảnh mặc định nếu không có. */
function photoUrl(name: string | undefined): string {
  if (!name) return FALLBACK_IMAGE;
  return `https://places.googleapis.com/v1/${name}/media?maxHeightPx=600&maxWidthPx=800&key=${API_KEY}`;
}

interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  photos?: { name?: string }[];
  regularOpeningHours?: { openNow?: boolean };
}

function toPlace(g: GooglePlace, center: LatLng): Place {
  const coordinate: LatLng = {
    latitude: g.location?.latitude ?? center.latitude,
    longitude: g.location?.longitude ?? center.longitude,
  };
  const openNow = g.regularOpeningHours?.openNow;
  return {
    id: g.id,
    source: 'google',
    name: g.displayName?.text ?? 'Bãi đỗ xe',
    coordinate,
    distance: formatDistance(haversineMeters(center, coordinate)),
    address: g.formattedAddress,
    rating: typeof g.rating === 'number' ? g.rating : undefined,
    reviews: typeof g.userRatingCount === 'number' ? g.userRatingCount : undefined,
    openHours:
      openNow === true ? 'Đang mở cửa' : openNow === false ? 'Đã đóng cửa' : undefined,
    image: photoUrl(g.photos?.[0]?.name),
  };
}

/** Kết quả tìm địa điểm theo chữ (tên quán/doanh nghiệp/địa chỉ). */
export interface TextSearchHit {
  id: string;
  name: string;
  address?: string;
  coordinate: LatLng;
}

/**
 * Tìm địa điểm BẤT KỲ theo chữ (Places Text Search - New). Hợp cho tên quán/
 * doanh nghiệp như "One Coffee" mà geocode thường (theo địa chỉ) không ra.
 *
 * `near` để THIÊN VỊ kết quả quanh vị trí người dùng → tránh ra nhầm địa điểm
 * cùng tên ở nước ngoài. Trả [] khi chưa có key hoặc lỗi (caller tự rơi về geocode OS).
 */
export async function searchPlacesByText(
  query: string,
  near?: LatLng | null,
  radius = 30000
): Promise<TextSearchHit[]> {
  if (!hasPlacesKey()) return [];
  const q = query.trim();
  if (!q) return [];
  try {
    const body: Record<string, unknown> = {
      textQuery: q,
      languageCode: 'vi',
      regionCode: 'VN',
      maxResultCount: 5,
    };
    if (near) {
      body.locationBias = {
        circle: {
          center: { latitude: near.latitude, longitude: near.longitude },
          radius: Math.min(50000, Math.max(1, radius)),
        },
      };
    }
    const res = await fetch(TEXT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
        ].join(','),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: GooglePlace[] };
    return (data.places ?? [])
      .filter((g) => g.location)
      .map((g) => ({
        id: g.id,
        name: g.displayName?.text ?? q,
        address: g.formattedAddress,
        coordinate: {
          latitude: g.location!.latitude,
          longitude: g.location!.longitude,
        },
      }));
  } catch {
    return [];
  }
}

/**
 * Tra ĐỊA ĐIỂM GẦN NHẤT quanh một toạ độ (Places Nearby, xếp theo khoảng cách) —
 * để đặt ĐÚNG TÊN cho ghim thả bằng nhấn giữ thay vì chỉ địa chỉ. Không lọc loại
 * nên trả về quán/cửa hàng/toà nhà… gần nhất. Trả null khi chưa có key/không có gì.
 */
export async function reverseNearestPlace(
  coordinate: LatLng,
  radius = 120
): Promise<TextSearchHit | null> {
  if (!hasPlacesKey()) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
        ].join(','),
      },
      body: JSON.stringify({
        maxResultCount: 1,
        rankPreference: 'DISTANCE',
        languageCode: 'vi',
        regionCode: 'VN',
        locationRestriction: {
          circle: {
            center: { latitude: coordinate.latitude, longitude: coordinate.longitude },
            radius: Math.min(50000, Math.max(1, radius)),
          },
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { places?: GooglePlace[] };
    const g = data.places?.[0];
    if (!g?.location) return null;
    return {
      id: g.id,
      name: g.displayName?.text ?? '',
      address: g.formattedAddress,
      coordinate: { latitude: g.location.latitude, longitude: g.location.longitude },
    };
  } catch {
    return null;
  }
}

/**
 * Tìm bãi đỗ quanh `center` trong bán kính `radius` mét (Google giới hạn ≤ 50.000m).
 * Trả [] khi chưa có key hoặc lỗi mạng — caller tự rơi về mock.
 * Kết quả được cache theo id để màn chi tiết tra lại được.
 */
export async function fetchNearbyParking(
  center: LatLng,
  radius = 2000
): Promise<Place[]> {
  if (!hasPlacesKey()) return [];
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: ['parking'],
        maxResultCount: 20,
        languageCode: 'vi',
        regionCode: 'VN',
        locationRestriction: {
          circle: {
            center: { latitude: center.latitude, longitude: center.longitude },
            radius: Math.min(50000, Math.max(1, radius)),
          },
        },
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: GooglePlace[] };
    const list = (data.places ?? []).map((g) => toPlace(g, center));
    list.forEach((p) => cache.set(p.id, p));
    return list;
  } catch {
    return [];
  }
}
