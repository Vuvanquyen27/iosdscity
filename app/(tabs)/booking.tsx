import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Chip } from '@/components/chip';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { formatVND, transactions } from '@/data/mock';

const ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  parking: 'parking',
  car: 'car-side',
  motorbike: 'motorbike',
};

/** Tab phụ — Đặt chỗ (tối giản, đồng bộ design system). */
export default function BookingScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  // Demo: coi đơn đầu tiên là đơn đang diễn ra.
  const active = transactions[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Đặt chỗ của tôi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.chips}>
          <Chip label="Sắp tới" selected />
          <Chip label="Lịch sử" />
        </View>

        {/* Một đơn đang diễn ra */}
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name={ICON[active.kind]} size={26} color={Colors.green} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardName}>{active.name}</Text>
            <Text style={styles.cardMeta}>{active.datetime}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Đang diễn ra</Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatVND(active.amount)}</Text>

        {/* Empty hint cho phần còn lại */}
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có lịch đặt sắp tới khác</Text>
          <Text style={styles.emptySub}>Khám phá dịch vụ và đặt chỗ ngay hôm nay</Text>
          <View style={styles.emptyButton}>
            <AppButton
              title="Khám phá dịch vụ"
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
