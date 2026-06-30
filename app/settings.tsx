import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { LANGUAGE_BY_CODE } from '@/constants/languages';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/i18n';

type IconName = keyof typeof Ionicons.glyphMap;

/** Màn 11 — Cài đặt. Mỗi mục mở một TRANG riêng (không dùng popup). */
export default function SettingsScreen() {
  const { isDark, toggle } = useTheme();
  const { t, lang } = useLanguage();
  const { user } = useUser();
  const { prefs, setPref } = usePreferences();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();

  const currentLang = LANGUAGE_BY_CODE[lang];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t('set.title')} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hồ sơ tóm tắt — chạm để chỉnh sửa */}
        <Pressable
          style={({ pressed }) => [styles.profile, pressed && styles.profilePressed]}
          onPress={() => router.push('/profile')}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          <View style={styles.flex}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.phone}>{user.phone}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Tài khoản */}
        <Group title={t('set.group.account')}>
          <Row icon="person-outline" label={t('set.profile')} onPress={() => router.push('/profile')} />
          <Row icon="card-outline" label={t('set.payment')} onPress={() => router.push('/payment')} />
          <Row
            icon="lock-closed-outline"
            label={t('set.security')}
            onPress={() => router.push('/security')}
            last
          />
        </Group>

        {/* Thông báo */}
        <Group title={t('set.group.notify')}>
          <Row
            icon="notifications-outline"
            label={t('set.push')}
            right={<Toggle value={prefs.push} onValueChange={(v) => setPref('push', v)} />}
          />
          <Row
            icon="mail-outline"
            label={t('set.promo')}
            right={<Toggle value={prefs.promo} onValueChange={(v) => setPref('promo', v)} />}
            last
          />
        </Group>

        {/* Ứng dụng */}
        <Group title={t('set.group.app')}>
          <Row
            icon="moon-outline"
            label={t('set.dark')}
            right={<Toggle value={isDark} onValueChange={toggle} />}
          />
          <Row
            icon="navigate-outline"
            label={t('set.location')}
            right={<Toggle value={prefs.location} onValueChange={(v) => setPref('location', v)} />}
          />
          <Row
            icon="language-outline"
            label={t('set.language')}
            value={currentLang ? `${currentLang.flag} ${currentLang.native}` : lang}
            onPress={() => router.push('/language')}
            last
          />
        </Group>

        {/* Hỗ trợ */}
        <Group title={t('set.group.support')}>
          <Row
            icon="help-circle-outline"
            label={t('set.help')}
            onPress={() => router.push({ pathname: '/info/[topic]', params: { topic: 'help' } })}
          />
          <Row
            icon="document-text-outline"
            label={t('set.terms')}
            onPress={() => router.push({ pathname: '/info/[topic]', params: { topic: 'terms' } })}
          />
          <Row
            icon="shield-checkmark-outline"
            label={t('set.privacy')}
            onPress={() => router.push({ pathname: '/info/[topic]', params: { topic: 'privacy' } })}
          />
          <Row
            icon="information-circle-outline"
            label={t('set.about')}
            value={t('set.version')}
            onPress={() => router.push({ pathname: '/info/[topic]', params: { topic: 'about' } })}
            last
          />
        </Group>

        <AppButton
          title={t('set.logout')}
          variant="outline"
          icon="log-out-outline"
          onPress={() => router.replace('/login')}
          style={styles.logout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Nhóm cài đặt: tiêu đề + thẻ bo góc. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/** Dòng cài đặt: icon + nhãn, bên phải là chevron / giá trị / công tắc. */
function Row({
  icon,
  label,
  value,
  right,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const interactive = !!onPress;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && interactive && styles.rowPressed]}
      onPress={onPress}
      disabled={!interactive}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={20} color={Colors.green} />
      </View>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      {right ?? (
        <View style={styles.rowRight}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {interactive ? (
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          ) : null}
        </View>
      )}
      {!last ? <View style={styles.separator} /> : null}
    </Pressable>
  );
}

/** Công tắc dùng màu brand. */
function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const Colors = useThemeColors();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border, true: Colors.green }}
      thumbColor={Colors.white}
      ios_backgroundColor={Colors.border}
    />
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    headerWrap: { paddingHorizontal: Spacing.xl },
    content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing['3xl'] },
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadow.card,
    },
    profilePressed: { opacity: 0.7 },
    avatar: { width: 56, height: 56, borderRadius: Radius.full, backgroundColor: Colors.border },
    name: { ...Typography.h2, color: Colors.text },
    phone: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
    group: { marginBottom: Spacing.xl },
    groupTitle: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontFamily: Fonts.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      ...Shadow.card,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      minHeight: 56,
      paddingVertical: Spacing.sm,
    },
    rowPressed: { opacity: 0.6 },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    rowValue: { ...Typography.body, color: Colors.textMuted },
    separator: {
      position: 'absolute',
      left: 36 + Spacing.md,
      right: 0,
      bottom: 0,
      height: 1,
      backgroundColor: Colors.border,
    },
    logout: { marginTop: Spacing.sm },
  });
