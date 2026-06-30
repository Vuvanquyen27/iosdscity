/**
 * DSCITY — Mock data + types.
 *
 * Tất cả màn hình render từ đây, KHÔNG hardcode dữ liệu trong JSX.
 * Ảnh dùng link Unsplash / ui-avatars làm placeholder.
 * // TODO: thay ảnh thật khi có asset chính thức.
 */

import { ServiceIcons } from '@/constants/theme';

/** Định dạng tiền VND: 1200000 -> "1.200.000đ" */
export function formatVND(amount: number): string {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

/** Avatar sinh từ tên (nền xanh brand) — ổn định, không cần asset. */
export function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name.trim() || 'DSCITY'
  )}&background=0A683E&color=fff&bold=true`;
}

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type PaymentMethod = 'VISA' | 'Mastercard' | 'MOMO' | 'Tiền mặt';

/** Toạ độ địa lý (dùng cho react-native-maps). */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Nguồn của một bãi đỗ:
 * - `partner`: bãi ĐỐI TÁC (data này / backend riêng) — có giá thật, chỗ trống
 *   thật, đặt chỗ + thanh toán trong app.
 * - `google`: lấy từ Google Maps để hiển thị toàn quốc — CHỈ để xem + chỉ đường,
 *   không có giá/chỗ trống/đặt chỗ.
 */
export type PlaceSource = 'partner' | 'google';

export interface Place {
  id: string;
  source: PlaceSource;
  name: string;
  coordinate: LatLng; // vị trí pin trên bản đồ
  distance: string; // ví dụ "120m"
  address?: string; // địa chỉ đầy đủ (bãi Google trả về)
  // Các field dưới chỉ có ở bãi đối tác (source === 'partner').
  pricePerHour?: number;
  pricePerDay?: number;
  slotsLeft?: number;
  slotsTotal?: number;
  openHours?: string; // "06:00 - 22:00" (hoặc "Đang mở cửa" với bãi Google)
  rating?: number;
  reviews?: number;
  floor?: string; // badge tầng, ví dụ "B2"
  image: string;
  payments?: PaymentMethod[];
}

/** Bãi đặt chỗ + thanh toán được trong app (đối tác) hay chỉ hiển thị từ Google. */
export const isBookable = (p: Place): boolean => p.source === 'partner';

export type VehicleKind = 'car' | 'motorbike';

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  name: string;
  attributes: string[]; // ["Tự động", "5 chỗ", "Xăng"]
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  rating: number;
  reviews: number;
  amenities: { icon: string; label: string }[]; // icon = Ionicons name
  image: string;
}

export interface Trip {
  id: string;
  driverName: string;
  rating: number;
  from: string;
  to: string;
  time: string;
  price: number;
  seatsLeft: number;
  avatar: string;
}

export type TransactionStatus = 'completed' | 'ongoing' | 'cancelled';

export interface Transaction {
  id: string;
  kind: VehicleKind | 'parking';
  name: string;
  datetime: string;
  amount: number;
  status: TransactionStatus;
}

export interface User {
  name: string;
  firstName: string;
  phone: string;
  email: string;
  balance: number;
  avatar: string;
}

/** Slide gợi ý / ưu đãi ở trang chủ (carousel tự chạy). */
export interface Promo {
  id: string;
  tag: string; // nhãn nhỏ in hoa, ví dụ "ƯU ĐÃI CUỐI TUẦN"
  title: string;
  icon: number; // asset id từ ServiceIcons (require())
}

// ----------------------------------------------------------------------------
// Data
// ----------------------------------------------------------------------------

export const user: User = {
  name: 'Nguyễn Văn Minh',
  firstName: 'Minh',
  phone: '0123 456 789',
  email: 'minh.nguyen@dscity.vn',
  balance: 520000,
  avatar: avatarUrl('Nguyen Van Minh'),
};

export const promos: Promo[] = [
  {
    id: 'weekend',
    tag: 'ƯU ĐÃI CUỐI TUẦN',
    title: 'Giảm 20% các bãi đỗ nổi bật trong thành phố',
    icon: ServiceIcons.city,
  },
  {
    id: 'car',
    tag: 'THUÊ XE TỰ LÁI',
    title: 'Ô tô đời mới, nhận xe tận nơi chỉ với vài chạm',
    icon: ServiceIcons.car,
  },
  {
    id: 'motorbike',
    tag: 'DI CHUYỂN LINH HOẠT',
    title: 'Thuê xe máy theo giờ, chỉ từ 20.000đ/giờ',
    icon: ServiceIcons.motorbike,
  },
];

export const places: Place[] = [
  {
    id: 'central-plaza',
    source: 'partner',
    name: 'Bãi đậu xe Central Plaza',
    coordinate: { latitude: 10.7740, longitude: 106.702 },
    distance: '120m',
    pricePerHour: 20000,
    pricePerDay: 180000,
    slotsLeft: 12,
    slotsTotal: 50,
    openHours: '06:00 - 22:00',
    rating: 4.6,
    reviews: 128,
    floor: 'B2',
    image:
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=60',
    payments: ['VISA', 'Mastercard', 'MOMO', 'Tiền mặt'],
  },
  {
    id: 'skyline-tower',
    source: 'partner',
    name: 'Bãi đậu xe Skyline Tower',
    coordinate: { latitude: 10.7769, longitude: 106.7009 },
    distance: '350m',
    pricePerHour: 25000,
    pricePerDay: 200000,
    slotsLeft: 8,
    slotsTotal: 40,
    openHours: '00:00 - 24:00',
    rating: 4.5,
    reviews: 96,
    floor: 'B1',
    image:
      'https://images.unsplash.com/photo-1545179605-1296651e9d43?auto=format&fit=crop&w=800&q=60',
    payments: ['VISA', 'Mastercard', 'MOMO', 'Tiền mặt'],
  },
  {
    id: 'bitexco-parking',
    source: 'partner',
    name: 'Bitexco Parking',
    coordinate: { latitude: 10.7717, longitude: 106.7041 },
    distance: '500m',
    pricePerHour: 30000,
    pricePerDay: 250000,
    slotsLeft: 20,
    slotsTotal: 80,
    openHours: '06:00 - 23:00',
    rating: 4.7,
    reviews: 210,
    floor: 'B3',
    image:
      'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=60',
    payments: ['VISA', 'Mastercard', 'MOMO', 'Tiền mặt'],
  },
];

/** Tiện ích mặc định cho ô tô / xe máy — dùng lại cho phần lớn mẫu xe. */
const carAmenities = [
  { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
  { icon: 'car-outline', label: 'Giao xe tận nơi' },
  { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
];
const bikeAmenities = [
  { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
  { icon: 'car-outline', label: 'Giao xe tận nơi' },
  { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
];

/**
 * Danh mục phương tiện.
 * `image` là ảnh thật (Wikimedia Commons) đã xác minh — cũng là ảnh fallback khi
 * services/vehicle-image.ts tra ảnh online theo tên không ra (xem hook
 * useVehicleImage). Đổi `name` thì ảnh động tự đổi theo tên mới.
 */
export const vehicles: Vehicle[] = [
  // -------------------------------- Ô TÔ --------------------------------
  {
    id: 'toyota-corolla-cross',
    kind: 'car',
    name: 'Toyota Corolla Cross',
    attributes: ['Tự động', '5 chỗ', 'Xăng'],
    pricePerHour: 250000,
    pricePerDay: 1200000,
    pricePerWeek: 7500000,
    rating: 4.6,
    reviews: 256,
    amenities: carAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/2023_Toyota_Corolla_Cross_XLE_4WD_in_Wind_Chill_Pearl%2C_front_left.jpg/1280px-2023_Toyota_Corolla_Cross_XLE_4WD_in_Wind_Chill_Pearl%2C_front_left.jpg',
  },
  {
    id: 'toyota-vios',
    kind: 'car',
    name: 'Toyota Vios',
    attributes: ['Tự động', '5 chỗ', 'Xăng'],
    pricePerHour: 180000,
    pricePerDay: 900000,
    pricePerWeek: 5400000,
    rating: 4.5,
    reviews: 312,
    amenities: [
      { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
      { icon: 'leaf-outline', label: 'Tiết kiệm xăng' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Toyota_Vios_1.5_VVT-i_G_%28IV%29_%E2%80%93_f_13032025.jpg/1280px-Toyota_Vios_1.5_VVT-i_G_%28IV%29_%E2%80%93_f_13032025.jpg',
  },
  {
    id: 'honda-cr-v',
    kind: 'car',
    name: 'Honda CR-V',
    attributes: ['Tự động', '7 chỗ', 'Xăng'],
    pricePerHour: 300000,
    pricePerDay: 1500000,
    pricePerWeek: 9000000,
    rating: 4.7,
    reviews: 184,
    amenities: [
      { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
      { icon: 'cube-outline', label: 'Cốp rộng rãi' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg/1280px-Honda_CR-V_e-HEV_Elegance_AWD_%28VI%29_%E2%80%93_f_14072024.jpg',
  },
  {
    id: 'mazda-cx-5',
    kind: 'car',
    name: 'Mazda CX-5',
    attributes: ['Tự động', '5 chỗ', 'Xăng'],
    pricePerHour: 280000,
    pricePerDay: 1400000,
    pricePerWeek: 8400000,
    rating: 4.6,
    reviews: 209,
    amenities: carAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg/1280px-2024_Mazda_CX-5_2.5_S_Select_in_Platinum_Quartz_Metallic%2C_front_right.jpg',
  },
  {
    id: 'hyundai-accent',
    kind: 'car',
    name: 'Hyundai Accent',
    attributes: ['Tự động', '5 chỗ', 'Xăng'],
    pricePerHour: 170000,
    pricePerDay: 850000,
    pricePerWeek: 5000000,
    rating: 4.4,
    reviews: 276,
    amenities: [
      { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
      { icon: 'leaf-outline', label: 'Tiết kiệm xăng' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/2019_Hyundai_Accent_1.6L%2C_front_10.8.19.jpg/1280px-2019_Hyundai_Accent_1.6L%2C_front_10.8.19.jpg',
  },
  {
    id: 'ford-ranger',
    kind: 'car',
    name: 'Ford Ranger',
    attributes: ['Tự động', 'Bán tải', 'Máy dầu'],
    pricePerHour: 320000,
    pricePerDay: 1600000,
    pricePerWeek: 9500000,
    rating: 4.7,
    reviews: 142,
    amenities: carAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg/1280px-Ford_Ranger_%28T6%2C_P703%29_Wildtrak_IMG_7320.jpg',
  },
  {
    id: 'mitsubishi-xpander',
    kind: 'car',
    name: 'Mitsubishi Xpander',
    attributes: ['Tự động', '7 chỗ', 'Xăng'],
    pricePerHour: 260000,
    pricePerDay: 1300000,
    pricePerWeek: 7800000,
    rating: 4.5,
    reviews: 231,
    amenities: [
      { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
      { icon: 'cube-outline', label: 'Cốp rộng rãi' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Mitsubishi_Xpander_NC1W_FL2_1.5_GLS_Quartz_White_Pearl_01.jpg/1280px-Mitsubishi_Xpander_NC1W_FL2_1.5_GLS_Quartz_White_Pearl_01.jpg',
  },
  {
    id: 'vinfast-vf-8',
    kind: 'car',
    name: 'VinFast VF 8',
    attributes: ['Tự động', '5 chỗ', 'Điện'],
    pricePerHour: 350000,
    pricePerDay: 1700000,
    pricePerWeek: 10000000,
    rating: 4.8,
    reviews: 167,
    amenities: [
      { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
      { icon: 'leaf-outline', label: 'Tiết kiệm xăng' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/VinFast_VF_8_DSC_8568.jpg/1280px-VinFast_VF_8_DSC_8568.jpg',
  },

  // ------------------------------- XE MÁY -------------------------------
  {
    id: 'honda-vision-2024',
    kind: 'motorbike',
    name: 'Honda Vision 2024',
    attributes: ['Tự động', '110cc', 'Xăng 100%'],
    pricePerHour: 20000,
    pricePerDay: 120000,
    pricePerWeek: 700000,
    rating: 4.7,
    reviews: 198,
    amenities: bikeAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Honda_Vision_110-002.JPG/1280px-Honda_Vision_110-002.JPG',
  },
  {
    id: 'honda-air-blade',
    kind: 'motorbike',
    name: 'Honda Air Blade',
    attributes: ['Tự động', '125cc', 'Xăng'],
    pricePerHour: 25000,
    pricePerDay: 150000,
    pricePerWeek: 850000,
    rating: 4.6,
    reviews: 221,
    amenities: bikeAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Honda_Airblade_125_scooters._Cambodia%2C_Sihanoukville.jpg/1280px-Honda_Airblade_125_scooters._Cambodia%2C_Sihanoukville.jpg',
  },
  {
    id: 'honda-sh-150i',
    kind: 'motorbike',
    name: 'Honda SH 150i',
    attributes: ['Tự động', '150cc', 'Xăng'],
    pricePerHour: 50000,
    pricePerDay: 300000,
    pricePerWeek: 1700000,
    rating: 4.8,
    reviews: 176,
    amenities: [
      { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
      { icon: 'cube-outline', label: 'Cốp rộng rãi' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Honda_SH_150i_white.jpg/1280px-Honda_SH_150i_white.jpg',
  },
  {
    id: 'honda-lead',
    kind: 'motorbike',
    name: 'Honda Lead',
    attributes: ['Tự động', '125cc', 'Xăng'],
    pricePerHour: 25000,
    pricePerDay: 140000,
    pricePerWeek: 800000,
    rating: 4.5,
    reviews: 203,
    amenities: [
      { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
      { icon: 'cube-outline', label: 'Cốp rộng rãi' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/3/3a/Honda_Lead_NH50.jpg',
  },
  {
    id: 'honda-winner-x',
    kind: 'motorbike',
    name: 'Honda Winner X',
    attributes: ['Côn tay', '150cc', 'Xăng'],
    pricePerHour: 35000,
    pricePerDay: 200000,
    pricePerWeek: 1100000,
    rating: 4.6,
    reviews: 158,
    amenities: bikeAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Honda_winner_in_anthoi_phuquoc.jpg/1280px-Honda_winner_in_anthoi_phuquoc.jpg',
  },
  {
    id: 'honda-wave-alpha',
    kind: 'motorbike',
    name: 'Honda Wave Alpha',
    attributes: ['Số sàn', '110cc', 'Xăng'],
    pricePerHour: 15000,
    pricePerDay: 100000,
    pricePerWeek: 550000,
    rating: 4.4,
    reviews: 287,
    amenities: [
      { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
      { icon: 'leaf-outline', label: 'Tiết kiệm xăng' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/7/76/2024_Honda_Wave_110.png',
  },
  {
    id: 'yamaha-exciter',
    kind: 'motorbike',
    name: 'Yamaha Exciter',
    attributes: ['Côn tay', '155cc', 'Xăng'],
    pricePerHour: 35000,
    pricePerDay: 200000,
    pricePerWeek: 1100000,
    rating: 4.7,
    reviews: 244,
    amenities: bikeAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Yamaha_Y15ZR.jpg/1280px-Yamaha_Y15ZR.jpg',
  },
  {
    id: 'yamaha-nvx',
    kind: 'motorbike',
    name: 'Yamaha NVX',
    attributes: ['Tự động', '155cc', 'Xăng'],
    pricePerHour: 40000,
    pricePerDay: 220000,
    pricePerWeek: 1250000,
    rating: 4.6,
    reviews: 139,
    amenities: bikeAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/2022_Yamaha_Aerox_155_ABS.jpg/1280px-2022_Yamaha_Aerox_155_ABS.jpg',
  },
  {
    id: 'yamaha-grande',
    kind: 'motorbike',
    name: 'Yamaha Grande',
    attributes: ['Tự động', '125cc', 'Xăng'],
    pricePerHour: 28000,
    pricePerDay: 160000,
    pricePerWeek: 900000,
    rating: 4.5,
    reviews: 171,
    amenities: [
      { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
      { icon: 'leaf-outline', label: 'Tiết kiệm xăng' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Yamaha_nozza_grande_ltf125_YCP.JPG/1280px-Yamaha_nozza_grande_ltf125_YCP.JPG',
  },
  {
    id: 'piaggio-vespa',
    kind: 'motorbike',
    name: 'Piaggio Vespa',
    attributes: ['Tự động', '125cc', 'Xăng'],
    pricePerHour: 60000,
    pricePerDay: 350000,
    pricePerWeek: 2000000,
    rating: 4.7,
    reviews: 118,
    amenities: bikeAmenities,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Vespa_LX.JPG/1280px-Vespa_LX.JPG',
  },
];

/** Tra cứu xe theo id (dùng cho route car/[id], motorbike/[id]). */
export function getVehicle(id: string): Vehicle | undefined {
  return vehicles.find((v) => v.id === id);
}

/** Tra cứu bãi đậu xe theo id (dùng cho route parking/[id]). */
export function getPlace(id: string): Place | undefined {
  return places.find((p) => p.id === id);
}

/** Vị trí "của tôi" giả lập (trung tâm Q.1, TP.HCM). */
export const MY_LOCATION: LatLng = { latitude: 10.7745, longitude: 106.7032 };

/**
 * Vùng hiển thị mặc định của bản đồ — căn giữa các bãi đậu xe ở Q.1.
 * latitudeDelta/longitudeDelta càng nhỏ thì zoom càng gần.
 */
export const MAP_INITIAL_REGION = {
  latitude: 10.7743,
  longitude: 106.7025,
  latitudeDelta: 0.018,
  longitudeDelta: 0.018,
} as const;

export const trips: Trip[] = [
  {
    id: 'trip-1',
    driverName: 'Minh Đức',
    rating: 4.8,
    from: 'Q.1',
    to: 'Q.7',
    time: 'Hôm nay 09:00',
    price: 40000,
    seatsLeft: 2,
    avatar: avatarUrl('Minh Duc'),
  },
  {
    id: 'trip-2',
    driverName: 'Thanh Hằng',
    rating: 4.9,
    from: 'Q.10',
    to: 'Q.2',
    time: 'Hôm nay 10:30',
    price: 50000,
    seatsLeft: 3,
    avatar: avatarUrl('Thanh Hang'),
  },
];

export const transactions: Transaction[] = [
  {
    id: 'tx-1',
    kind: 'parking',
    name: 'Bãi đậu xe Central Plaza',
    datetime: '12/05/2024, 08:30',
    amount: 20000,
    status: 'completed',
  },
  {
    id: 'tx-2',
    kind: 'car',
    name: 'Thuê ô tô Toyota Cross',
    datetime: '11/05/2024, 1 ngày',
    amount: 1200000,
    status: 'completed',
  },
  {
    id: 'tx-3',
    kind: 'motorbike',
    name: 'Thuê xe máy Honda Vision',
    datetime: '08/05/2024, 1 ngày',
    amount: 120000,
    status: 'completed',
  },
];

// ----------------------------------------------------------------------------
// Tài khoản ngân hàng — màn "Chi tiết tài khoản" (phong cách MB Bank)
// ----------------------------------------------------------------------------

/** Một giao dịch ngân hàng (tiền ra / tiền vào) cho danh sách lịch sử kiểu MB. */
export interface BankTransaction {
  id: string;
  type: 'OUT' | 'IN';
  amount: number; // VND
  description: string; // nội dung giao dịch (truncate 1 dòng khi hiển thị)
  time: string; // "23:03"
  date: string; // "27/06/2026" (dd/MM/yyyy)
}

/**
 * Thông tin tài khoản hiển thị ở đầu màn "Chi tiết tài khoản".
 * KHÔNG giữ số dư ở đây — số dư là của ví (useWallet), nguồn duy nhất, để màn
 * Tài khoản và màn Lịch sử giao dịch luôn khớp nhau.
 */
export interface BankAccount {
  holder: string; // tên chủ TK (in hoa)
  number: string; // số tài khoản
  isDefault: boolean; // có phải TK mặc định không
}

export const bankAccount: BankAccount = {
  holder: 'VU VAN QUYEN',
  number: '08333937777',
  isDefault: true,
};

/** Lịch sử giao dịch mẫu — mới nhất sẽ được component tự gom & sắp xếp. */
export const bankTransactions: BankTransaction[] = [
  { id: '1', type: 'OUT', amount: 50000, description: 'CUSTOMER MOMO-CASHIN-0973524327-OQCleXxPpSW...', time: '23:03', date: '27/06/2026' },
  { id: '2', type: 'OUT', amount: 20000, description: 'CUSTOMER MOMO-CASHIN-0973524327-OQCIsvCMQPDf...', time: '17:16', date: '27/06/2026' },
  { id: '3', type: 'OUT', amount: 20000, description: 'CUSTOMER MOMO-CASHIN-0973524327-OQCIpmjRhdij...', time: '15:37', date: '27/06/2026' },
  { id: '4', type: 'OUT', amount: 40000, description: 'CUSTOMER MOMO-CASHIN-0973524327-OQCIQVOkdVpy...', time: '15:28', date: '27/06/2026' },
  { id: '5', type: 'OUT', amount: 19000, description: 'CUSTOMER RetailVisa-632831-19000-VND-6178027 29647-HUAWEI MOBILE...', time: '09:57', date: '27/06/2026' },
  { id: '6', type: 'OUT', amount: 209, description: 'CUSTOMER RetailVisa-632831-19000-VND-6178027 29647-HUAWEI MOBILE...', time: '09:57', date: '27/06/2026' },
  { id: '7', type: 'IN', amount: 500000, description: 'CUSTOMER NGUYEN VAN A chuyen tien an trua FT26178...', time: '08:12', date: '27/06/2026' },
  { id: '8', type: 'OUT', amount: 200000, description: 'CUSTOMER MBCT Van Quyen chuyen khoan nhanh qua Zalo D2UUFW2C/5...', time: '11:55', date: '26/06/2026' },
  { id: '9', type: 'IN', amount: 1500000, description: 'LUONG THANG 06/2026 CONG TY ABC FT261770000001234...', time: '09:00', date: '26/06/2026' },
];
