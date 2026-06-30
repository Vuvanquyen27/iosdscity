import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { DetailHero } from '@/components/detail-hero';
import { PlaceListItem } from '@/components/place-list-item';
import { RatingBadge } from '@/components/rating-badge';
import { Fonts, Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, isBookable, type PaymentMethod, type Place } from '@/data/mock';
import { useParkingLot, useParkingLots } from '@/hooks/use-catalog';
import { useLocation } from '@/hooks/use-location';
import { useNearbyParking } from '@/hooks/use-nearby-parking';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useWallet } from '@/hooks/use-wallet';
import { distanceTo, haversineMeters } from '@/services/geo';
import { openDirections, viewPlaceOnMap } from '@/services/maps';
import { getPlaceById } from '@/services/places';

/** Màn 5 — Chi tiết bãi đậu xe. */
export default function ParkingDetailScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const { spend } = useWallet();
  const { data: partnerLot, loading } = useParkingLot(id);

  // Bãi đối tác (Supabase) hoặc bãi Google đã nạp trong phiên (RAM cache của services/places).
  const place: Place | null = partnerLot ?? (id ? getPlaceById(id) ?? null : null);

  // "Bãi đỗ khác gần đây": gộp bãi đối tác + bãi Google quanh bãi đang xem, bỏ
  // chính nó và bãi trùng vị trí, xếp gần→xa, lấy 5 bãi. (Hook gọi vô điều kiện
  // trước các return sớm để giữ đúng thứ tự hook.)
  const { data: partnerLots } = useParkingLots();
  const googleNearby = useNearbyParking(place?.coordinate ?? null, 1500);
  const nearbyOthers = useMemo<Place[]>(() => {
    if (!place) return [];
    const here = place.coordinate;
    const partners = partnerLots
      .filter((p) => p.id !== place.id)
      .map((p) => ({ ...p, distance: distanceTo(here, p.coordinate) }));
    const googles = googleNearby
      .filter((g) => g.id !== place.id)
      .filter((g) => !partners.some((p) => haversineMeters(p.coordinate, g.coordinate) < 60))
      .map((g) => ({ ...g, distance: distanceTo(here, g.coordinate) }));
    return [...partners, ...googles]
      .sort((a, b) => haversineMeters(here, a.coordinate) - haversineMeters(here, b.coordinate))
      .slice(0, 5);
  }, [place, partnerLots, googleNearby]);

  if (loading && !place) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={Colors.green} />
      </View>
    );
  }
  if (!place) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Text style={styles.notFound}>Không tìm thấy bãi đỗ này.</Text>
      </View>
    );
  }

  const bookable = isBookable(place); // bãi đối tác mới có giá + đặt chỗ

  // Khoảng cách thực từ vị trí của tôi (rơi về số liệu mock khi chưa có quyền).
  const liveDistance = location ? distanceTo(location, place.coordinate) : place.distance;

  const book = async () => {
    // Phí đặt chỗ tính theo giờ — trừ vào ví & ghi đơn (Supabase nếu đã đăng nhập).
    const amount = place.pricePerHour ?? 0;
    try {
      const ok = await spend({
        kind: 'parking',
        name: place.name,
        amount,
        serviceType: 'parking',
        targetId: place.id,
      });
      if (!ok) {
        Alert.alert(
          'Số dư không đủ',
          'Số dư ví của bạn không đủ để đặt chỗ này. Vui lòng nạp thêm tiền.'
        );
        return;
      }
    } catch {
      Alert.alert('Đặt chỗ thất bại', 'Không đặt được chỗ lúc này. Vui lòng thử lại.');
      return;
    }
    router.push({
      pathname: '/success',
      params: {
        code: 'PARK-240512-8X7A',
        title: 'Đặt chỗ thành công!',
        subtitle: 'Vui lòng xuất trình mã QR tại bãi xe',
      },
    });
  };

  return (
    <View style={styles.flex}>
      {/* Hero ảnh tối ở đầu màn → thanh trạng thái luôn sáng. */}
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <DetailHero image={place.image} badge={place.floor} />

        <View style={styles.body}>
          <Text style={styles.title}>{place.name}</Text>
          <View style={styles.subRow}>
            {place.rating != null ? (
              <RatingBadge rating={place.rating} reviews={place.reviews} />
            ) : (
              <View style={styles.sourceTag}>
                <Ionicons name="logo-google" size={13} color={Colors.textMuted} />
                <Text style={styles.sourceTagText}>Từ Google Maps</Text>
              </View>
            )}
            <View style={styles.distance}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.distanceText}>Cách bạn {liveDistance}</Text>
            </View>
          </View>

          {/* Thông tin */}
          <View style={styles.infoCard}>
            {place.openHours ? (
              <>
                <InfoRow icon="time-outline" label="Giờ hoạt động" value={place.openHours} />
                <View style={styles.separator} />
              </>
            ) : null}
            {place.address ? (
              <>
                <InfoRow icon="location-outline" label="Địa chỉ" value={place.address} />
                <View style={styles.separator} />
              </>
            ) : null}
            {bookable ? (
              <>
                <InfoRow
                  icon="pricetag-outline"
                  label="Giá"
                  value={`${formatVND(place.pricePerHour ?? 0)}/giờ · ${formatVND(
                    place.pricePerDay ?? 0
                  )}/ngày`}
                />
                <View style={styles.separator} />
                <InfoRow
                  icon="car-outline"
                  label="Còn trống"
                  value={`${place.slotsLeft ?? 0} / ${place.slotsTotal ?? 0} chỗ`}
                />
              </>
            ) : (
              <InfoRow
                icon="information-circle-outline"
                label="Trạng thái"
                value="Bãi từ Google — chưa hỗ trợ đặt chỗ trong app"
              />
            )}
          </View>

          {/* Thanh toán — chỉ bãi đối tác */}
          {bookable && place.payments?.length ? (
            <>
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
              <View style={styles.payments}>
                {place.payments.map((p) => (
                  <PaymentPill key={p} method={p} />
                ))}
              </View>
            </>
          ) : null}

          {/* Bãi đỗ khác gần đây — nhấn để mở chi tiết bãi đó */}
          {nearbyOthers.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Bãi đỗ khác gần đây</Text>
              <View style={styles.nearbyCard}>
                {nearbyOthers.map((other, i) => (
                  <View key={other.id}>
                    {i > 0 ? <View style={styles.separator} /> : null}
                    <PlaceListItem
                      place={other}
                      onPress={() =>
                        router.push({ pathname: '/parking/[id]', params: { id: other.id } })
                      }
                    />
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Nút cố định đáy */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.footerRow}>
          {/* Xem địa điểm trên bản đồ trong app (rồi mới chỉ đường) */}
          <Pressable
            onPress={() => viewPlaceOnMap(place)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.directionsPressed]}
            hitSlop={4}>
            <Ionicons name="map-outline" size={22} color={Colors.green} />
          </Pressable>
          {bookable ? (
            <>
              {/* Chỉ đường nhanh (mở Google Maps) */}
              <Pressable
                onPress={() => openDirections(place.coordinate, place.name)}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.directionsPressed]}
                hitSlop={4}>
                <Ionicons name="navigate" size={22} color={Colors.green} />
              </Pressable>
              <View style={styles.bookBtn}>
                <AppButton title="Đặt chỗ ngay" onPress={book} />
              </View>
            </>
          ) : (
            <View style={styles.bookBtn}>
              <AppButton
                title="Chỉ đường đến đây"
                onPress={() => openDirections(place.coordinate, place.name)}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={Colors.green} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const getPaymentMeta = (
  Colors: ThemeColors
): Record<PaymentMethod, { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> => ({
  VISA: { icon: 'credit-card-outline', color: '#1A1F71' },
  Mastercard: { icon: 'credit-card-multiple-outline', color: '#EB001B' },
  MOMO: { icon: 'wallet-outline', color: '#A50064' },
  'Tiền mặt': { icon: 'cash', color: Colors.success },
});

function PaymentPill({ method }: { method: PaymentMethod }) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const meta = getPaymentMeta(Colors)[method];
  return (
    <View style={styles.payPill}>
      <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
      <Text style={styles.payText}>{method}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },
    center: { alignItems: 'center', justifyContent: 'center' },
    notFound: { ...Typography.body, color: Colors.textMuted },
    body: { padding: Spacing.xl },
    title: { ...Typography.h1, color: Colors.text },
    subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
    distance: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    distanceText: { ...Typography.bodyMed, color: Colors.textMuted },
    sourceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sourceTagText: { ...Typography.caption, color: Colors.textMuted },
    infoCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.md },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoLabel: { ...Typography.body, color: Colors.textMuted, flex: 1 },
    infoValue: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold, textAlign: 'right', flexShrink: 1 },
    separator: { height: 1, backgroundColor: Colors.border },
    sectionTitle: { ...Typography.h2, color: Colors.text, marginTop: Spacing['2xl'], marginBottom: Spacing.md },
    nearbyCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
    },
    payments: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    payPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    payText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    bookBtn: { flex: 1 },
    iconBtn: {
      width: 52,
      height: 52,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    directionsPressed: { opacity: 0.7 },
  });
