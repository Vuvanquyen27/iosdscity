/**
 * DSCITY — Lớp truy cập dữ liệu (Supabase) cho toàn app.
 *
 * Mỗi hàm trả về ĐÚNG kiểu mà UI đang dùng (Place, Vehicle, Trip... trong
 * data/mock.ts) → thay mock chỉ là đổi nguồn gọi, JSX giữ nguyên.
 *
 * Cách dùng dần (migration):
 *   import { fetchVehicles } from '@/services/api';
 *   const vehicles = await fetchVehicles();   // thay cho `import { vehicles } from '@/data/mock'`
 *
 * Khớp schema THẬT (parking_lots / vehicles / shared_trips / bookings / wallets…).
 */
import { supabase } from '@/lib/supabase';
import {
  avatarUrl,
  vehicles as mockVehicles,
  type LatLng,
  type PaymentMethod,
  type Place,
  type Trip,
  type Transaction,
  type TransactionStatus,
  type Vehicle,
  type VehicleKind,
} from '@/data/mock';
import type {
  BookingRow,
  ParkingLotRow,
  PaymentMethodDb,
  ProfileRow,
  RateType,
  ServiceType,
  SharedTripRow,
  VehicleRow,
  WalletTxRow,
} from '@/types/database';

// ---------------------------------------------------------------------------
// Mappers: DB (chữ thường) ↔ kiểu hiển thị của app
// ---------------------------------------------------------------------------

const PAYMENT_LABEL: Record<PaymentMethodDb, PaymentMethod> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  momo: 'MOMO',
  cash: 'Tiền mặt',
};

export function paymentToDb(label: PaymentMethod): PaymentMethodDb {
  const entry = Object.entries(PAYMENT_LABEL).find(([, v]) => v === label);
  return (entry?.[0] as PaymentMethodDb) ?? 'momo';
}

/** "06:00:00" → "06:00". */
const hhmm = (t: string) => t.slice(0, 5);

/** "120m" / "1.2km" từ khoảng cách mét. */
function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
}

/** Khoảng cách Haversine (mét) giữa 2 toạ độ. */
function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function mapParkingLot(r: ParkingLotRow, near?: LatLng): Place {
  const coordinate: LatLng = { latitude: r.latitude ?? 0, longitude: r.longitude ?? 0 };
  return {
    id: r.id,
    source: 'partner', // bãi trong DB đều là bãi đối tác (đặt + thanh toán được)
    name: r.name,
    coordinate,
    distance: near && r.latitude != null ? formatDistance(haversine(near, coordinate)) : '',
    address: r.address ?? undefined,
    pricePerHour: r.price_per_hour,
    pricePerDay: r.price_per_day ?? undefined,
    slotsLeft: r.available_slots,
    slotsTotal: r.total_slots,
    openHours: r.open_time && r.close_time ? `${hhmm(r.open_time)} - ${hhmm(r.close_time)}` : undefined,
    rating: r.rating,
    reviews: r.rating_count,
    floor: '', // schema chưa có cột tầng
    image: r.image_url ?? '',
    payments: r.payment_methods.map((p) => PAYMENT_LABEL[p]).filter(Boolean),
  };
}

/** slug feature trong DB → {icon Ionicons, nhãn} cho UI. */
const FEATURE_AMENITY: Record<string, { icon: string; label: string }> = {
  bao_hiem_day_du: { icon: 'shield-checkmark-outline', label: 'Bảo hiểm đầy đủ' },
  giao_xe_tan_noi: { icon: 'car-outline', label: 'Giao xe tận nơi' },
  ho_tro_247: { icon: 'headset-outline', label: 'Hỗ trợ 24/7' },
  '2_mu_bao_hiem': { icon: 'bicycle-outline', label: '2 mũ bảo hiểm' },
  tiet_kiem_xang: { icon: 'leaf-outline', label: 'Tiết kiệm xăng' },
  cop_rong: { icon: 'cube-outline', label: 'Cốp rộng rãi' },
};

function featureToAmenity(slug: string): { icon: string; label: string } {
  return FEATURE_AMENITY[slug] ?? { icon: 'checkmark-circle-outline', label: slug.replace(/_/g, ' ') };
}

/** ["Tự động", "5 chỗ", "Xăng"] suy từ transmission/seats/engine/fuel. */
function vehicleAttributes(r: VehicleRow): string[] {
  const trans =
    r.transmission === 'manual' ? 'Số sàn' : r.transmission === 'auto' ? 'Tự động' : null;
  const size = r.type === 'car' ? (r.seats ? `${r.seats} chỗ` : null) : r.engine_capacity ? `${r.engine_capacity}cc` : null;
  return [trans, size, r.fuel_type].filter(Boolean) as string[];
}

