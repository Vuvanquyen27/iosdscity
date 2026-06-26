import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';

interface NotiItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const NOTIS: NotiItem[] = [
  {
    id: 'n1',
    icon: 'pricetag',
    title: 'Ưu đãi cuối tuần',
    body: 'Giảm 20% các bãi đỗ nổi bật trong thành phố. Áp dụng tới Chủ nhật.',
    time: '5 phút trước',
    unread: true,
  },
  {
    id: 'n2',
    icon: 'checkmark-circle',
    title: 'Đặt chỗ thành công',
    body: 'Bãi đậu xe Central Plaza — mã PARK-240512-8X7A đã được xác nhận.',
    time: '2 giờ trước',
    unread: true,
  },
  {
    id: 'n3',
    icon: 'wallet',
    title: 'Nạp tiền thành công',
    body: 'Ví của bạn vừa được cộng 200.000đ.',
    time: 'Hôm qua',
    unread: false,
  },
];

/** Tab phụ — Thông báo (tối giản, đồng bộ design system). */
export default function NotificationsScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const [notis, setNotis] = useState<NotiItem[]>(NOTIS);
  const hasUnread = notis.some((n) => n.unread);

  const markAllRead = () => setNotis((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Thông báo</Text>
        <Pressable
          onPress={markAllRead}
          disabled={!hasUnread}
          hitSlop={8}
          style={styles.headerAction}
          accessibilityLabel="Đánh dấu tất cả đã đọc">
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
                <Text style={styles.itemTitle}>{n.title}</Text>
                {n.unread ? <View style={styles.dot} /> : null}
              </View>
              <Text style={styles.itemBody}>{n.body}</Text>
              <Text style={styles.itemTime}>{n.time}</Text>
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
