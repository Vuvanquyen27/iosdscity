import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';

interface PriceOptionProps {
  label: string;
  price: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Hàng chọn gói giá (Theo giờ / ngày / tuần) — selected: viền xanh + tick xanh bên phải. */
export function PriceOption({ label, price, selected = false, onPress }: PriceOptionProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>

      <View style={styles.right}>
        <Text style={[styles.price, selected && styles.priceSelected]}>{price}</Text>
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={13} color={Colors.white} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      backgroundColor: Colors.surface,
    },
    selected: { borderColor: Colors.green },
    unselected: { borderColor: Colors.border },
    pressed: { opacity: 0.85 },
    label: { fontFamily: Fonts.medium, fontSize: 15, color: Colors.text },
    labelSelected: { fontFamily: Fonts.semibold, color: Colors.green },
    right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    price: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textMuted },
    priceSelected: { color: Colors.green, fontFamily: Fonts.bold },
    check: {
      width: 22,
      height: 22,
      borderRadius: Radius.full,
      backgroundColor: Colors.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
