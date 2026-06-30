import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Chip } from '@/components/chip';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useWallet } from '@/hooks/use-wallet';
import { useLanguage, translateOrderName } from '@/i18n';
import { formatVND } from '@/data/mock';

const ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  parking: 'parking',
  car: 'car-side',
  motorbike: 'motorbike',
};

/** Tab phụ — Đặt chỗ (tối giản, đồng bộ design system). */
export default function BookingScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { transactions } = useWallet();
  const { t, td } = useLanguage();
  // Demo: coi giao dịch mới nhất là đơn đang diễn ra.
  const active = transactions[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('booking.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.chips}>
          <Chip label={t('booking.upcoming')} selected />
          <Chip label={t('booking.history')} />
        </View>

        {/* Một đơn đang diễn ra (giao dịch mới nhất) */}
        {active ? (
          <>
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <MaterialCommunityIcons name={ICON[active.kind]} size={26} color={Colors.green} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardName}>{translateOrderName(active.name, t, td)}</Text>
                <Text style={styles.cardMeta}>{td(active.datetime)}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{t('booking.active')}</Text>
              </View>
            </View>
            <Text style={styles.amount}>{formatVND(active.amount)}</Text>
          </>
        ) : null}

        {/* Empty hint cho phần còn lại */}
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{t('booking.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('booking.emptySub')}</Text>
          <View style={styles.emptyButton}>
            <AppButton
              title={t('booking.explore')}
              fullWidth={false}
              onPress={() => router.push('/home')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  title: { ...Typography.h1, color: Colors.text },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  chips: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold },
  cardMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  statusPill: {
    backgroundColor: Colors.yellowSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { fontFamily: Fonts.medium, fontSize: 11, color: '#9A6B00' },
  amount: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.green,
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  empty: { alignItems: 'center', marginTop: Spacing['3xl'] },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  emptyTitle: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  emptySub: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
  emptyButton: { marginTop: Spacing.xl },
});
