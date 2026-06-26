import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-theme';

interface ServiceTileProps {
  /** Ảnh icon (require'd PNG) từ ServiceIcons. */
  icon: ImageSourcePropType;
  label: string;
  onPress?: () => void;
}

/** Ô dịch vụ ở trang chủ: icon trong khối bo tròn + label dưới. */
export function ServiceTile({ icon, label, onPress }: ServiceTileProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Image source={icon} style={styles.icon} contentFit="contain" />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
  container: { alignItems: 'center', width: '22%' },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    backgroundColor: Colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  icon: { width: 32, height: 32 },
  label: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'BeVietnamPro_500Medium',
  },
});
