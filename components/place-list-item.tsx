import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, type Place } from '@/data/mock';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';

interface PlaceListItemProps {
  place: Place;
  onPress?: () => void;
}

/** Hàng địa điểm: icon "P" + tên + khoảng cách/chỗ còn + giá/giờ. */
export function PlaceListItem({ place, onPress }: PlaceListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>P</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name.replace('Bãi đậu xe ', '')}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.meta}>{place.distance}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>
            {place.slotsLeft > 0 ? `Còn ${place.slotsLeft} chỗ` : 'Hết chỗ'}
          </Text>
        </View>
      </View>

      <View style={styles.priceCol}>
        <Text style={styles.price}>{formatVND(place.pricePerHour)}</Text>
        <Text style={styles.priceUnit}>/giờ</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    pressed: { opacity: 0.6 },
    badge: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.green },
    middle: { flex: 1, marginLeft: Spacing.md },
    name: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 3 },
    meta: { ...Typography.caption, color: Colors.textMuted },
    dot: { color: Colors.textMuted, marginHorizontal: 2 },
    priceCol: { alignItems: 'flex-end' },
    price: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.green },
    priceUnit: { ...Typography.caption, color: Colors.textMuted },
  });
