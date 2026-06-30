/**
 * DSCITY — Tra ảnh phương tiện theo TÊN (lấy online).
 *
 * Mục tiêu: khi đổi / nhập tên một chiếc xe, app tự lấy ĐÚNG ảnh chiếc xe đó
 * từ Internet (Google hoặc Wikipedia) thay vì ảnh tĩnh. Dùng cho mọi loại xe.
 *
 * NGUYÊN TẮC "đúng tên ra đúng xe":
 *   - KHÔNG nhét năm ("2024") hay từ loại ("car"/"motorcycle") vào query
 *     Wikipedia — chúng làm nhiễu, dễ khớp trang "List of ..." hoặc logo hãng.
 *   - Lấy NHIỀU ứng viên rồi chấm điểm: chỉ nhận trang có tiêu đề chứa đủ các
 *     từ khoá trong tên xe, và ảnh là ẢNH THẬT (loại logo / .svg / icon).
 *   - Không khớp chắc chắn -> trả null để caller dùng ảnh fallback (ảnh mock).
 *     Thà dùng fallback còn hơn hiển thị sai xe.
 *
 * Thứ tự ưu tiên:
 *   1) Google Programmable Search (Image) — chỉ chạy khi đã điền apiKey + cx.
 *   2) Wikipedia (chọn trang khớp tên nhất, ảnh thật) — miễn phí, không cần khoá.
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

/** Cache theo (tên + loại) để không gọi mạng lại cho cùng một chiếc xe. */
const cache = new Map<string, string | null>();

/** Từ khoá phụ giúp Google tìm đúng loại phương tiện. */
function kindHint(kind: VehicleKind): string {
  return kind === 'car' ? 'car' : 'motorcycle';
}

/** Bỏ năm (1990–2099) và khoảng trắng thừa khỏi tên -> tên gốc của mẫu xe. */
function cleanName(name: string): string {
  return name
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tách tên xe thành các từ khoá có nghĩa (bỏ từ quá ngắn / năm). */
function tokens(name: string): string[] {
  return cleanName(name)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 || /^\d+$/.test(w));
}

/** Ảnh có phải logo / icon / vector (không phải ảnh chụp xe) không? */
function isLogoImage(url: string): boolean {
  return /\.svg(\?|$)/i.test(url) || /(logo|icon|emblem|wordmark)/i.test(url);
}

/** Trang dạng danh sách / định hướng — không có ảnh xe cụ thể. */
function isListPage(title: string): boolean {
  return /^(list of|category:|template:)|disambiguation/i.test(title);
}

type WikiPage = { title: string; index: number; thumbnail?: { source?: string } };

/** Nguồn 1 — Google Custom Search (Image). Null nếu chưa cấu hình / lỗi. */
async function fromGoogle(name: string, kind: VehicleKind): Promise<string | null> {
  const { apiKey, cx } = GOOGLE_IMAGE_SEARCH;
  if (!apiKey || !cx) return null;
  const query = `${name} ${kindHint(kind)}`.trim();
  const url =
    'https://www.googleapis.com/customsearch/v1?searchType=image&num=1' +
    `&key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}` +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.items?.[0]?.link ?? null;
}

/**
 * Nguồn 2 — Wikipedia: lấy nhiều ứng viên rồi chọn trang khớp tên nhất.
 * Chỉ trả ảnh khi tiêu đề trang chứa ĐỦ các từ khoá của tên xe (đúng mẫu xe),
 * ảnh là ảnh thật. Không có ứng viên đạt -> null (để dùng fallback).
 */
async function fromWikipedia(name: string): Promise<string | null> {
  const clean = cleanName(name);
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=1000' +
    `&generator=search&gsrlimit=6&gsrsearch=${encodeURIComponent(clean)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const pages = json?.query?.pages as Record<string, WikiPage> | undefined;
  if (!pages) return null;

  const want = tokens(name);
  const candidates = Object.values(pages)
    .map((p) => {
      const src = p.thumbnail?.source;
      const titleWords = p.title.toLowerCase();
      // Số từ khoá của tên xe xuất hiện trong tiêu đề trang.
      const matched = want.filter((w) => titleWords.includes(w)).length;
      return { title: p.title, index: p.index ?? 99, src, matched };
    })
    // Chỉ giữ trang: có ảnh thật, không phải list/định hướng, và KHỚP ĐỦ tên.
    .filter(
      (c) =>
        c.src &&
        !isLogoImage(c.src) &&
        !isListPage(c.title) &&
        c.matched === want.length
    )
    // Khớp đủ rồi thì ưu tiên theo thứ hạng tìm kiếm (index nhỏ = khớp hơn).
    .sort((a, b) => a.index - b.index);

  return candidates[0]?.src ?? null;
}

/** Tra ảnh theo tên xe + loại xe. Có cache; an toàn lỗi (trả null). */
export async function fetchVehicleImage(
  name: string,
  kind: VehicleKind
): Promise<string | null> {
  const key = `${kind}:${cleanName(name).toLowerCase()}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  let url: string | null = null;
  try {
    url = (await fromGoogle(name, kind)) ?? (await fromWikipedia(name));
  } catch {
    url = null;
  }
  cache.set(key, url);
  return url;
}
