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

/**
 * Giới hạn cho mỗi request GỘP. Cố ý để NHỎ: nhiều chuỗi nhỏ chạy SONG SONG
 * nhanh hơn hẳn 1 request lớn (server dịch khối lớn rất chậm ~1s, còn vài
 * request nhỏ ~50–150ms). ~10–12 chuỗi/lần là điểm tối ưu và vừa số kết nối
 * đồng thời mà iOS/Android cho phép -> đổi ngôn ngữ mượt.
 */
const MAX_CHUNK_ITEMS = 12;
const MAX_CHUNK_CHARS = 800;
/** Ký tự ngăn cách khi gộp nhiều chuỗi (không xuất hiện trong nguồn). */
const SEP = '\n';

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
 * Dịch một NHÓM chuỗi trong DUY NHẤT 1 request (gộp bằng ký tự xuống dòng).
 * Endpoint giữ nguyên số dòng nên tách lại theo SEP là khớp. Nếu số dòng trả
 * về không khớp (hiếm) -> fallback dịch từng chuỗi để bảo đảm đúng thứ tự.
 */
async function translateChunk(
  chunk: string[],
  target: string,
  source: string
): Promise<string[]> {
  if (chunk.length === 1) return [await translateText(chunk[0], target, source)];

  const url =
    `${ENDPOINT}?client=gtx&dt=t` +
    `&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}` +
    `&q=${encodeURIComponent(chunk.join(SEP))}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.[0])) {
        const joined: string = json[0].map((s: unknown[]) => (s?.[0] as string) ?? '').join('');
        const parts = joined.split(SEP);
        if (parts.length === chunk.length) return parts;
      }
    }
  } catch {
    /* rơi xuống fallback dưới */
  }
  // Fallback an toàn: dịch từng chuỗi riêng.
  return Promise.all(chunk.map((t) => translateText(t, target, source)));
}

/** Chia danh sách thành các nhóm theo giới hạn số lượng + độ dài. */
function chunkByBudget(items: string[]): string[][] {
  const chunks: string[][] = [];
  let cur: string[] = [];
  let curChars = 0;
  for (const it of items) {
    const len = it.length + SEP.length;
    if (cur.length && (cur.length >= MAX_CHUNK_ITEMS || curChars + len > MAX_CHUNK_CHARS)) {
      chunks.push(cur);
      cur = [];
      curChars = 0;
    }
    cur.push(it);
    curChars += len;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

/**
 * Dịch NHIỀU chuỗi sang `target`, trả map { textGốc -> bảnDịch }.
 *
 * Đọc cache ổ đĩa trước, chỉ dịch phần còn thiếu — GỘP vào vài request
 * (mỗi request nhiều chuỗi) chạy song song, rồi ghi cache lại.
 *
 * `onPartial` (tuỳ chọn) được gọi ngay sau MỖI nhóm dịch xong với ảnh chụp
 * kết quả tới thời điểm đó -> cho phép giao diện cập nhật DẦN, không phải chờ
 * dịch xong toàn bộ.
 */
export async function translateBatch(
  texts: string[],
  target: string,
  source = 'en',
  onPartial?: (partial: Record<string, string>) => void
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

  // 2) Tách phần đã có sẵn và phần cần dịch (bỏ trùng lặp).
  const missing: string[] = [];
  const seen = new Set<string>();
  for (const t of texts) {
    const cached = disk[t] ?? mem.get(memKey(source, target, t));
    if (cached !== undefined) {
      result[t] = cached;
      mem.set(memKey(source, target, t), cached);
    } else if (!seen.has(t)) {
      seen.add(t);
      missing.push(t);
    }
  }

  // Áp ngay phần đã có trong cache (nếu có) trước khi gọi mạng.
  if (onPartial && Object.keys(result).length) onPartial({ ...result });

  // 3) Gộp phần còn thiếu thành vài request CHẠY SONG SONG; mỗi nhóm xong là
  //    cập nhật ngay (onPartial) thay vì chờ tất cả -> giao diện đổi dần, nhanh.
  if (missing.length) {
    const chunks = chunkByBudget(missing);
    await Promise.all(
      chunks.map(async (chunk) => {
        const out = await translateChunk(chunk, target, source);
        chunk.forEach((t, j) => {
          const val = out[j] ?? t;
          result[t] = val;
          disk[t] = val;
          mem.set(memKey(source, target, t), val);
        });
        onPartial?.({ ...result });
      })
    );
    try {
      await AsyncStorage.setItem(diskKey, JSON.stringify(disk));
    } catch {
      /* bỏ qua lỗi ghi cache */
    }
  }

  return result;
}
