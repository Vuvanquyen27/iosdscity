import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { Fonts, Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import type { VehicleKind } from '@/data/mock';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { createVehicle } from '@/services/api';

type Transmission = 'auto' | 'manual';

/** Tiện ích đi kèm — slug khớp FEATURE_AMENITY trong services/api.ts. */
const FEATURES: { slug: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { slug: 'bao_hiem_day_du', label: 'Bảo hiểm đầy đủ', icon: 'shield-checkmark-outline' },
  { slug: 'giao_xe_tan_noi', label: 'Giao xe tận nơi', icon: 'car-outline' },
  { slug: 'ho_tro_247', label: 'Hỗ trợ 24/7', icon: 'headset-outline' },
  { slug: 'tiet_kiem_xang', label: 'Tiết kiệm xăng', icon: 'leaf-outline' },
  { slug: 'cop_rong', label: 'Cốp rộng rãi', icon: 'cube-outline' },
  { slug: '2_mu_bao_hiem', label: '2 mũ bảo hiểm', icon: 'bicycle-outline' },
];

const FUELS = ['Xăng', 'Điện', 'Dầu'];

/** Nhóm chữ số theo hàng nghìn: 100000 -> "100.000". */
function groupDigits(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Chuỗi nhập -> số nguyên (chỉ giữ chữ số). */
function toInt(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** Màn — Đăng xe cho thuê. Điền đủ điều kiện -> ghi vào DB -> mở màn chi tiết. */
export default function NewVehicleScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();

  const [kind, setKind] = useState<VehicleKind>('car');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [transmission, setTransmission] = useState<Transmission>('auto');
  const [seats, setSeats] = useState(0);
  const [cc, setCc] = useState(0);
  const [fuel, setFuel] = useState('Xăng');
  const [priceHour, setPriceHour] = useState(0);
  const [priceDay, setPriceDay] = useState(0);
  const [priceWeek, setPriceWeek] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCar = kind === 'car';

  // Đủ điều kiện mới cho đăng (nút sáng): tên + thông số loại xe + 3 mức giá.
  const valid =
    name.trim().length > 0 &&
    fuel.length > 0 &&
    priceHour > 0 &&
    priceDay > 0 &&
    priceWeek > 0 &&
    (isCar ? seats > 0 : cc > 0);

  const toggleFeature = (slug: string) =>
    setFeatures((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const onSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const v = await createVehicle({
        kind,
        name,
        brand,
        transmission,
        seats: isCar ? seats : null,
        engineCapacity: isCar ? null : cc,
        fuelType: fuel,
        pricePerHour: priceHour,
        pricePerDay: priceDay,
        pricePerWeek: priceWeek,
        features,
        imageUrl,
      });
      // Đăng xong -> mở luôn màn chi tiết (cùng giao diện Toyota Cross).
      router.replace({
        pathname: v.kind === 'car' ? '/car/[id]' : '/motorbike/[id]',
        params: { id: v.id },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại.';
      if (/đăng nhập/i.test(msg)) {
        Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng xe cho thuê.', [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/login') },
        ]);
      } else {
        Alert.alert('Đăng xe thất bại', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title="Đăng xe cho thuê" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Loại xe */}
        <Text style={styles.label}>Loại xe</Text>
        <View style={styles.segment}>
          {(
            [
              { key: 'car', label: 'Ô tô', icon: 'car-sport-outline' },
              { key: 'motorbike', label: 'Xe máy', icon: 'bicycle-outline' },
            ] as const
          ).map((opt) => {
            const active = kind === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setKind(opt.key)}>
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={active ? Colors.white : Colors.textMuted}
                />
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tên xe */}
        <Text style={styles.label}>Tên xe</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="VD: Toyota Corolla Cross"
            placeholderTextColor={Colors.textMuted}
            maxLength={60}
          />
        </View>

        {/* Hãng (tuỳ chọn) */}
        <Text style={styles.label}>Hãng (tuỳ chọn)</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="VD: Toyota"
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
          />
        </View>

        {/* Hộp số */}
        <Text style={styles.label}>Hộp số</Text>
        <View style={styles.segment}>
          {(
            [
              { key: 'auto', label: 'Tự động' },
              { key: 'manual', label: 'Số sàn' },
            ] as const
          ).map((opt) => {
            const active = transmission === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                onPress={() => setTransmission(opt.key)}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Số chỗ (ô tô) / Dung tích (xe máy) */}
        {isCar ? (
          <>
            <Text style={styles.label}>Số chỗ ngồi</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                value={seats > 0 ? String(seats) : ''}
                onChangeText={(t) => setSeats(toInt(t))}
                placeholder="VD: 5"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.unit}>chỗ</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Dung tích xy-lanh</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                value={cc > 0 ? String(cc) : ''}
                onChangeText={(t) => setCc(toInt(t))}
                placeholder="VD: 125"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.unit}>cc</Text>
            </View>
          </>
        )}

        {/* Nhiên liệu */}
        <Text style={styles.label}>Nhiên liệu</Text>
        <View style={styles.chips}>
          {FUELS.map((f) => {
            const active = fuel === f;
            return (
              <Pressable
                key={f}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFuel(f)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Giá thuê */}
        <Text style={[styles.label, { marginTop: Spacing.xl }]}>Giá thuê (VND)</Text>
        {(
          [
            { key: 'hour', label: 'Theo giờ', value: priceHour, set: setPriceHour },
            { key: 'day', label: 'Theo ngày', value: priceDay, set: setPriceDay },
            { key: 'week', label: 'Theo tuần', value: priceWeek, set: setPriceWeek },
          ] as const
        ).map((p) => (
          <View key={p.key} style={styles.priceRow}>
            <Text style={styles.priceLabel}>{p.label}</Text>
            <View style={styles.priceInputWrap}>
              <TextInput
                style={styles.priceInput}
                value={p.value > 0 ? groupDigits(p.value) : ''}
                onChangeText={(t) => p.set(toInt(t))}
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={11}
              />
              <Text style={styles.unit}>đ</Text>
            </View>
          </View>
        ))}

        {/* Tiện ích đi kèm */}
        <Text style={[styles.label, { marginTop: Spacing.xl }]}>Tiện ích đi kèm</Text>
        <View style={styles.chips}>
          {FEATURES.map((f) => {
            const active = features.includes(f.slug);
            return (
              <Pressable
                key={f.slug}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleFeature(f.slug)}>
                <Ionicons
                  name={f.icon}
                  size={15}
                  color={active ? Colors.white : Colors.green}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Ảnh xe (tuỳ chọn) */}
        <Text style={[styles.label, { marginTop: Spacing.xl }]}>Link ảnh xe (tuỳ chọn)</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={styles.hint}>Để trống sẽ tự lấy ảnh theo tên xe.</Text>

        <AppButton
          title="Đăng xe cho thuê"
          icon="checkmark-circle-outline"
          disabled={!valid}
          loading={submitting}
          onPress={onSubmit}
          style={{ marginTop: Spacing['2xl'] }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    headerWrap: { paddingHorizontal: Spacing.xl },
    content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], paddingTop: Spacing.sm },

    label: {
      ...Typography.bodyMed,
      color: Colors.text,
      fontFamily: Fonts.semibold,
      marginBottom: Spacing.sm,
      marginTop: Spacing.lg,
    },

    // Đoạn chọn 2 lựa chọn (loại xe / hộp số)
    segment: {
      flexDirection: 'row',
      gap: Spacing.sm,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    segmentItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
    },
    segmentItemActive: { backgroundColor: Colors.green },
    segmentText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textMuted },
    segmentTextActive: { color: Colors.white },

    // Ô nhập chữ / số có đơn vị
    inputCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      height: 56,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    input: { flex: 1, fontFamily: Fonts.medium, fontSize: 16, color: Colors.text, padding: 0 },
    unit: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textMuted, marginLeft: Spacing.sm },
    hint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },

    // Chip chọn (nhiên liệu / tiện ích)
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      borderWidth: 1.5,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    chipActive: { backgroundColor: Colors.green, borderColor: Colors.green },
    chipText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.text },
    chipTextActive: { color: Colors.white },

    // Hàng giá
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      height: 56,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: Spacing.sm,
    },
    priceLabel: { ...Typography.bodyMed, color: Colors.text, flex: 1, fontFamily: Fonts.medium },
    priceInputWrap: { flexDirection: 'row', alignItems: 'center' },
    priceInput: {
      fontFamily: Fonts.bold,
      fontSize: 17,
      color: Colors.text,
      padding: 0,
      textAlign: 'right',
      minWidth: 90,
    },
  });
