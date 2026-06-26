/**
 * DSCITY — Tra ảnh phương tiện theo TÊN (lấy online).
 *
 * Mục tiêu: khi đổi / nhập tên một chiếc xe, app tự lấy ảnh chiếc xe đó từ
 * Internet (Google hoặc Wikipedia) thay vì ảnh tĩnh. Dùng cho mọi loại xe.
 *
 * Thứ tự ưu tiên:
 *   1) Google Programmable Search (Image) — chỉ chạy khi đã điền apiKey + cx.
 *   2) Wikipedia (ảnh đại diện của trang khớp nhất) — miễn phí, không cần khoá.
 * Không tìm được -> trả null để caller dùng ảnh fallback (ảnh mock).
 */
import type { VehicleKind } from '@/data/mock';

/**
 * Điền khoá để BẬT tìm ảnh bằng Google (giống ảnh trên Google Hình ảnh).
 * Lấy khoá tại: https://developers.google.com/custom-search/v1/overview
 *   - apiKey: API key của "Custom Search JSON API" (Google Cloud Console).
 *   - cx:     ID của Programmable Search Engine — nhớ bật "Image search"
 *             và "Search the entire web". (Miễn phí 100 lượt/ngày.)
 * Để trống cả hai -> tự fallback sang Wikipedia.
 */
export const GOOGLE_IMAGE_SEARCH = {
  apiKey: '',
  cx: '',
};

/** Cache theo query để không gọi mạng lại cho cùng một tên xe. */
const cache = new Map<string, string | null>();

/** Từ khoá phụ giúp công cụ tìm đúng loại phương tiện. */
function kindHint(kind: VehicleKind): string {
  return kind === 'car' ? 'car' : 'motorcycle';
}

/** Nguồn 1 — Google Custom Search (Image). Null nếu chưa cấu hình / lỗi. */
async function fromGoogle(query: string): Promise<string | null> {
  const { apiKey, cx } = GOOGLE_IMAGE_SEARCH;
  if (!apiKey || !cx) return null;
  const url =
    'https://www.googleapis.com/customsearch/v1?searchType=image&num=1' +
    `&key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}` +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.items?.[0]?.link ?? null;
}

/** Nguồn 2 — Wikipedia: tìm trang khớp nhất rồi lấy ảnh đại diện. */
async function fromWikipedia(query: string): Promise<string | null> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=1000' +
    `&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const pages = json?.query?.pages;
  if (!pages) return null;
  const first = Object.values(pages)[0] as { thumbnail?: { source?: string } } | undefined;
  return first?.thumbnail?.source ?? null;
}

/** Tra ảnh theo tên xe + loại xe. Có cache; an toàn lỗi (trả null). */
export async function fetchVehicleImage(
  name: string,
  kind: VehicleKind
): Promise<string | null> {
  const query = `${name} ${kindHint(kind)}`.trim();
  if (cache.has(query)) return cache.get(query) ?? null;

  let url: string | null = null;
  try {
    url = (await fromGoogle(query)) ?? (await fromWikipedia(query));
  } catch {
    url = null;
  }
  cache.set(query, url);
  return url;
}
