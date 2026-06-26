import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

interface DetailHeroProps {
  image: string;
  /** Badge góc dưới-trái, ví dụ tầng "B2". */
  badge?: string;
  height?: number;
  /** Lớp gradient tối ở trên cùng giúp nút back/like nổi rõ trên ảnh sáng. */
  overlay?: boolean;
}

/** Ảnh đầu màn chi tiết: ảnh nền + nút back + nút yêu thích (+ badge). */
export function DetailHero({ image, badge, height = 280, overlay = false }: DetailHeroProps) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(false);

  return (
    <View style={[styles.wrap, { height }]}>
      <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={200} />

      {overlay ? (
        <LinearGradient
          colors={['rgba(13,27,61,0.45)', 'transparent']}
          style={[styles.scrim, { height: insets.top + 72 }]}
          pointerEvents="none"
        />
      ) : null}

      <View style={[styles.controls, { top: insets.top + Spacing.sm }]}>
        <Pressable style={styles.circle} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="chevron-back" size={22} color={Colors.navy} />
        </Pressable>
        <Pressable style={styles.circle} onPress={() => setLiked((v) => !v)} hitSlop={6}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? Colors.danger : Colors.navy}
          />
        </Pressable>
      </View>

      {badge ? (
        <View style={styles.badge}>
          <Ionicons name="layers-outline" size={14} color={Colors.white} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: Colors.border },
  image: { width: '100%', height: '100%' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  controls: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  badgeText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.white },
});
