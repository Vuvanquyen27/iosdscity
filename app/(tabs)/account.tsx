import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader } from '@/components/section-header';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, type Transaction, type TransactionStatus } from '@/data/mock';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useUser } from '@/hooks/use-user';
import { useWallet } from '@/hooks/use-wallet';
import { useLanguage, translateOrderName, type UiKey } from '@/i18n';

const ICON: Record<Transaction['kind'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  parking: 'parking',
  car: 'car-side',
  motorbike: 'motorbike',
};

/** Khoá i18n nhãn trạng thái đơn. */
const STATUS_KEY: Record<TransactionStatus, UiKey> = {
  ongoing: 'status.ongoing',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
};

const FILTERS: {
  key: 'all' | TransactionStatus;
  labelKey: UiKey;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'all', labelKey: 'status.all', icon: 'view-grid-outline' },
  { key: 'ongoing', labelKey: 'status.ongoing', icon: 'clipboard-clock-outline' },
  { key: 'completed', labelKey: 'status.completed', icon: 'shield-check-outline' },
  { key: 'cancelled', labelKey: 'status.cancelled', icon: 'close-circle-outline' },
];

/** Màn 10 — Tài khoản / Lịch sử. */
export default function AccountScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { isDark } = useTheme();
  const { t, td } = useLanguage();
  const { user } = useUser();
  const { balance, transactions } = useWallet();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | TransactionStatus>('all');

  // Header navy nằm sau thanh trạng thái → ép chữ trạng thái sáng khi màn này hiển thị.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle(isDark ? 'light' : 'dark');
    }, [isDark])
  );

  const list = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((tx) => tx.status === filter)),
    [filter, transactions]
  );

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header navy: hồ sơ + thẻ số dư nổi */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.profile}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
            <View style={styles.flex}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.phone}>{user.phone}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.settings, pressed && styles.pressed]}
              onPress={() => router.push('/settings')}
              hitSlop={8}>
              <Ionicons name="settings-outline" size={22} color={Colors.white} />
            </Pressable>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.flex}>
              <Text style={styles.balance}>{formatVND(balance)}</Text>
              <Text style={styles.balanceLabel}>{t('account.availableBalance')}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.historyBtn, pressed && styles.pressed]}
              onPress={() => router.push('/account-detail')}
              hitSlop={8}>
              <Text style={styles.historyBtnText}>{t('account.txHistory')}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.green} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          {/* Đăng xe cho thuê — mở form thêm xe vào danh mục */}
          <Pressable
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
            onPress={() => router.push('/vehicle/new')}>
            <View style={styles.actionIcon}>
              <Ionicons name="car-sport-outline" size={24} color={Colors.green} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.actionTitle}>Đăng xe cho thuê</Text>
              <Text style={styles.actionSub}>Thêm ô tô / xe máy của bạn vào danh mục</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </Pressable>

          {/* Đơn hàng của tôi — bộ lọc icon */}
          <Text style={styles.sectionTitle}>{t('account.myOrders')}</Text>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={styles.filterItem}
                  onPress={() => setFilter(f.key)}
                  hitSlop={4}>
                  <MaterialCommunityIcons
                    name={f.icon}
                    size={26}
                    color={active ? Colors.green : Colors.text}
                  />
                  <Text
                    style={[styles.filterLabel, active && styles.filterLabelActive]}
                    numberOfLines={1}>
                    {t(f.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Lịch sử gần đây */}
          <SectionHeader title={t('account.recent')} onAction={() => {}} />
          {list.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{t('account.empty')}</Text>
            </View>
          ) : (
            <View style={styles.historyCard}>
              {list.map((tx, i) => (
                <View key={tx.id}>
                  {i > 0 ? <View style={styles.separator} /> : null}
                  <View style={styles.txRow}>
                    <View style={styles.txIcon}>
                      <MaterialCommunityIcons name={ICON[tx.kind]} size={24} color={Colors.green} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.txName} numberOfLines={1}>
                        {translateOrderName(tx.name, t, td)}
                      </Text>
                      <Text style={styles.txMeta}>{td(tx.datetime)}</Text>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={styles.txAmount}>{formatVND(tx.amount)}</Text>
                      <Text style={[styles.txStatus, statusColor(tx.status, Colors)]}>
                        {t(STATUS_KEY[tx.status])}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Màu nhãn trạng thái theo loại. */
function statusColor(status: TransactionStatus, Colors: ThemeColors) {
  if (status === 'cancelled') return { color: Colors.danger };
  if (status === 'ongoing') return { color: Colors.green };
  return { color: Colors.success };
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    content: { paddingBottom: Spacing['3xl'] },

    // Header navy
    header: {
      backgroundColor: Colors.navy,
      borderBottomLeftRadius: Radius.xl,
      borderBottomRightRadius: Radius.xl,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
    profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: Radius.full,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.25)',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    name: { ...Typography.h2, color: Colors.white },
    phone: { ...Typography.body, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    settings: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.6 },

    // Thẻ số dư nổi trên header
    balanceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      ...Shadow.card,
    },
    balance: { fontFamily: Fonts.bold, fontSize: 26, color: Colors.text },
    balanceLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
    historyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      backgroundColor: Colors.greenSoft,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.full,
    },
    historyBtnText: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.green },

    // Thân màn
    body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
    sectionTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.lg },

    // Thẻ "Đăng xe cho thuê"
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.xl,
      ...Shadow.card,
    },
    actionIcon: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionTitle: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold },
    actionSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },

    // Bộ lọc icon
    filterRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    filterItem: { flex: 1, alignItems: 'center', gap: Spacing.sm },
    filterLabel: { ...Typography.caption, color: Colors.textMuted, fontFamily: Fonts.medium },
    filterLabelActive: { color: Colors.green, fontFamily: Fonts.semibold },

    // Lịch sử
    historyCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      ...Shadow.card,
    },
    txRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
    txIcon: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txName: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold },
    txMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
    txRight: { alignItems: 'flex-end' },
    txAmount: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
    txStatus: { ...Typography.caption, marginTop: 2, fontFamily: Fonts.medium },
    separator: { height: 1, backgroundColor: Colors.border },

    emptyCard: {
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingVertical: Spacing['3xl'],
      ...Shadow.card,
    },
    emptyText: { ...Typography.body, color: Colors.textMuted },
  });
