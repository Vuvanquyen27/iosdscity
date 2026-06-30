/**
 * DSCITY — Kiểu TypeScript cho schema Supabase THẬT (khớp DB đang chạy).
 *
 * Schema gồm: profiles, wallets, parking_lots, vehicles, shared_trips, bookings,
 * wallet_transactions, payments, trip_passengers, reviews, favorites, notifications.
 *
 * Viết tay cho gọn & dễ đọc. Khi đổi schema, cập nhật ở đây — hoặc sinh tự động:
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 */

// --- Literal union (cột text + CHECK trong DB) ---------------------------------
export type PaymentMethodDb = 'visa' | 'mastercard' | 'momo' | 'cash';
export type PaymentChannel = 'wallet' | PaymentMethodDb;
export type VehicleTypeDb = 'car' | 'motorbike';
export type VehicleStatus = 'available' | 'rented' | 'maintenance';
export type ServiceType = 'parking' | 'car' | 'motorbike' | 'sharing';
export type RateType = 'hourly' | 'daily' | 'weekly';
export type BookingStatus = 'pending' | 'ongoing' | 'completed' | 'cancelled';
export type WalletEntryType = 'topup' | 'payment' | 'refund';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type TripStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type TripPassengerStatus = 'joined' | 'cancelled';
export type ReviewTarget = 'parking' | 'vehicle' | 'trip';
export type FavoriteTarget = 'parking' | 'vehicle';

// --- Bảng ----------------------------------------------------------------------

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type WalletRow = {
  id: string;
  user_id: string;
  balance: number; // VND (số nguyên đồng)
  updated_at: string;
};

export type ParkingLotRow = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  open_time: string | null; // "06:00:00"
  close_time: string | null; // "22:00:00"
  price_per_hour: number;
  price_per_day: number | null;
  total_slots: number;
  available_slots: number;
  payment_methods: PaymentMethodDb[];
  rating: number;
  rating_count: number;
  created_at: string;
};

export type VehicleRow = {
  id: string;
  owner_id: string | null; // chủ xe (auth.users.id) — null với xe seed của hệ thống
  type: VehicleTypeDb;
  name: string;
  brand: string | null;
  image_url: string | null;
  transmission: string | null; // 'auto' | 'manual'
  seats: number | null; // ô tô
  engine_capacity: number | null; // xe máy (cc)
  fuel_type: string | null; // "Xăng" | "Điện"
  price_per_hour: number | null;
  price_per_day: number | null;
  price_per_week: number | null;
  features: string[]; // slug: bao_hiem_day_du, giao_xe_tan_noi...
  rating: number;
  rating_count: number;
  status: VehicleStatus;
  created_at: string;
};

export type SharedTripRow = {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  departure_time: string;
  price_per_seat: number;
  total_seats: number;
  available_seats: number;
  status: TripStatus;
  created_at: string;
};

export type BookingRow = {
  id: string;
  code: string; // PARK-240512-8X7A
  user_id: string;
  service_type: ServiceType;
  parking_lot_id: string | null;
  vehicle_id: string | null;
  trip_id: string | null;
  rate_type: RateType | null;
  start_time: string | null;
  end_time: string | null;
  total_amount: number;
  status: BookingStatus;
  qr_payload: string | null;
  created_at: string;
};

export type WalletTxRow = {
  id: string;
  wallet_id: string;
  type: WalletEntryType;
  amount: number; // + nạp/hoàn, - thanh toán
  balance_after: number;
  description: string | null;
  booking_id: string | null;
  created_at: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  user_id: string;
  method: PaymentChannel;
  amount: number;
  status: PaymentStatus;
  created_at: string;
};

export type TripPassengerRow = {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats: number;
  status: TripPassengerStatus;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  user_id: string;
  target_type: ReviewTarget;
  target_id: string;
  rating: number; // 1..5
  comment: string | null;
  created_at: string;
};

export type FavoriteRow = {
  id: string;
  user_id: string;
  target_type: FavoriteTarget;
  target_id: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
};

/** Hình dạng bảng mà supabase-js yêu cầu (Relationships là bắt buộc). */
type Table<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };

/** Hình dạng tối thiểu để supabase-js suy kiểu cho .from(). */
export interface Database {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      wallets: Table<WalletRow>;
      parking_lots: Table<ParkingLotRow>;
      vehicles: Table<VehicleRow>;
      shared_trips: Table<SharedTripRow>;
      bookings: Table<BookingRow>;
      wallet_transactions: Table<WalletTxRow>;
      payments: Table<PaymentRow>;
      trip_passengers: Table<TripPassengerRow>;
      reviews: Table<ReviewRow>;
      favorites: Table<FavoriteRow>;
      notifications: Table<NotificationRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>; // schema B không dùng RPC (insert/update trực tiếp)
  };
}
