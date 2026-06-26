import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Tiêu đề mục + link hành động ("Xem tất cả") bên phải. */
export function SectionHeader({ title, actionLabel = 'Xem tất cả', onAction }: SectionHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h2, color: Colors.text },
  action: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.green },
});
