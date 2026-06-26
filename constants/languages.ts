/**
 * DSCITY — Danh sách ngôn ngữ hỗ trợ trong phần Cài đặt (vài chục quốc gia).
 *
 * `vi` và `en` có sẵn bản dịch tĩnh trong i18n (nhanh, offline). Các ngôn ngữ
 * còn lại được dịch ONLINE qua services/translate.ts dựa trên bản tiếng Anh.
 * `code` dùng cho cả khoá i18n lẫn tham số `tl` của API dịch Google.
 */
export interface LanguageOption {
  /** Mã ISO (vi, en, fr, …) — cũng là `tl` cho API dịch. */
  code: string;
  /** Tên tiếng Anh (để tìm kiếm). */
  label: string;
  /** Tên bản địa — hiển thị cho người dùng. */
  native: string;
  /** Emoji cờ quốc gia. */
  flag: string;
}

/** ~40 ngôn ngữ phổ biến. vi/en đứng đầu (có bản dịch tĩnh). */
export const LANGUAGES: LanguageOption[] = [
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'zh-CN', label: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'th', label: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  { code: 'km', label: 'Khmer', native: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', label: 'Lao', native: 'ລາວ', flag: '🇱🇦' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', label: 'Filipino', native: 'Filipino', flag: '🇵🇭' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'fa', label: 'Persian', native: 'فارسی', flag: '🇮🇷' },
  { code: 'he', label: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
  { code: 'el', label: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'sv', label: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'no', label: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
  { code: 'da', label: 'Danish', native: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', label: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  { code: 'cs', label: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', label: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', label: 'Romanian', native: 'Română', flag: '🇷🇴' },
  { code: 'uk', label: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  { code: 'bg', label: 'Bulgarian', native: 'Български', flag: '🇧🇬' },
  { code: 'hr', label: 'Croatian', native: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sk', label: 'Slovak', native: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sr', label: 'Serbian', native: 'Српски', flag: '🇷🇸' },
  { code: 'sw', label: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
];

/** Tra nhanh ngôn ngữ theo mã. */
export const LANGUAGE_BY_CODE: Record<string, LanguageOption> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l])
);
