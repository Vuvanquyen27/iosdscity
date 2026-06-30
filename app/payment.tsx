import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { PaymentMethodIcon } from '@/components/brand-icons';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { type PaymentMethod } from '@/data/mock';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type UiKey } from '@/i18n';

// labelKey: nhãn dịch theo ngôn ngữ (MoMo, Tiền mặt); label: chữ cố định (số thẻ).
const METHODS: { key: PaymentMethod; labelKey?: UiKey; label: string }[] = [
  { key: 'MOMO', labelKey: 'pay.momo', label: 'Ví MoMo' },
  { key: 'VISA', label: 'VISA •••• 4242' },
  { key: 'Mastercard', label: 'Mastercard •••• 8910' },
  { key: 'Tiền mặt', labelKey: 'pay.cash', label: 'Tiền mặt' },
];

/** Trang con — Phương thức thanh toán (chọn mặc định + thêm mới). */
export default function PaymentScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t } = useLanguage();
  const { prefs, setPref } = usePreferences();
  const [soon, setSoon] = useState(false);

  const labelFor = (m: (typeof METHODS)[number]) => (m.labelKey ? t(m.labelKey) : m.label);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t('set.payment')} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {METHODS.map((m, i) => {
            const selected = prefs.payment === m.key;
            return (
              <View key={m.key}>
                {i > 0 ? <View style={styles.separator} /> : null}
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => setPref('payment', m.key)}>
                  <View style={styles.iconTile}>
                    <PaymentMethodIcon method={m.key} color={Colors.green} />
                  </View>
                  <Text style={styles.label}>{labelFor(m)}</Text>
                  {selected ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{t('pay.default')}</Text>
                    </View>
                  ) : null}
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={selected ? Colors.green : Colors.textMuted}
                  />
                </Pressable>
              </View>
            );
          })}
        </View>

        <AppButton
          title={t('pay.add')}
          variant="outline"
          icon="add-outline"
          onPress={() => setSoon(true)}
          style={styles.add}
        />
        {soon ? (
          <View style={styles.soon}>
            <Ionicons name="construct-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.soonText}>{t('pay.added')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    headerWrap: { paddingHorizontal: Spacing.xl },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing['3xl'],
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      ...Shadow.card,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64 },
    rowPressed: { opacity: 0.6 },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },
    badge: {
      backgroundColor: Colors.greenSoft,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    badgeText: { ...Typography.caption, color: Colors.green, fontFamily: Fonts.semibold },
    separator: { height: 1, backgroundColor: Colors.border },
    add: { marginTop: Spacing.xl },
    soon: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.md,
    },
    soonText: { ...Typography.caption, color: Colors.textMuted },
  });
