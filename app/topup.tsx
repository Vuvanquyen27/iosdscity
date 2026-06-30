import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { PaymentMethodIcon } from '@/components/brand-icons';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useWallet } from '@/hooks/use-wallet';
import { formatVND, type PaymentMethod } from '@/data/mock';

const MIN_AMOUNT = 10000;
const PRESETS = [50000, 100000, 200000, 500000, 1000000, 2000000];

const METHODS: { key: PaymentMethod; label: string }[] = [
  { key: 'MOMO', label: 'Ví MoMo' },
  { key: 'VISA', label: 'Thẻ VISA •••• 4242' },
  { key: 'Mastercard', label: 'Mastercard •••• 8910' },
  { key: 'Tiền mặt', label: 'Tiền mặt tại điểm' },
];

/** Nhóm chữ số theo hàng nghìn: 100000 -> "100.000". */
function groupDigits(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Màn — Nạp tiền vào ví. */
export default function TopUpScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { balance, topup } = useWallet();
  const { prefs } = usePreferences();
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>(prefs.payment);

  const onChangeAmount = (t: string) => {
    const digits = t.replace(/\D/g, '');
    setAmount(digits ? parseInt(digits, 10) : 0);
  };

  const valid = amount >= MIN_AMOUNT;

  const onConfirm = async () => {
    try {
      await topup(amount, method); // cộng tiền vào ví (Supabase nếu đã đăng nhập)
    } catch {
      Alert.alert('Nạp tiền thất bại', 'Không nạp được tiền lúc này. Vui lòng thử lại.');
      return;
    }
    router.replace({
      pathname: '/success',
      params: {
        showQr: '0',
        title: 'Nạp tiền thành công!',
        code: `+ ${formatVND(amount)}`,
        subtitle: `Số dư mới: ${formatVND(balance + amount)}`,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title="Nạp tiền" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Số dư hiện tại */}
        <View style={styles.balanceRow}>
          <Ionicons name="wallet-outline" size={18} color={Colors.green} />
          <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          <Text style={styles.balanceValue}>{formatVND(balance)}</Text>
        </View>

        {/* Nhập số tiền */}
        <Text style={styles.sectionLabel}>Số tiền nạp</Text>
        <View style={styles.amountCard}>
          <TextInput
            style={styles.amountInput}
            value={amount > 0 ? groupDigits(amount) : ''}
            onChangeText={onChangeAmount}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={11}
          />
          <Text style={styles.amountUnit}>đ</Text>
        </View>
        <Text style={styles.hint}>Số tiền nạp tối thiểu {formatVND(MIN_AMOUNT)}</Text>

        {/* Chọn nhanh */}
        <View style={styles.presets}>
          {PRESETS.map((p) => {
            const active = amount === p;
            return (
              <Pressable
                key={p}
                style={[styles.preset, active && styles.presetActive]}
                onPress={() => setAmount(p)}>
                <Text style={[styles.presetText, active && styles.presetTextActive]}>
                  {groupDigits(p)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Phương thức thanh toán */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing['2xl'] }]}>
          Phương thức thanh toán
        </Text>
        <View style={styles.methodCard}>
          {METHODS.map((m, i) => {
            const active = method === m.key;
            return (
              <View key={m.key}>
                {i > 0 ? <View style={styles.separator} /> : null}
                <Pressable style={styles.methodRow} onPress={() => setMethod(m.key)}>
                  <View style={styles.methodIcon}>
                    <PaymentMethodIcon method={m.key} color={Colors.green} />
                  </View>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={active ? Colors.green : Colors.border}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        <AppButton
          title={valid ? `Nạp ${formatVND(amount)}` : 'Nạp tiền'}
          icon="add-circle-outline"
          disabled={!valid}
          onPress={onConfirm}
          style={{ marginTop: Spacing['2xl'] }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  headerWrap: { paddingHorizontal: Spacing.xl },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], paddingTop: Spacing.sm },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.greenSoft,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  balanceLabel: { ...Typography.bodyMed, color: Colors.text, flex: 1 },
  balanceValue: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.green },
  sectionLabel: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold, marginBottom: Spacing.sm },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    height: 72,
    ...Shadow.card,
  },
  amountInput: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 30,
    color: Colors.text,
    padding: 0,
  },
  amountUnit: { fontFamily: Fonts.bold, fontSize: 24, color: Colors.textMuted, marginLeft: Spacing.sm },
  hint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  preset: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetActive: { borderColor: Colors.green, backgroundColor: Colors.greenSoft },
  presetText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text },
  presetTextActive: { color: Colors.green },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card,
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, height: 60 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { ...Typography.bodyMed, color: Colors.text, flex: 1, fontFamily: Fonts.medium },
  separator: { height: 1, backgroundColor: Colors.border },
});
