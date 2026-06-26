import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Pill chọn/không chọn — dùng cho filter & nhóm trạng thái. */
export function Chip({ label, selected = false, onPress, icon }: ChipProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.unselected]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? Colors.white : Colors.textMuted}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
  },
  selected: { backgroundColor: Colors.green },
  unselected: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  icon: { marginRight: Spacing.xs },
  label: { fontFamily: Fonts.medium, fontSize: 13 },
  labelSelected: { color: Colors.white },
  labelUnselected: { color: Colors.textMuted },
});
