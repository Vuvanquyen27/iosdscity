/**
 * DSCITY — i18n đa ngôn ngữ.
 *
 * Một LanguageProvider ở root giữ ngôn ngữ toàn cục; mọi màn dùng
 * `useLanguage()` để lấy { lang, setLang, toggle, t, td, languages, loading }.
 *  - t(key):  dịch chuỗi giao diện cố định.
 *  - td(text): dịch dữ liệu mock tiếng Việt (fallback giữ nguyên).
 *
 * Tiếng Việt (vi) và tiếng Anh (en) có bản dịch TĨNH (nhanh, offline).
 * Vài chục ngôn ngữ còn lại (xem constants/languages.ts) được dịch ONLINE
 * từ bản tiếng Anh qua services/translate.ts, có cache để khỏi gọi lại.
 * Lựa chọn được lưu vào AsyncStorage và khôi phục khi mở lại app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { LANGUAGES, type LanguageOption } from '@/constants/languages';
import { translateBatch } from '@/services/translate';

/** Mã ngôn ngữ — 'vi'/'en' đặc biệt (tĩnh), còn lại là mã ISO bất kỳ. */
export type Lang = string;

/** Chuỗi giao diện cố định, key giống nhau giữa 2 ngôn ngữ. */
const UI = {
  vi: {
    'rental.car': 'Thuê ô tô',
    'rental.motorbike': 'Thuê xe máy',
    'rental.price': 'Giá thuê',
    'rental.choosePlan': 'Chọn gói thuê',
    'rental.amenities': 'Tiện ích đi kèm',
    'rental.continue': 'Tiếp tục đặt xe',
    'rental.subtotal': 'Tạm tính',
    'rental.duration': 'Thời lượng thuê',
    'rental.policy': 'Miễn phí huỷ trong 1 giờ · Đặt cọc hoàn lại',
    'duration.hour': 'Số giờ',
    'duration.day': 'Số ngày',
    'duration.week': 'Số tuần',
    'count.hour': 'giờ',
    'count.day': 'ngày',
    'count.week': 'tuần',
    'plan.hour': 'Theo giờ',
    'plan.day': 'Theo ngày',
    'plan.week': 'Theo tuần',
    'plan.hour.caption': 'Linh hoạt cho chuyến ngắn',
    'plan.day.caption': 'Phù hợp đi trong ngày',
    'plan.week.caption': 'Thuê dài ngày tiết kiệm',
    'plan.popular': 'Phổ biến',
    'plan.save': 'Tiết kiệm {n}%',
    'unit.hour': '/giờ',
    'unit.day': '/ngày',
    'unit.week': '/tuần',
    'rating.reviews': 'đánh giá',
    'success.title': 'Đặt xe thành công!',
    'success.subtitle': 'Vui lòng xuất trình mã tại điểm giao xe',
    'lang.switchTo': 'English',

    // --- Cài đặt ---
    'set.title': 'Cài đặt',
    'set.editProfile': 'Chỉnh sửa hồ sơ',
    'set.group.account': 'Tài khoản',
    'set.group.notify': 'Thông báo',
    'set.group.app': 'Ứng dụng',
    'set.group.support': 'Hỗ trợ',
    'set.profile': 'Hồ sơ cá nhân',
    'set.payment': 'Phương thức thanh toán',
    'set.security': 'Bảo mật & mật khẩu',
    'set.push': 'Thông báo đẩy',
    'set.promo': 'Email khuyến mãi',
    'set.dark': 'Chế độ tối',
    'set.location': 'Dịch vụ định vị',
    'set.language': 'Ngôn ngữ',
    'set.help': 'Trung tâm trợ giúp',
    'set.terms': 'Điều khoản sử dụng',
    'set.privacy': 'Chính sách bảo mật',
    'set.about': 'Về DSCITY',
    'set.version': 'Phiên bản 1.0.0',
    'set.logout': 'Đăng xuất',
    'set.logout.confirmTitle': 'Đăng xuất',
    'set.logout.confirmMsg': 'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
    'set.langName': 'Tiếng Việt',

    // chung
    'common.save': 'Lưu thay đổi',
    'common.cancel': 'Huỷ',
    'common.fullName': 'Họ và tên',
    'common.phone': 'Số điện thoại',
    'common.email': 'Email',
    'common.saved': 'Đã lưu thay đổi',

    // hồ sơ
    'profile.hint': 'Cập nhật thông tin liên hệ của bạn.',

    // thanh toán
    'pay.add': 'Thêm phương thức mới',
    'pay.default': 'Mặc định',
    'pay.added': 'Tính năng đang phát triển',

    // bảo mật
    'sec.current': 'Mật khẩu hiện tại',
    'sec.new': 'Mật khẩu mới',
    'sec.confirm': 'Nhập lại mật khẩu mới',
    'sec.change': 'Đổi mật khẩu',
    'sec.biometric': 'Đăng nhập bằng vân tay / Face ID',
    'sec.mismatch': 'Mật khẩu nhập lại không khớp',
    'sec.tooShort': 'Mật khẩu mới cần ít nhất 6 ký tự',
    'sec.changed': 'Đã đổi mật khẩu',

    // ngôn ngữ
    'lang.title': 'Chọn ngôn ngữ',
    'lang.search': 'Tìm ngôn ngữ',
    'lang.empty': 'Không tìm thấy ngôn ngữ',
  },
  en: {
    'rental.car': 'Car rental',
    'rental.motorbike': 'Motorbike rental',
    'rental.price': 'Rental price',
    'rental.choosePlan': 'Choose a plan',
    'rental.amenities': 'Included amenities',
    'rental.continue': 'Continue booking',
    'rental.subtotal': 'Subtotal',
    'rental.duration': 'Rental duration',
    'rental.policy': 'Free cancellation within 1 hour · Refundable deposit',
    'duration.hour': 'Number of hours',
    'duration.day': 'Number of days',
    'duration.week': 'Number of weeks',
    'count.hour': 'hours',
    'count.day': 'days',
    'count.week': 'weeks',
    'plan.hour': 'Hourly',
    'plan.day': 'Daily',
    'plan.week': 'Weekly',
    'plan.hour.caption': 'Flexible for short trips',
    'plan.day.caption': 'Great for a full day',
    'plan.week.caption': 'Save on longer rentals',
    'plan.popular': 'Popular',
    'plan.save': 'Save {n}%',
    'unit.hour': '/hour',
    'unit.day': '/day',
    'unit.week': '/week',
    'rating.reviews': 'reviews',
    'success.title': 'Booking confirmed!',
    'success.subtitle': 'Please present the code at the pickup point',
    'lang.switchTo': 'Tiếng Việt',

    // --- Settings ---
    'set.title': 'Settings',
    'set.editProfile': 'Edit profile',
    'set.group.account': 'Account',
    'set.group.notify': 'Notifications',
    'set.group.app': 'App',
    'set.group.support': 'Support',
    'set.profile': 'Personal profile',
    'set.payment': 'Payment methods',
    'set.security': 'Security & password',
    'set.push': 'Push notifications',
    'set.promo': 'Promotional email',
    'set.dark': 'Dark mode',
    'set.location': 'Location services',
    'set.language': 'Language',
    'set.help': 'Help center',
    'set.terms': 'Terms of use',
    'set.privacy': 'Privacy policy',
    'set.about': 'About DSCITY',
    'set.version': 'Version 1.0.0',
    'set.logout': 'Log out',
    'set.logout.confirmTitle': 'Log out',
    'set.logout.confirmMsg': 'Are you sure you want to log out?',
    'set.langName': 'English',

    // common
    'common.save': 'Save changes',
    'common.cancel': 'Cancel',
    'common.fullName': 'Full name',
    'common.phone': 'Phone number',
    'common.email': 'Email',
    'common.saved': 'Changes saved',

    // profile
    'profile.hint': 'Update your contact details.',

    // payment
    'pay.add': 'Add a new method',
    'pay.default': 'Default',
    'pay.added': 'Feature coming soon',

    // security
    'sec.current': 'Current password',
    'sec.new': 'New password',
    'sec.confirm': 'Confirm new password',
    'sec.change': 'Change password',
    'sec.biometric': 'Sign in with fingerprint / Face ID',
    'sec.mismatch': 'Passwords do not match',
    'sec.tooShort': 'New password must be at least 6 characters',
    'sec.changed': 'Password changed',

    // language
    'lang.title': 'Select language',
    'lang.search': 'Search language',
    'lang.empty': 'No language found',
  },
} as const;

