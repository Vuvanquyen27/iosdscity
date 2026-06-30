/**
 * Màn — Chi tiết tài khoản (sao kê).
 *
 * Gồm 3 phần:
 *  1) Header: back + tiêu đề + nút Home.
 *  2) Thẻ thông tin TK: tên, số TK + copy, số dư + QR, TK mặc định, hành động nhanh.
 *  3) Truy vấn giao dịch (từ ngày / đến ngày + nút Truy vấn) -> <TransactionHistory>.
 *
 * Màu sắc theo design system dự án (green/navy + theme token), tự đổi sáng/tối.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { TransactionHistory, groupThousands } from '@/components/transaction-history';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { bankAccount, bankTransactions } from '@/data/mock';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useWallet } from '@/hooks/use-wallet';
import { useLanguage, type UiKey } from '@/i18n';

const QUICK_ACTIONS: { key: string; labelKey: UiKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'transfer', labelKey: 'acctDetail.transfer', icon: 'swap-horizontal' },
  { key: 'statement', labelKey: 'acctDetail.statement', icon: 'document-text-outline' },
  { key: 'apple', labelKey: 'acctDetail.linkApple', icon: 'logo-apple' },
];

/** "dd/MM/yyyy" -> số chỉ-ngày sắp xếp được (yyyyMMdd) để lọc theo khoảng. */
function dayKey(date: string): number {
  const [d, m, y] = date.split('/').map(Number);
  return (y * 100 + m) * 100 + d;
}

export default function AccountDetailScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t } = useLanguage();
  const { balance } = useWallet(); // số dư thật từ ví — chung nguồn với tab Tài khoản

  // Khoảng truy vấn mặc định bao trọn dữ liệu mẫu.
  const [from, setFrom] = useState('01/06/2026');
  const [to, setTo] = useState('28/06/2026');
  const [range, setRange] = useState<{ from: string; to: string }>({ from, to });
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    const lo = dayKey(range.from);
    const hi = dayKey(range.to);
    return bankTransactions.filter((tx) => {
      const k = dayKey(tx.date);
      return k >= lo && k <= hi;
    });
  }, [range]);

  const onCopy = () => {
    Haptics.selectionAsync().catch(() => {});
    // Để copy thật: `npx expo install expo-clipboard` rồi
    // `Clipboard.setStringAsync(bankAccount.number)`.
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onQuery = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRange({ from, to });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* 1) Header */}
      <View style={styles.headerWrap}>
        <AppHeader
          variant="back"
          title={t('acctDetail.title')}
          onBack={() => router.back()}
          right={
            <Pressable onPress={() => router.dismissAll()} hitSlop={8} style={styles.homeBtn}>
              <Ionicons name="home-outline" size={22} color={Colors.text} />
            </Pressable>
          }
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* 2) Thẻ thông tin tài khoản */}
        <View style={styles.card}>
          <Text style={styles.holder}>{bankAccount.holder}</Text>
          <View style={styles.numberRow}>
            <Text style={styles.number}>{bankAccount.number}</Text>
            <Pressable onPress={onCopy} hitSlop={8} style={styles.copyBtn}>
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={18}
                color={copied ? Colors.success : Colors.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.balanceRow}>
            <View style={styles.flex}>
              <Text style={styles.balanceLabel}>{t('acctDetail.accountBalance')}</Text>
              <Text style={styles.balance}>{groupThousands(balance)} VND</Text>
            </View>
            <Pressable style={styles.qrBtn} hitSlop={8}>
              <Ionicons name="qr-code" size={22} color={Colors.white} />
            </Pressable>
          </View>

          <View style={styles.defaultRow}>
            <Text style={styles.defaultLabel}>{t('acctDetail.setDefault')}</Text>
            {bankAccount.isDefault ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('acctDetail.selected')}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable key={a.key} style={styles.action} hitSlop={4}>
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon} size={22} color={Colors.green} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {t(a.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 3) Truy vấn giao dịch */}
        <View style={styles.querySection}>
          <Text style={styles.queryTitle}>{t('acctDetail.query')}</Text>

          <View style={styles.dateRow}>
            <DateField label={t('acctDetail.from')} value={from} onChange={setFrom} styles={styles} />
            <DateField label={t('acctDetail.to')} value={to} onChange={setTo} styles={styles} />
          </View>

          <AppButton title={t('acctDetail.queryBtn')} onPress={onQuery} style={styles.queryBtn} />

          <Text style={styles.note}>{t('acctDetail.note')}</Text>
        </View>

        {/* Danh sách giao dịch gom theo ngày */}
        <TransactionHistory transactions={filtered} />
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Ô chọn ngày — hiển thị "dd/MM/yyyy" + icon lịch.
 * Hiện là ô hiển thị; để chọn ngày bằng lịch native, gắn
 * `@react-native-community/datetimepicker` vào `onPress` rồi gọi `onChange(newDate)`.
 */
function DateField({
  label,
  value,
  onChange: _onChange,
  styles,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const Colors = useThemeColors();
  return (
    <Pressable style={styles.dateField} hitSlop={4}>
      <View style={styles.flex}>
        <Text style={styles.dateLabel}>{label}</Text>
        <Text style={styles.dateValue}>{value}</Text>
      </View>
      <Ionicons name="calendar-outline" size={18} color={Colors.green} />
    </Pressable>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    scroll: { paddingBottom: Spacing['3xl'] },

    // Header
    headerWrap: { paddingHorizontal: Spacing.xl },
    homeBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

    // Thẻ tài khoản
    card: {
      backgroundColor: Colors.surface,
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.sm,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      ...Shadow.card,
    },
    holder: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.green },
    numberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
    number: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.text, letterSpacing: 0.5 },
    copyBtn: { padding: 2 },

    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    balanceLabel: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
    balance: { fontFamily: Fonts.bold, fontSize: 28, color: Colors.text, marginTop: 2 },
    qrBtn: {
      width: 44,
      height: 44,
      borderRadius: Radius.full,
      backgroundColor: Colors.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    defaultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    defaultLabel: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text },
    badge: {
      backgroundColor: Colors.greenSoft,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
    },
    badgeText: { fontFamily: Fonts.semibold, fontSize: 12, color: Colors.green },

    // Hành động nhanh
    actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
    action: {
      flex: 1,
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.bg,
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xs,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionLabel: {
      fontFamily: Fonts.medium,
      fontSize: 11,
      color: Colors.text,
      textAlign: 'center',
    },

    // Truy vấn
    querySection: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
    queryTitle: { ...Typography.h2, color: Colors.text },
    dateRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
    dateField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: Colors.surface,
    },
    dateLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
    dateValue: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text, marginTop: 2 },
    queryBtn: { marginTop: Spacing.md },
    note: {
      fontFamily: Fonts.regular,
      fontSize: 12,
      color: Colors.textMuted,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      lineHeight: 18,
    },
  });