function mapVehicle(r: VehicleRow): Vehicle {
  return {
    id: r.id,
    kind: r.type as VehicleKind,
    name: r.name,
    attributes: vehicleAttributes(r),
    pricePerHour: r.price_per_hour ?? 0,
    pricePerDay: r.price_per_day ?? 0,
    pricePerWeek: r.price_per_week ?? 0,
    rating: r.rating,
    reviews: r.rating_count,
    amenities: (r.features ?? []).map(featureToAmenity),
    image: r.image_url ?? '',
  };
}

/** shared_trips + thông tin tài xế (embed profiles). */
type TripJoined = SharedTripRow & {
  driver: { full_name: string; avatar_url: string | null } | null;
};

function mapTrip(r: TripJoined): Trip {
  const name = r.driver?.full_name ?? 'Tài xế';
  return {
    id: r.id,
    driverName: name,
    rating: 5, // schema chưa lưu điểm đánh giá tài xế
    from: r.origin,
    to: r.destination,
    time: new Date(r.departure_time).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }),
    price: r.price_per_seat,
    seatsLeft: r.available_seats,
    avatar: r.driver?.avatar_url ?? avatarUrl(name),
  };
}

/** bookings + tên dịch vụ (embed bảng liên quan). */
type BookingJoined = BookingRow & {
  parking_lots: { name: string } | null;
  vehicles: { name: string } | null;
  shared_trips: { origin: string; destination: string } | null;
};

function bookingName(r: BookingJoined): string {
  switch (r.service_type) {
    case 'parking':
      return r.parking_lots?.name ?? 'Bãi đậu xe';
    case 'car':
    case 'motorbike':
      return r.vehicles?.name ?? 'Thuê xe';
    case 'sharing':
      return r.shared_trips ? `${r.shared_trips.origin} → ${r.shared_trips.destination}` : 'Chuyến đi chung';
  }
}

function mapBookingToTransaction(r: BookingJoined): Transaction {
  // UI chỉ có 3 loại (car/motorbike/parking) → 'sharing' gộp vào 'parking'.
  const kind: Transaction['kind'] =
    r.service_type === 'car' ? 'car' : r.service_type === 'motorbike' ? 'motorbike' : 'parking';
  const status: TransactionStatus = r.status === 'pending' ? 'ongoing' : (r.status as TransactionStatus);
  return {
    id: r.id,
    kind,
    name: bookingName(r),
    datetime: new Date(r.start_time ?? r.created_at).toLocaleString('vi-VN'),
    amount: r.total_amount,
    status,
  };
}

// ---------------------------------------------------------------------------
// Danh mục (đọc công khai — RLS cho phép select using (true))
// ---------------------------------------------------------------------------

/** Tất cả bãi đỗ; truyền toạ độ `near` để có khoảng cách + sắp theo gần nhất. */
export async function fetchParkingLots(near?: LatLng): Promise<Place[]> {
  const { data, error } = await supabase.from('parking_lots').select('*');
  if (error) throw error;
  const places = (data ?? []).map((r) => mapParkingLot(r, near));
  if (near) places.sort((a, b) => (haversine(near, a.coordinate)) - haversine(near, b.coordinate));
  return places;
}

/** Một bãi đỗ theo id (cho màn chi tiết). */
export async function fetchParkingLot(id: string): Promise<Place | null> {
  const { data, error } = await supabase.from('parking_lots').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapParkingLot(data) : null;
}

/** Danh mục xe local (đầy đủ) — fallback khi DB trống/chưa seed/lỗi query. */
function mockVehicleList(kind?: VehicleKind): Vehicle[] {
  return kind ? mockVehicles.filter((v) => v.kind === kind) : mockVehicles;
}

export async function fetchVehicles(kind?: VehicleKind): Promise<Vehicle[]> {
  try {
    let q = supabase.from('vehicles').select('*').eq('status', 'available');
    if (kind) q = q.eq('type', kind);
    const { data, error } = await q.order('rating', { ascending: false });
    if (error) throw error;
    const mapped = (data ?? []).map(mapVehicle);
    if (mapped.length > 0) return mapped;
  } catch (e) {
    console.warn('[api] fetchVehicles → fallback danh mục local:', e);
  }
  // DB chưa có xe (hoặc lỗi) → trả danh mục đầy đủ từ data/mock.ts.
  return mockVehicleList(kind);
}

export async function fetchVehicle(id: string): Promise<Vehicle | null> {
  try {
    const { data, error } = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (data) return mapVehicle(data);
  } catch (e) {
    console.warn('[api] fetchVehicle → fallback danh mục local:', e);
  }
  // Không thấy trong DB (vd. id là slug local) → tra trong danh mục local.
  return mockVehicles.find((v) => v.id === id) ?? null;
}