export type UiKey = keyof (typeof UI)['vi'];

/** Dữ liệu mock tiếng Việt → tiếng Anh (chỉ dịch khi lang = 'en'). */
const DATA: Record<string, string> = {
  'Tự động': 'Automatic',
  'Số sàn': 'Manual',
  '5 chỗ': '5 seats',
  '7 chỗ': '7 seats',
  Xăng: 'Petrol',
  'Xăng 100%': 'Petrol 100%',
  'Điện': 'Electric',
  'Bảo hiểm đầy đủ': 'Full insurance',
  'Giao xe tận nơi': 'Door-to-door delivery',
  'Hỗ trợ 24/7': '24/7 support',
  '2 mũ bảo hiểm': '2 helmets',
};

interface LanguageValue {
  /** Mã ngôn ngữ hiện tại. */
  lang: Lang;
  /** Đổi sang ngôn ngữ cụ thể (vi/en tức thì; ngôn ngữ khác dịch online). */
  setLang: (l: Lang) => void;
  /** Tiện ích cũ: bật/tắt nhanh giữa vi và en. */
  toggle: () => void;
  /** Đang tải bản dịch online (ngôn ngữ ngoài vi/en). */
  loading: boolean;
  /** Danh sách ngôn ngữ hỗ trợ. */
  languages: LanguageOption[];
  /** Dịch chuỗi giao diện; hỗ trợ thay {n} qua tham số vars. */
  t: (key: UiKey, vars?: Record<string, string | number>) => string;
  /** Dịch dữ liệu mock tiếng Việt (fallback giữ nguyên). */
  td: (text: string) => string;
}

