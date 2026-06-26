import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { DetailHero } from '@/components/detail-hero';
import { RatingBadge } from '@/components/rating-badge';
import { Fonts, Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, getPlace, places, type PaymentMethod } from '@/data/mock';
import { useLocation } from '@/hooks/use-location';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { distanceTo } from '@/services/geo';
import { openDirections } from '@/services/maps';

/** Màn 5 — Chi tiết bãi đậu xe. */
export default function ParkingDetailScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = getPlace(id) ?? places[0];
  const insets = useSafeAreaInsets();
  const { location } = useLocation();

  // Khoảng cách thực từ vị trí của tôi (rơi về số liệu mock khi chưa có quyền).
  const liveDistance = location ? distanceTo(location, place.coordinate) : place.distance;

  const book = () =>
    router.push({
      pathname: '/success',
      params: {
        code: 'PARK-240512-8X7A',
        title: 'Đặt chỗ thành công!',
        subtitle: 'Vui lòng xuất trình mã QR tại bãi xe',
      },
    });

  return (
    <View style={styles.flex}>
      {/* Hero ảnh tối ở đầu màn → thanh trạng thái luôn sáng. */}
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <DetailHero image={place.image} badge={place.floor} />

        <View style={styles.body}>
          <Text style={styles.title}>{place.name}</Text>
          <View style={styles.subRow}>
            <RatingBadge rating={place.rating} reviews={place.reviews} />
            <View style={styles.distance}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.distanceText}>{place.distance}</Text>
            </View>
          </View>

          {/* Thông tin */}
          <View style={styles.infoCard}>
            <InfoRow icon="time-outline" label="Giờ hoạt động" value={place.openHours} />
            <View style={styles.separator} />
            <InfoRow
              icon="pricetag-outline"
              label="Giá"
              value={`${formatVND(place.pricePerHour)}/giờ · ${formatVND(place.pricePerDay)}/ngày`}
            />
            <View style={styles.separator} />
            <InfoRow
              icon="car-outline"
              label="Còn trống"
              value={`${place.slotsLeft} / ${place.slotsTotal} chỗ`}
            />
          </View>

          {/* Thanh toán */}
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          <View style={styles.payments}>
            {place.payments.map((p) => (
              <PaymentPill key={p} method={p} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Nút cố định đáy */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <AppButton title="Đặt chỗ ngay" onPress={book} />
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
    body: { padding: Spacing.xl },
    title: { ...Typography.h1, color: Colors.text },
    subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
    distance: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    distanceText: { ...Typography.bodyMed, color: Colors.textMuted },
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
  });
