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
    'wallet.insufficient.title': 'Số dư không đủ',
    'wallet.insufficient.msg': 'Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.',
    'lang.switchTo': 'English',

    // --- Thanh tab dưới ---
    'tab.home': 'Trang chủ',
    'tab.map': 'Bản đồ',
    'tab.booking': 'Đặt chỗ',
    'tab.notifications': 'Thông báo',
    'tab.account': 'Tài khoản',

    // --- Đặt chỗ của tôi ---
    'booking.title': 'Đặt chỗ của tôi',
    'booking.upcoming': 'Sắp tới',
    'booking.history': 'Lịch sử',
    'booking.active': 'Đang diễn ra',
    'booking.emptyTitle': 'Chưa có lịch đặt sắp tới khác',
    'booking.emptySub': 'Khám phá dịch vụ và đặt chỗ ngay hôm nay',
    'booking.explore': 'Khám phá dịch vụ',
    'order.parkingPrefix': 'Bãi đậu xe',

    // --- Lịch sử giao dịch ---
    'tx.out': 'Tiền ra',
    'tx.in': 'Tiền vào',
    'tx.empty': 'Không có giao dịch nào trong khoảng thời gian này',

    // --- Thông báo ---
    'noti.markAllRead': 'Đánh dấu tất cả đã đọc',
    'noti.n1.title': 'Ưu đãi cuối tuần',
    'noti.n1.body': 'Giảm 20% các bãi đỗ nổi bật trong thành phố. Áp dụng tới Chủ nhật.',
    'noti.n1.time': '5 phút trước',
    'noti.n2.title': 'Đặt chỗ thành công',
    'noti.n2.body': 'Bãi đậu xe Central Plaza — mã PARK-240512-8X7A đã được xác nhận.',
    'noti.n2.time': '2 giờ trước',
    'noti.n3.title': 'Nạp tiền thành công',
    'noti.n3.body': 'Ví của bạn vừa được cộng 200.000đ.',
    'noti.n3.time': 'Hôm qua',

    // --- Tài khoản ---
    'account.availableBalance': 'Số dư khả dụng',
    'account.txHistory': 'Lịch sử giao dịch',
    'account.myOrders': 'Đơn hàng của tôi',
    'account.recent': 'Lịch sử gần đây',
    'account.empty': 'Không có đơn hàng nào',
    'status.all': 'Tất cả',
    'status.ongoing': 'Đang diễn ra',
    'status.completed': 'Đã hoàn thành',
    'status.cancelled': 'Đã hủy',

    // thanh toán (bổ sung)
    'pay.momo': 'Ví MoMo',
    'pay.cash': 'Tiền mặt',

    // --- Chi tiết tài khoản (sao kê) ---
    'acctDetail.title': 'Chi tiết tài khoản',
    'acctDetail.accountBalance': 'Số dư tài khoản',
    'acctDetail.setDefault': 'Chọn làm TK mặc định',
    'acctDetail.selected': 'Đã chọn',
    'acctDetail.query': 'Truy vấn giao dịch',
    'acctDetail.from': 'Từ ngày',
    'acctDetail.to': 'Đến ngày',
    'acctDetail.queryBtn': 'Truy vấn',
    'acctDetail.note': 'Hệ thống hỗ trợ truy vấn lịch sử giao dịch trong vòng 1 năm kể từ ngày hiện tại',
    'acctDetail.transfer': 'Chuyển tiền',
    'acctDetail.statement': 'Xuất sao kê',
    'acctDetail.linkApple': 'Liên kết với Apple',

    // --- Trang chủ ---
    'home.greeting': 'Xin chào, {name} 👋',
    'home.greetingSub': 'Cùng khám phá thành phố thông minh',
    'home.suggestions': 'Gợi ý cho bạn',
    'home.popularParking': 'Bãi đỗ phổ biến',
    'service.share': 'Chia sẻ phương tiện',

    // --- Ví ---
    'wallet.myWallet': 'Ví của tôi',
    'wallet.topup': 'Nạp tiền',

    // --- Địa điểm / danh sách bãi đỗ ---
    'place.bookable': 'Đặt được',
    'place.slotsLeft': 'Còn {n} chỗ',
    'place.full': 'Hết chỗ',
    'place.directions': 'Chỉ đường',
    'common.seeAll': 'Xem tất cả',

    // --- Bản đồ ---
    'map.searchPlaceholder': 'Tìm địa điểm bất kỳ để chỉ đường...',
    'map.distanceFromYou': 'Cách bạn {d}',
    'map.viewDetail': 'Xem chi tiết',
    'map.results': 'Kết quả ({n})',
    'map.nearYou': 'Gần bạn',
    'map.noResults': 'Không tìm thấy bãi đỗ phù hợp',
    'map.place': 'Địa điểm',
    'map.notFoundTitle': 'Không tìm thấy',
    'map.notFoundMsg': 'Không tìm thấy địa điểm “{q}”. Hãy thử từ khoá khác.',
    'map.gettingAddress': 'Đang lấy địa chỉ…',
    'map.selectedLocation': 'Vị trí đã chọn',
    'filter.car': 'Ô tô',
    'filter.motorbike': 'Xe máy',
    'filter.share': 'Chia sẻ',

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
    'wallet.insufficient.title': 'Insufficient balance',
    'wallet.insufficient.msg': 'Your wallet balance is not enough for this booking. Please top up.',
    'lang.switchTo': 'Tiếng Việt',

    // --- Bottom tab bar ---
    'tab.home': 'Home',
    'tab.map': 'Map',
    'tab.booking': 'Booking',
    'tab.notifications': 'Notifications',
    'tab.account': 'Account',

    // --- My bookings ---
    'booking.title': 'My bookings',
    'booking.upcoming': 'Upcoming',
    'booking.history': 'History',
    'booking.active': 'In progress',
    'booking.emptyTitle': 'No other upcoming bookings',
    'booking.emptySub': 'Explore services and book today',
    'booking.explore': 'Explore services',
    'order.parkingPrefix': 'Parking',

    // --- Transaction history ---
    'tx.out': 'Money out',
    'tx.in': 'Money in',
    'tx.empty': 'No transactions in this period',

    // --- Notifications ---
    'noti.markAllRead': 'Mark all as read',
    'noti.n1.title': 'Weekend offer',
    'noti.n1.body': 'Save 20% at featured parking lots in the city. Valid until Sunday.',
    'noti.n1.time': '5 minutes ago',
    'noti.n2.title': 'Booking confirmed',
    'noti.n2.body': 'Central Plaza Parking — code PARK-240512-8X7A confirmed.',
    'noti.n2.time': '2 hours ago',
    'noti.n3.title': 'Top-up successful',
    'noti.n3.body': 'Your wallet was credited 200,000₫.',
    'noti.n3.time': 'Yesterday',

    // --- Account ---
    'account.availableBalance': 'Available balance',
    'account.txHistory': 'Transaction history',
    'account.myOrders': 'My orders',
    'account.recent': 'Recent activity',
    'account.empty': 'No orders yet',
    'status.all': 'All',
    'status.ongoing': 'In progress',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',

    // payment (extra)
    'pay.momo': 'MoMo Wallet',
    'pay.cash': 'Cash',

    // --- Account details (statement) ---
    'acctDetail.title': 'Account details',
    'acctDetail.accountBalance': 'Account balance',
    'acctDetail.setDefault': 'Set as default account',
    'acctDetail.selected': 'Selected',
    'acctDetail.query': 'Query transactions',
    'acctDetail.from': 'From date',
    'acctDetail.to': 'To date',
    'acctDetail.queryBtn': 'Query',
    'acctDetail.note': 'You can query transaction history within 1 year from today',
    'acctDetail.transfer': 'Transfer',
    'acctDetail.statement': 'Export statement',
    'acctDetail.linkApple': 'Link with Apple',

    // --- Home ---
    'home.greeting': 'Hello, {name} 👋',
    'home.greetingSub': "Let's explore the smart city",
    'home.suggestions': 'Suggestions for you',
    'home.popularParking': 'Popular parking',
    'service.share': 'Vehicle sharing',

    // --- Wallet ---
    'wallet.myWallet': 'My wallet',
    'wallet.topup': 'Top up',

    // --- Places / parking list ---
    'place.bookable': 'Bookable',
    'place.slotsLeft': '{n} slots left',
    'place.full': 'Full',
    'place.directions': 'Directions',
    'common.seeAll': 'See all',

    // --- Map ---
    'map.searchPlaceholder': 'Search any place for directions...',
    'map.distanceFromYou': '{d} away',
    'map.viewDetail': 'View details',
    'map.results': 'Results ({n})',
    'map.nearYou': 'Near you',
    'map.noResults': 'No matching parking found',
    'map.place': 'Place',
    'map.notFoundTitle': 'Not found',
    'map.notFoundMsg': 'Could not find “{q}”. Try another keyword.',
    'map.gettingAddress': 'Getting address…',
    'map.selectedLocation': 'Selected location',
    'filter.car': 'Car',
    'filter.motorbike': 'Motorbike',
    'filter.share': 'Sharing',

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
  'Côn tay': 'Manual clutch',
  '5 chỗ': '5 seats',
  '7 chỗ': '7 seats',
  'Bán tải': 'Pickup',
  Xăng: 'Petrol',
  'Xăng 100%': 'Petrol 100%',
  'Máy dầu': 'Diesel',
  'Điện': 'Electric',
  'Bảo hiểm đầy đủ': 'Full insurance',
  'Giao xe tận nơi': 'Door-to-door delivery',
  'Hỗ trợ 24/7': '24/7 support',
  '2 mũ bảo hiểm': '2 helmets',
  'Tiết kiệm xăng': 'Fuel efficient',
  'Cốp rộng rãi': 'Spacious trunk',
  'Điều hoà mát lạnh': 'Cool air conditioning',

  // Thời gian giao dịch mẫu có chữ "ngày" (hiển thị ở thẻ "Đặt chỗ của tôi").
  '11/05/2024, 1 ngày': '11/05/2024, 1 day',
  '08/05/2024, 1 ngày': '08/05/2024, 1 day',
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

    // Áp bản dịch tới đâu cập nhật giao diện tới đó -> các màn ngoài Cài đặt
    // đổi ngôn ngữ ngay khi từng nhóm dịch xong (không chờ toàn bộ).
    const applyUiPartial = (tr: Record<string, string>) => {
      if (reqId.current !== myId) return;
      setUiMap((prev) => {
        const merged = { ...prev };
        for (const k of uiKeys) {
          const v = tr[UI.en[k]];
          if (v !== undefined) merged[k] = v;
        }
        return merged;
      });
    };
    const applyDataPartial = (tr: Record<string, string>) => {
      if (reqId.current !== myId) return;
      setDataMap((prev) => {
        const merged = { ...prev };
        for (const k of dataKeys) {
          const v = tr[DATA[k]];
          if (v !== undefined) merged[k] = v;
        }
        return merged;
      });
    };

    try {
      const [uiTr, dataTr] = await Promise.all([
        translateBatch(uiKeys.map((k) => UI.en[k]), next, 'en', applyUiPartial),
        translateBatch(dataKeys.map((k) => DATA[k]), next, 'en', applyDataPartial),
      ]);
      if (reqId.current !== myId) return; // đã đổi ngôn ngữ khác -> bỏ qua kết quả cũ

      // Chốt bản đầy đủ (phòng khi onPartial bỏ sót key nào).
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

/** Các tiền tố tiếng Việt được ghép sẵn vào tên đơn (đậu xe / thuê xe). */
const ORDER_PREFIXES: { vi: string; key: UiKey }[] = [
  { vi: 'Bãi đậu xe', key: 'order.parkingPrefix' },
  { vi: 'Thuê ô tô', key: 'rental.car' },
  { vi: 'Thuê xe máy', key: 'rental.motorbike' },
];

/**
 * Dịch tên đơn ghép sẵn ("Bãi đậu xe Central Plaza", "Thuê ô tô Toyota Vios"…):
 * thay tiền tố tiếng Việt bằng bản dịch, giữ nguyên tên riêng phía sau.
 * Bao quát mọi bãi/xe nên không cần liệt kê từng tên. Fallback: td(name).
 */
export function translateOrderName(
  name: string,
  t: LanguageValue['t'],
  td: LanguageValue['td']
): string {
  for (const { vi, key } of ORDER_PREFIXES) {
    if (name.startsWith(vi)) return t(key) + name.slice(vi.length);
  }
  return td(name);
}
