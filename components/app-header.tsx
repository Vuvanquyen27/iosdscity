import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Images, Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';

/** Wordmark DSCITY (brand mark + chữ) dùng ở header trang chủ. */
export function BrandLogo({ size = 22 }: { size?: number }) {
  const styles = useThemedStyles(makeStyles);
  const mark = size + 12;
  return (
    <View style={styles.brandRow}>
      <Image
        source={Images.logoMark}
        style={{ width: mark, height: mark }}
        contentFit="contain"
      />
      <Text style={[styles.brandText, { fontSize: size - 2 }]}>DSCITY</Text>
    </View>
  );
}

type AppHeaderProps =
  | {
      /** Kiểu (a): logo trái + chuông phải. */
      variant: 'logo';
      onBell?: () => void;
      hasUnread?: boolean;
    }
  | {
      /** Kiểu (b): nút back + tiêu đề. */
      variant: 'back';
      title: string;
      onBack?: () => void;
      right?: React.ReactNode;
    };

export function AppHeader(props: AppHeaderProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  if (props.variant === 'logo') {
    return (
      <View style={styles.container}>
        <BrandLogo />
        <Pressable onPress={props.onBell} style={styles.iconButton} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          {props.hasUnread ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={props.onBack} style={styles.iconButton} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={Colors.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {props.title}
      </Text>
      <View style={styles.right}>{props.right ?? <View style={styles.iconButton} />}</View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandText: { fontFamily: Fonts.bold, color: Colors.text, letterSpacing: 1 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  title: { ...Typography.h2, color: Colors.text, flex: 1, textAlign: 'center' },
  right: { width: 40, alignItems: 'flex-end' },
});
