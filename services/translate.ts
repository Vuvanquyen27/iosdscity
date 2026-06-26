/**
 * DSCITY — Dịch văn bản online (đa ngôn ngữ).
 *
 * Dùng endpoint dịch MIỄN PHÍ của Google (không cần API key) để dịch chuỗi
 * giao diện / dữ liệu sang ngôn ngữ bất kỳ trong danh sách LANGUAGES.
 * Cùng tinh thần với services/vehicle-image.ts: ưu tiên nguồn miễn phí,
 * an toàn lỗi (fallback giữ nguyên text), có cache để khỏi gọi mạng lại.
 *
 * Cache 2 tầng:
 *   1) Bộ nhớ (Map)        — nhanh, sống trong phiên chạy.
 *   2) Ổ đĩa (AsyncStorage) — bền, theo cặp (source → target).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Endpoint dịch không cần khoá (client "gtx" của Google Translate). */
const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const CACHE_PREFIX = 'dscity:tr:';

/** Cache bộ nhớ: `${source}|${target}|${text}` -> bản dịch. */
const mem = new Map<string, string>();

function memKey(source: string, target: string, text: string): string {
  return `${source}|${target}|${text}`;
}

/** Dịch MỘT chuỗi. Trả lại text gốc nếu lỗi mạng hoặc cùng ngôn ngữ. */
export async function translateText(
  text: string,
  target: string,
  source = 'en'
): Promise<string> {
  if (!text || target === source) return text;

  const k = memKey(source, target, text);
  const hit = mem.get(k);
  if (hit !== undefined) return hit;

  const url =
    `${ENDPOINT}?client=gtx&dt=t` +
    `&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}` +
    `&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    // json[0] = [[segment, original, ...], ...] → nối các segment lại.
    const out: string = Array.isArray(json?.[0])
      ? json[0].map((s: unknown[]) => (s?.[0] as string) ?? '').join('')
      : text;
    mem.set(k, out);
    return out;
  } catch {
    return text; // lỗi -> giữ nguyên, không làm vỡ giao diện
  }
}

/**
 * Dịch NHIỀU chuỗi sang `target`, trả map { textGốc -> bảnDịch }.
 *
 * Đọc cache ổ đĩa cho cặp (source, target) trước, chỉ gọi mạng cho chuỗi
 * còn thiếu (chạy song song), rồi ghi cache lại.
 */
export async function translateBatch(
  texts: string[],
  target: string,
  source = 'en'
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (target === source) {
    for (const t of texts) result[t] = t;
    return result;
  }

  // 1) Nạp cache ổ đĩa cho cặp ngôn ngữ này.
  const diskKey = `${CACHE_PREFIX}${source}-${target}`;
  let disk: Record<string, string> = {};
  try {
    const raw = await AsyncStorage.getItem(diskKey);
    if (raw) disk = JSON.parse(raw);
  } catch {
    /* bỏ qua lỗi đọc cache */
  }

  // 2) Tách phần đã có sẵn và phần cần dịch.
  const missing: string[] = [];
  for (const t of texts) {
    const cached = disk[t] ?? mem.get(memKey(source, target, t));
    if (cached !== undefined) {
      result[t] = cached;
      mem.set(memKey(source, target, t), cached);
    } else {
      missing.push(t);
    }
  }

  // 3) Dịch song song phần còn thiếu rồi cập nhật cache.
  if (missing.length) {
    const translated = await Promise.all(
      missing.map((t) => translateText(t, target, source))
    );
    missing.forEach((t, i) => {
      result[t] = translated[i];
      disk[t] = translated[i];
    });
    try {
      await AsyncStorage.setItem(diskKey, JSON.stringify(disk));
    } catch {
      /* bỏ qua lỗi ghi cache */
    }
  }

  return result;
}
