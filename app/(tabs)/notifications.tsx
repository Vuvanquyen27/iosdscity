import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type UiKey } from '@/i18n';

interface NotiItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Khoá i18n cho tiêu đề / nội dung / thời gian (dịch khi render). */
  titleKey: UiKey;
  bodyKey: UiKey;
  timeKey: UiKey;
  unread: boolean;
}

const NOTIS: NotiItem[] = [
  {
    id: 'n1',
    icon: 'pricetag',
    titleKey: 'noti.n1.title',
    bodyKey: 'noti.n1.body',
    timeKey: 'noti.n1.time',
    unread: true,
  },
  {
    id: 'n2',
    icon: 'checkmark-circle',
    titleKey: 'noti.n2.title',
    bodyKey: 'noti.n2.body',
    timeKey: 'noti.n2.time',
    unread: true,
  },
  {
    id: 'n3',
    icon: 'wallet',
    titleKey: 'noti.n3.title',
    bodyKey: 'noti.n3.body',
    timeKey: 'noti.n3.time',
    unread: false,
  },
];

/** Tab phụ — Thông báo (tối giản, đồng bộ design system). */
export default function NotificationsScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t } = useLanguage();
  const [notis, setNotis] = useState<NotiItem[]>(NOTIS);
  const hasUnread = notis.some((n) => n.unread);

  const markAllRead = () => setNotis((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tab.notifications')}</Text>
        <Pressable
          onPress={markAllRead}
          disabled={!hasUnread}
          hitSlop={8}
          style={styles.headerAction}
          accessibilityLabel={t('noti.markAllRead')}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={hasUnread ? Colors.text : Colors.textMuted}
          />
          {hasUnread ? <View style={styles.headerDot} /> : null}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notis.map((n) => (
          <View key={n.id} style={[styles.item, n.unread && styles.itemUnread]}>
            <View style={[styles.icon, n.unread && styles.iconUnread]}>
              <Ionicons
                name={n.icon}
                size={20}
                color={n.unread ? Colors.green : Colors.textMuted}
              />
            </View>
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text style={styles.itemTitle}>{t(n.titleKey)}</Text>
                {n.unread ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.itemBody}>{t(n.bodyKey)}</Text>
              <Text style={styles.itemTime}>{t(n.timeKey)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  title: { ...Typography.h1, color: Colors.text },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  item: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  itemUnread: { borderWidth: 1, borderColor: Colors.greenSoft },
  icon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconUnread: { backgroundColor: Colors.greenSoft },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemTitle: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  itemBody: { ...Typography.caption, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  itemTime: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm, fontSize: 11 },
});
