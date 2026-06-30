import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, isBookable, type Place } from '@/data/mock';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';
import { openDirections } from '@/services/maps';

interface PlaceListItemProps {
  place: Place;
  onPress?: () => void;
}

/** Hàng địa điểm: icon "P" + tên + khoảng cách/chỗ còn + giá/giờ. */
export function PlaceListItem({ place, onPress }: PlaceListItemProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t } = useLanguage();
  const bookable = isBookable(place);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {/* Ảnh thật của bãi đỗ; chưa có ảnh (vd. bãi Google không photo) → huy hiệu "P". */}
      {place.image ? (
        <Image source={{ uri: place.image }} style={styles.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumb, styles.badge]}>
          <Text style={styles.badgeText}>P</Text>
        </View>
      )}

      <View style={styles.middle}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name.replace('Bãi đậu xe ', '')}
          </Text>
          {/* Nhãn phân biệt: bãi đối tác đặt được vs bãi lấy từ Google. */}
          <View style={[styles.tag, bookable ? styles.tagPartner : styles.tagGoogle]}>
            <Text style={[styles.tagText, bookable ? styles.tagTextPartner : styles.tagTextGoogle]}>
              {bookable ? t('place.bookable') : 'Google'}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.meta}>{place.distance}</Text>
          {bookable ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>
                {(place.slotsLeft ?? 0) > 0
                  ? t('place.slotsLeft', { n: place.slotsLeft ?? 0 })
                  : t('place.full')}
              </Text>
            </>
          ) : place.rating != null ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Ionicons name="star" size={12} color={Colors.yellow} />
              <Text style={styles.meta}>{place.rating.toFixed(1)}</Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.priceCol}>
        {bookable ? (
          <>
            <Text style={styles.price}>{formatVND(place.pricePerHour ?? 0)}</Text>
            <Text style={styles.priceUnit}>{t('unit.hour')}</Text>
          </>
        ) : (
          <Text style={styles.priceUnit}>{t('place.directions')}</Text>
        )}
      </View>

      {/* Nút chỉ đường → mở Google Maps tới địa điểm này */}
      <Pressable
        onPress={() => openDirections(place.coordinate, place.name)}
        style={({ pressed }) => [styles.directions, pressed && styles.directionsPressed]}
        hitSlop={8}>
        <Ionicons name="navigate" size={18} color={Colors.green} />
      </Pressable>
    </Pressable>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    pressed: { opacity: 0.6 },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
    },
    badge: { alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.green },
    middle: { flex: 1, marginLeft: Spacing.md },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold, flexShrink: 1 },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
    tagPartner: { backgroundColor: Colors.greenSoft },
    tagGoogle: { backgroundColor: Colors.border },
    tagText: { fontFamily: Fonts.medium, fontSize: 10 },
    tagTextPartner: { color: Colors.green },
    tagTextGoogle: { color: Colors.textMuted },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 3 },
    meta: { ...Typography.caption, color: Colors.textMuted },
    dot: { color: Colors.textMuted, marginHorizontal: 2 },
    priceCol: { alignItems: 'flex-end' },
    price: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.green },
    priceUnit: { ...Typography.caption, color: Colors.textMuted },
    directions: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.md,
    },
    directionsPressed: { opacity: 0.6 },
  });
