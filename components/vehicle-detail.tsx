import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { PriceOption } from '@/components/price-option';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, type Vehicle } from '@/data/mock';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useVehicleImage } from '@/hooks/use-vehicle-image';
import { useLanguage } from '@/i18n';

type PriceKey = 'hour' | 'day' | 'week';

/** Rung nhẹ phản hồi thao tác (no-op trên web). */
function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
}

/**
 * Bố cục màn Thuê ô tô (6) & Thuê xe máy (7) — bám sát mockup 7.jpg:
 * header back/yêu thích · ảnh xe · tên + thông số + đánh giá ·
 * 3 gói giá (Theo giờ/ngày/tuần) · hàng tiện ích · nút "Tiếp tục đặt xe".
 */
export function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { isDark } = useTheme();
  const { t, td } = useLanguage();
  const [priceKey, setPriceKey] = useState<PriceKey>('day'); // mặc định "Theo ngày"
  const [liked, setLiked] = useState(false);

  const isCar = vehicle.kind === 'car';

  // Ảnh lấy động theo tên xe (Google / Wikipedia), fallback về ảnh mock.
  const image = useVehicleImage(vehicle.name, vehicle.kind, vehicle.image);

  const options: { key: PriceKey; label: string; value: string }[] = [
    { key: 'hour', label: t('plan.hour'), value: `${formatVND(vehicle.pricePerHour)}${t('unit.hour')}` },
    { key: 'day', label: t('plan.day'), value: `${formatVND(vehicle.pricePerDay)}${t('unit.day')}` },
    { key: 'week', label: t('plan.week'), value: `${formatVND(vehicle.pricePerWeek)}${t('unit.week')}` },
  ];

  const select = (key: PriceKey) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    setPriceKey(key);
  };

  const toggleLike = () => {
    tap();
    setLiked((v) => !v);
  };

  const cont = () => {
    tap(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/success',
      params: {
        code: isCar ? 'CAR-240512-3K2B' : 'BIKE-240512-7M5C',
        title: t('success.title'),
        subtitle: t('success.subtitle'),
      },
    });
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header: quay lại + yêu thích */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </Pressable>
        <Pressable
          onPress={toggleLike}
          hitSlop={8}
          style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? Colors.danger : Colors.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Ảnh xe trong thẻ nền sáng */}
        <View style={styles.heroCard}>
          <Image source={{ uri: image }} style={styles.heroImage} contentFit="cover" transition={200} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{vehicle.name}</Text>

          {/* Thông số (chip) + đánh giá */}
          <View style={styles.metaRow}>
            <View style={styles.chips}>
              {vehicle.attributes.map((a) => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>{td(a)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.rating}>
              <Ionicons name="star" size={15} color={Colors.yellow} />
              <Text style={styles.ratingValue}>{vehicle.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({vehicle.reviews})</Text>
            </View>
          </View>

          {/* Giá thuê */}
          <Text style={styles.sectionTitle}>{t('rental.price')}</Text>
          <View style={{ gap: Spacing.md }}>
            {options.map((o) => (
              <PriceOption
                key={o.key}
                label={o.label}
                price={o.value}
                selected={priceKey === o.key}
                onPress={() => select(o.key)}
              />
            ))}
          </View>

          {/* Tiện ích đi kèm — hàng nhỏ icon + chữ */}
          <View style={styles.features}>
            {vehicle.amenities.map((am) => (
              <View key={am.label} style={styles.feature}>
                <Ionicons name={am.icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.green} />
                <Text style={styles.featureText} numberOfLines={1}>
                  {td(am.label)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Nút cố định đáy */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <AppButton title={t('rental.continue')} onPress={cont} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      height: 52,
    },
    circle: {
      width: 42,
      height: 42,
      borderRadius: Radius.full,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.card,
    },
    pressed: { opacity: 0.7 },

    heroCard: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.sm,
      height: 220,
      borderRadius: Radius.xl,
      backgroundColor: Colors.surface,
      overflow: 'hidden',
      ...Shadow.card,
    },
    heroImage: { width: '100%', height: '100%' },

    body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
    title: { ...Typography.h1, color: Colors.text },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    chips: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1, flexWrap: 'wrap' },
    chip: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
      backgroundColor: Colors.surface,
    },
    chipText: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textMuted },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingValue: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
    ratingCount: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },

    sectionTitle: { ...Typography.h2, color: Colors.text, marginTop: Spacing['2xl'], marginBottom: Spacing.md },

    features: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginTop: Spacing.xl,
    },
    feature: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
    featureText: { fontFamily: Fonts.medium, fontSize: 11.5, color: Colors.textMuted },

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