const LanguageContext = createContext<LanguageValue | undefined>(undefined);

const STORAGE_KEY = 'dscity:lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  // Bản đồ chuỗi giao diện / dữ liệu cho ngôn ngữ hiện tại.
  const [uiMap, setUiMap] = useState<Record<string, string>>(UI.vi);
  const [dataMap, setDataMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // Token chống "đua": bỏ kết quả dịch cũ nếu user đã đổi ngôn ngữ khác.
  const reqId = useRef(0);

  const applyLang = useCallback(async (next: Lang) => {
    const myId = ++reqId.current;
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});

    // Hai ngôn ngữ gốc: dùng bản dịch tĩnh, không cần mạng.
    if (next === 'vi') {
      setUiMap(UI.vi);
      setDataMap({});
      setLoading(false);
      return;
    }
    if (next === 'en') {
      setUiMap(UI.en);
      setDataMap(DATA);
      setLoading(false);
      return;
    }

    // Ngôn ngữ khác: dịch online từ bản tiếng Anh (giữ UI cũ trong lúc chờ).
    setLoading(true);
    const uiKeys = Object.keys(UI.en) as UiKey[];
    const dataKeys = Object.keys(DATA);
    try {
      const [uiTr, dataTr] = await Promise.all([
        translateBatch(uiKeys.map((k) => UI.en[k]), next, 'en'),
        translateBatch(dataKeys.map((k) => DATA[k]), next, 'en'),
      ]);
      if (reqId.current !== myId) return; // đã đổi ngôn ngữ khác -> bỏ qua kết quả cũ

      const nextUi: Record<string, string> = {};
      uiKeys.forEach((k) => (nextUi[k] = uiTr[UI.en[k]] ?? UI.en[k]));
      const nextData: Record<string, string> = {};
      dataKeys.forEach((k) => (nextData[k] = dataTr[DATA[k]] ?? DATA[k]));

      setUiMap(nextUi);
      setDataMap(nextData);
    } catch {
      if (reqId.current !== myId) return;
      setUiMap(UI.en); // lỗi mạng -> fallback tiếng Anh
      setDataMap(DATA);
    } finally {
      if (reqId.current === myId) setLoading(false);
    }
  }, []);

  // Khôi phục ngôn ngữ đã lưu khi mở app.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && saved !== 'vi') applyLang(saved);
      })
      .catch(() => {
        /* bỏ qua lỗi đọc storage — dùng mặc định 'vi' */
      });
  }, [applyLang]);

  const value = useMemo<LanguageValue>(() => {
    const t = (key: UiKey, vars?: Record<string, string | number>) => {
      let out: string = uiMap[key] ?? UI.en[key] ?? key;
      if (vars) for (const k of Object.keys(vars)) out = out.replace(`{${k}}`, String(vars[k]));
      return out;
    };
    const td = (text: string) => {
      if (lang === 'vi') return text;
      return dataMap[text] ?? DATA[text] ?? text;
    };
    const toggle = () => applyLang(lang === 'vi' ? 'en' : 'vi');
    return { lang, setLang: applyLang, toggle, loading, languages: LANGUAGES, t, td };
  }, [lang, uiMap, dataMap, loading, applyLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage phải được dùng bên trong <LanguageProvider>.');
  }
  return ctx;
}