/** Dữ liệu form "Đăng xe cho thuê" — đã chuẩn hoá (giá là số nguyên VND). */
export interface NewVehicleInput {
  kind: VehicleKind; // 'car' | 'motorbike'
  name: string;
  brand?: string | null;
  transmission: 'auto' | 'manual';
  seats?: number | null; // ô tô
  engineCapacity?: number | null; // xe máy (cc)
  fuelType: string; // 'Xăng' | 'Điện' | 'Dầu'
  pricePerHour: number;
  pricePerDay: number;
  pricePerWeek: number;
  features: string[]; // slug: bao_hiem_day_du, giao_xe_tan_noi...
  imageUrl?: string | null;
}

/**
 * Đăng một xe cho thuê (chủ xe). Ghi thẳng vào bảng `vehicles` với
 * owner_id = người đang đăng nhập, status 'available' → xe xuất hiện ngay trong
 * danh mục và mở được màn chi tiết. Cần RLS "vehicles: insert own" (migration
 * 0003). Trả về Vehicle đã map (kèm id thật từ DB) để điều hướng sang màn detail.
 */
export async function createVehicle(input: NewVehicleInput): Promise<Vehicle> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Bạn cần đăng nhập để đăng xe cho thuê.');

  const row: Partial<VehicleRow> = {
    owner_id: user.id,
    type: input.kind,
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    transmission: input.transmission,
    seats: input.kind === 'car' ? (input.seats ?? null) : null,
    engine_capacity: input.kind === 'motorbike' ? (input.engineCapacity ?? null) : null,
    fuel_type: input.fuelType,
    price_per_hour: input.pricePerHour,
    price_per_day: input.pricePerDay,
    price_per_week: input.pricePerWeek,
    features: input.features,
    image_url: input.imageUrl?.trim() || null,
    status: 'available',
  };

  const { data, error } = await supabase.from('vehicles').insert(row).select('*').single();
  if (error) throw error;
  return mapVehicle(data);
}

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('shared_trips')
    .select('*, driver:profiles(full_name, avatar_url)')
    .eq('status', 'open')
    .order('departure_time', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as TripJoined[]).map(mapTrip);
}

// ---------------------------------------------------------------------------
// Dữ liệu cá nhân (yêu cầu đăng nhập — RLS lọc theo auth.uid())
// ---------------------------------------------------------------------------

/** Hồ sơ người dùng đang đăng nhập (null nếu chưa có). */
export async function fetchProfile(): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Cập nhật hồ sơ người dùng đang đăng nhập. */
export async function updateProfile(patch: {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Bạn cần đăng nhập.');
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
}

export async function fetchMyBookings(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parking_lots(name), vehicles(name), shared_trips(origin, destination)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as BookingJoined[]).map(mapBookingToTransaction);
}

/** Số dư ví hiện tại (VND). */
export async function fetchWalletBalance(): Promise<number> {
  const { data, error } = await supabase.from('wallets').select('balance').maybeSingle();
  if (error) throw error;
  return data?.balance ?? 0;
}

/** Lịch sử giao dịch ví (mới nhất trước). */
export async function fetchWalletTransactions(): Promise<WalletTxRow[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Giao dịch
// ---------------------------------------------------------------------------

/**
 * Nạp tiền vào ví — qua RPC `wallet_topup` (SECURITY DEFINER, ATOMIC, tự tạo ví
 * nếu chưa có). Client KHÔNG được ghi thẳng bảng `wallets` (RLS chặn — xem
 * migration 0005). Trả về số dư MỚI (VND).
 */
export async function topup(amount: number, method: PaymentMethod): Promise<number> {
  const { data, error } = await supabase.rpc('wallet_topup', {
    p_amount: amount,
    p_method: paymentToDb(method),
  });
  if (error) throw error;
  return data ?? 0;
}

/**
 * Đặt chỗ + trừ ví (+ giảm slot/ghế) trong MỘT transaction ở DB — qua RPC
 * `book_and_pay` (SECURITY DEFINER, ATOMIC: hoặc thành công trọn vẹn, hoặc
 * rollback). Ném Error('insufficient') khi số dư không đủ. Client KHÔNG ghi thẳng
 * `bookings`/`wallets` (RLS chặn — xem migration 0005). Trả {booking, balance mới}.
 */
export async function bookAndPay(opts: {
  serviceType: ServiceType;
  targetId: string;
  amount: number;
  name: string;
  rateType?: RateType;
  startTime?: string;
  endTime?: string | null;
}): Promise<{ booking: BookingRow; balance: number }> {
  const { data, error } = await supabase.rpc('book_and_pay', {
    p_service_type: opts.serviceType,
    p_target_id: opts.targetId,
    p_amount: opts.amount,
    p_name: opts.name,
    p_rate_type: opts.rateType ?? null,
    p_start_time: opts.startTime ?? null,
    p_end_time: opts.endTime ?? null,
  });
  if (error) {
    // RPC raise 'insufficient' → giữ đúng hợp đồng cũ để UI xử lý "thiếu tiền".
    if (error.message?.includes('insufficient')) throw new Error('insufficient');
    throw error;
  }
  return data as { booking: BookingRow; balance: number };
}
