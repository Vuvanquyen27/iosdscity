import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';

interface RatingBadgeProps {
  rating: number;
  reviews?: number;
  /** size nhỏ gọn dùng trong card nhỏ. */
  compact?: boolean;
}

/** Sao vàng + điểm + (số đánh giá). */
export function RatingBadge({ rating, reviews, compact = false }: RatingBadgeProps) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={compact ? 13 : 16} color={Colors.yellow} />
      <Text style={[styles.rating, compact && styles.compactText]}>{rating.toFixed(1)}</Text>
      {reviews !== undefined ? (
        <Text style={[styles.reviews, compact && styles.compactText]}>
          ({reviews} {t('rating.reviews')})
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.text },
  reviews: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  compactText: { fontSize: 12 },
});
