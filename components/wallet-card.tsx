import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Gradients, Radius, Shadow, Spacing } from '@/constants/theme';
import { formatVND } from '@/data/mock';
import { useLanguage } from '@/i18n';

interface WalletCardProps {
  balance: number;
  /** Nhãn nút hành động bên phải, ví dụ "Nạp tiền" hoặc "Lịch sử giao dịch". */
  actionLabel: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}

/** Thẻ ví — nền xanh lá gradient, số dư + nút hành động. */
export function WalletCard({
  balance,
  actionLabel,
  actionIcon = 'add-circle-outline',
  onAction,
}: WalletCardProps) {
  const { t } = useLanguage();
  return (
    <LinearGradient
      colors={Gradients.wallet}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <Ionicons name="wallet-outline" size={16} color={Colors.white} />
          <Text style={styles.label}>{t('wallet.myWallet')}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
      </View>

      <Text style={styles.balance}>{formatVND(balance)}</Text>

      <Pressable onPress={onAction} style={styles.action}>
        <Ionicons name={actionIcon} size={16} color={Colors.green} />
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.card,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { fontFamily: Fonts.medium, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  balance: {
    fontFamily: Fonts.bold,
    fontSize: 30,
    color: Colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },
  actionText: { fontFamily: Fonts.semibold, fontSize: 13, color: Colors.green },
});
