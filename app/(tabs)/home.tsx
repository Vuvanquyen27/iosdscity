import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { PlaceListItem } from '@/components/place-list-item';
import { PromoCarousel } from '@/components/promo-carousel';
import { SectionHeader } from '@/components/section-header';
import { ServiceTile } from '@/components/service-tile';
import { WalletCard } from '@/components/wallet-card';
import { Radius, ServiceIcons, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';
import { places, promos, user } from '@/data/mock';

/** Màn 3 — Trang chủ. */
export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
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
            <Text style={styles.hello}>Xin chào, {user.firstName} 👋</Text>
            <Text style={styles.helloSub}>Cùng khám phá thành phố thông minh</Text>
          </View>
        </View>

        {/* Ví */}
        <WalletCard
          balance={user.balance}
          actionLabel="Nạp tiền"
          actionIcon="add-circle"
          onAction={() => router.push('/topup')}
        />

        {/* Lưới dịch vụ */}
        <View style={styles.services}>
          <ServiceTile
            icon={ServiceIcons.parking}
            label="Bãi đậu xe"
            onPress={() => router.push({ pathname: '/parking/[id]', params: { id: 'central-plaza' } })}
          />
          <ServiceTile
            icon={ServiceIcons.car}
            label="Thuê ô tô"
            onPress={() =>
              router.push({ pathname: '/car/[id]', params: { id: 'toyota-corolla-cross' } })
            }
          />
          <ServiceTile
            icon={ServiceIcons.motorbike}
            label="Thuê xe máy"
            onPress={() =>
              router.push({ pathname: '/motorbike/[id]', params: { id: 'honda-vision-2024' } })
            }
          />
          <ServiceTile
            icon={ServiceIcons.share}
            label="Chia sẻ phương tiện"
            onPress={() => router.push('/share')}
          />
        </View>

        {/* Gợi ý cho bạn — banner ưu đãi (vuốt + tự chạy) */}
        <SectionHeader title="Gợi ý cho bạn" onAction={() => {}} />
        <PromoCarousel items={promos} />

        {/* Địa điểm phổ biến (dùng PlaceListItem) */}
        <View style={{ marginTop: Spacing['2xl'] }}>
          <SectionHeader title="Bãi đỗ phổ biến" onAction={() => router.push('/map')} />
          <View style={styles.placeCard}>
            {places.map((place, i) => (
              <View key={place.id}>
                {i > 0 ? <View style={styles.separator} /> : null}
                <PlaceListItem
                  place={place}
                  onPress={() =>
                    router.push({ pathname: '/parking/[id]', params: { id: place.id } })
                  }
                />
              </View>
            ))}
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
});
