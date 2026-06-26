/**
 * DSCITY — Design system / design tokens.
 *
 * Mọi màu / font / spacing / bo góc / shadow đều lấy từ đây.
 * KHÔNG hardcode màu rải rác trong các màn hình.
 */

/**
 * Bảng màu chế độ SÁNG (mặc định).
 *
 * Quy ước vai trò (để chế độ tối map cho đúng):
 * - `navy`, `white`, `green`, `yellow`: màu "trên nền màu / thương hiệu" — GIỮ CỐ ĐỊNH ở cả 2 chế độ
 *   (vd: chữ trắng trên nút xanh, icon navy trên nút tròn trắng của hero, gradient splash).
 * - `bg`: nền màn hình · `surface`: nền thẻ/ô input · `text` / `textMuted`: chữ · `border`: đường kẻ
 *   → các token NÀY đảo màu theo chế độ.
 */
export const lightColors = {
  navy: '#0D1B3D', // primary đậm (nền splash, badge, nút dark) — cố định
  green: '#0A683E', // primary brand (nút chính, accent) — cố định
  yellow: '#FFC107', // accent (sao đánh giá, highlight) — cố định
  bg: '#F3F6FA', // nền màn hình
  surface: '#FFFFFF', // nền thẻ / ô input
  white: '#FFFFFF', // màu "trên nền màu" (chữ/icon trên xanh, QR…) — cố định

  // dẫn xuất
  text: '#0D1B3D', // chữ chính / icon trên nền sáng
  textMuted: '#6B7280',
  border: '#E5E9F0',
  success: '#16A34A',
  danger: '#DC2626',

  // sắc độ phụ trợ
  navyDeep: '#060F26', // điểm cuối gradient splash — cố định
  greenDeep: '#08502F', // điểm cuối gradient ví / nút — cố định
  greenSoft: '#E7F2EC', // nền icon dịch vụ
  yellowSoft: '#FFF6DD', // nền badge / banner
  overlay: 'rgba(13, 27, 61, 0.45)', // lớp phủ trên ảnh
  mapBg: '#DCE6F2', // nền bản đồ placeholder
} as const;

/** Kiểu chung của một bảng màu (dark phải có đủ key của light). */
export type ThemeColors = Record<keyof typeof lightColors, string>;

/** Tên chế độ màu. */
export type ColorScheme = 'light' | 'dark';

/**
 * Bảng màu chế độ TỐI.
 * Giữ nguyên các màu thương hiệu (navy/green/yellow/white) để "trên nền màu" vẫn đúng;
 * đảo nền/chữ/viền và làm dịu các nền phụ trợ cho phù hợp nền tối.
 */
export const darkColors: ThemeColors = {
  navy: '#0D1B3D',
  green: '#0A683E',
  yellow: '#FFC107',
  bg: '#0E1521', // nền màn hình tối
  surface: '#18212F', // nền thẻ tối
  white: '#FFFFFF',

  text: '#E8ECF4', // chữ sáng trên nền tối
  textMuted: '#94A3B8',
  border: '#2A3647',
  success: '#34D399',
  danger: '#F87171',

  navyDeep: '#060F26',
  greenDeep: '#08502F',
  greenSoft: '#13322A', // nền icon dịch vụ (xanh trầm)
  yellowSoft: '#3D3413', // nền badge (vàng trầm)
  overlay: 'rgba(0, 0, 0, 0.55)',
  mapBg: '#101A2B', // nền bản đồ placeholder (xanh-đen)
};

/**
 * Bảng màu TĨNH (= chế độ sáng).
 * Dùng cho file thuần thương hiệu / luôn nền tối (splash, hero) và cho `Gradients`/`Shadow`.
 * Màn hình thường nên lấy màu qua `useThemeColors()` để đổi theo chế độ.
 */
export const Colors = lightColors;

/** Gradient tái sử dụng (expo-linear-gradient nhận mảng >= 2 màu). */
export const Gradients = {
  splash: [Colors.navy, Colors.navyDeep] as const,
  wallet: [Colors.green, Colors.greenDeep] as const,
};

/** Tên font Be Vietnam Pro đã nạp ở root layout. */
export const Fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
} as const;

export const Typography = {
  h1: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 32 },
  h2: { fontFamily: Fonts.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyMed: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 16 },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

/**
 * Asset thương hiệu (PNG do thiết kế cung cấp).
 * require() trả về asset id — truyền thẳng vào <Image source={...} />.
 */
export const Images = {
  logo: require('../assets/brand/dscity-logo.png'), // logo đầy đủ: mark + chữ + tagline
  logoMark: require('../assets/brand/logo-mark.png'), // mark DS + minh hoạ thành phố (không chữ)
  wordmark: require('../assets/brand/logo-wordmark.png'), // wordmark ngang DSCITY
  monogram: require('../assets/brand/d-icon.png'), // monogram DS gọn
} as const;

/** Icon dịch vụ ở lưới trang chủ. */
export const ServiceIcons = {
  parking: require('../assets/icons/parking.png'),
  car: require('../assets/icons/car.png'),
  motorbike: require('../assets/icons/motorbike.png'),
  share: require('../assets/icons/share.png'),
  city: require('../assets/icons/home.png'),
} as const;

export const Shadow = {
  card: {
    shadowColor: Colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // shadow nhẹ hướng lên trên cho thanh tab bar
  tabBar: {
    shadowColor: Colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
} as const;
