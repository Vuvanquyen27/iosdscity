import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Shadow, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Bỏ padding mặc định (ví dụ card có ảnh tràn viền). */
  noPadding?: boolean;
}

/** Khối nền thẻ, bo góc lớn, có shadow nhẹ. */
export function Card({ children, style, noPadding = false }: CardProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, !noPadding && styles.padded, style]}>{children}</View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      ...Shadow.card,
    },
    padded: { padding: Spacing.lg },
  });
