import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

type Variant = 'primary' | 'dark' | 'outline' | 'social';

interface AppButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Logo/icon tuỳ biến (vd: logo Google/Apple SVG) — ưu tiên hơn `icon`. */
  iconNode?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Nút chính của app — cao 52px, bo góc lớn, full-width mặc định. */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  fullWidth = true,
  icon,
  iconNode,
  loading = false,
  disabled = false,
  style,
}: AppButtonProps) {
  const Colors = useThemeColors();
  const v = getVariants(Colors)[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      hitSlop={4}>
      {loading ? (
        <ActivityIndicator color={v.label.color} />
      ) : (
        <View style={styles.row}>
          {iconNode ? (
            iconNode
          ) : icon ? (
            <Ionicons name={icon} size={20} color={v.iconColor ?? v.label.color} />
          ) : null}
          <Text style={[styles.label, v.label]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const getVariants = (
  Colors: ThemeColors
): Record<Variant, { container: ViewStyle; label: { color: string }; iconColor?: string }> => ({
  primary: { container: { backgroundColor: Colors.green }, label: { color: Colors.white } },
  dark: { container: { backgroundColor: Colors.navy }, label: { color: Colors.white } },
  outline: {
    container: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
    label: { color: Colors.text },
  },
  social: {
    container: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
    label: { color: Colors.text },
  },
});

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { fontFamily: Fonts.semibold, fontSize: 16 },
});
