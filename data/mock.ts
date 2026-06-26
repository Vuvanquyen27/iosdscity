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

export interface Place {
  id: string;
  name: string;
  coordinate: LatLng; // vị trí pin trên bản đồ
  distance: string; // ví dụ "120m"
  pricePerHour: number;
  pricePerDay: number;
  slotsLeft: number;
  slotsTotal: number;
  openHours: string; // "06:00 - 22:00"
  rating: number;
  reviews: number;
  floor: string; // badge tầng, ví dụ "B2"
  image: string;
  payments: PaymentMethod[];
}

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
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=60',
    payments: ['VISA', 'Mastercard', 'MOMO', 'Tiền mặt'],
  },
  {
    id: 'skyline-tower',
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
      'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=60',
    payments: ['VISA', 'Mastercard', 'MOMO', 'Tiền mặt'],
  },
];

export const vehicles: Vehicle[] = [
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
    amenities: [
      { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
      { icon: 'car-outline', label: 'Giao xe tận nơi' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=60',
  },
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
    amenities: [
      { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
      { icon: 'car-outline', label: 'Giao xe tận nơi' },
      { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
    ],
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=60',
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
