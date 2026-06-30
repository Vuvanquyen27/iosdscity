import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { PlaceListItem } from '@/components/place-list-item';
import { PromoCarousel } from '@/components/promo-carousel';
import { SectionHeader } from '@/components/section-header';
import { ServiceTile } from '@/components/service-tile';
import { WalletCard } from '@/components/wallet-card';
import { Radius, ServiceIcons, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useParkingLots, useVehicles } from '@/hooks/use-catalog';
import { useLocation } from '@/hooks/use-location';
import { useNearbyParking } from '@/hooks/use-nearby-parking';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useUser } from '@/hooks/use-user';
import { useWallet } from '@/hooks/use-wallet';
import { useLanguage } from '@/i18n';
import { MY_LOCATION, promos } from '@/data/mock';
import { distanceTo, haversineMeters } from '@/services/geo';

/** Màn 3 — Trang chủ. */
export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { user } = useUser();
  const { balance } = useWallet();
  const { location } = useLocation();
  const { t } = useLanguage();

  const { data: parkingLots, loading: loadingPlaces } = useParkingLots();
  const { data: vehicles } = useVehicles();

  // ID xe thật để nút dịch vụ mở đúng mẫu đầu tiên (DB dùng UUID, không phải slug).
  const firstCarId = vehicles.find((v) => v.kind === 'car')?.id;
  const firstBikeId = vehicles.find((v) => v.kind === 'motorbike')?.id;

  // Bãi Google quanh tôi để "tìm thêm bãi khác" (trả [] khi chưa cấu hình key →
  // chỉ còn bãi đối tác như cũ, không lỗi).
  const myLocation = location ?? MY_LOCATION;
  const googlePlaces = useNearbyParking(myLocation, 2000);

  // Khoảng cách tới từng bãi đỗ tính theo vị trí thật của tôi (rơi về vị trí
  // giả lập khi chưa có quyền). Gộp bãi ĐỐI TÁC (đặt được) + bãi GOOGLE (chỉ
  // đường), bỏ bãi Google trùng vị trí (≤ 60m) với bãi đối tác — giống màn Bản đồ.
  const placesWithDistance = useMemo(() => {
    const partner = parkingLots.map((p) => ({ ...p, distance: distanceTo(myLocation, p.coordinate) }));
    const extras = googlePlaces
      .filter((g) => !partner.some((p) => haversineMeters(p.coordinate, g.coordinate) < 60))
      .map((g) => ({ ...g, distance: distanceTo(myLocation, g.coordinate) }));
    return [...partner, ...extras];
  }, [myLocation, parkingLots, googlePlaces]);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <AppHeader variant="logo" hasUnread onBell={() => router.push('/notifications')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Lời chào */}
        <View style={styles.greetRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          <View style={styles.flex}>
            <Text style={styles.hello}>{t('home.greeting', { name: user.firstName })}</Text>
            <Text style={styles.helloSub}>{t('home.greetingSub')}</Text>
          </View>
        </View>

        {/* Ví */}
        <WalletCard
          balance={balance}
          actionLabel={t('wallet.topup')}
          actionIcon="add-circle"
          onAction={() => router.push('/topup')}
        />

        {/* Lưới dịch vụ */}
        <View style={styles.services}>
          <ServiceTile
            icon={ServiceIcons.parking}
            label={t('order.parkingPrefix')}
            onPress={() => router.push('/map')}
          />
          <ServiceTile
            icon={ServiceIcons.car}
            label={t('rental.car')}
            onPress={() =>
              firstCarId && router.push({ pathname: '/car/[id]', params: { id: firstCarId } })
            }
          />
          <ServiceTile
            icon={ServiceIcons.motorbike}
            label={t('rental.motorbike')}
            onPress={() =>
              firstBikeId &&
              router.push({ pathname: '/motorbike/[id]', params: { id: firstBikeId } })
            }
          />
          <ServiceTile
            icon={ServiceIcons.share}
            label={t('service.share')}
            onPress={() => router.push('/share')}
          />
        </View>

        {/* Gợi ý cho bạn — banner ưu đãi (vuốt + tự chạy) */}
        <SectionHeader title={t('home.suggestions')} onAction={() => {}} />
        <PromoCarousel items={promos} />

        {/* Địa điểm phổ biến (dùng PlaceListItem) */}
        <View style={{ marginTop: Spacing['2xl'] }}>
          <SectionHeader title={t('home.popularParking')} onAction={() => router.push('/map')} />
          <View style={styles.placeCard}>
            {loadingPlaces ? (
              <ActivityIndicator color={Colors.green} style={{ paddingVertical: Spacing['2xl'] }} />
            ) : placesWithDistance.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có bãi đỗ nào.</Text>
            ) : (
              placesWithDistance.map((place, i) => (
                <View key={place.id}>
                  {i > 0 ? <View style={styles.separator} /> : null}
                  <PlaceListItem
                    place={place}
                    onPress={() =>
                      router.push({ pathname: '/parking/[id]', params: { id: place.id } })
                    }
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: Spacing.xl, backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: Radius.full, backgroundColor: Colors.border },
  hello: { ...Typography.h2, color: Colors.text },
  helloSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  services: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  placeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card,
  },
  separator: { height: 1, backgroundColor: Colors.border },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing['2xl'] },
});
