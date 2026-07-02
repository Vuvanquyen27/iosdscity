import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Fonts, Radius, Shadow, Spacing, type ThemeColors } from '@/constants/theme';
import { Promo } from '@/data/mock';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';

const AUTOPLAY_MS = 4000;
// Carousel nằm trong vùng nội dung có padding ngang Spacing.xl ở hai bên.
const INITIAL_WIDTH = Dimensions.get('window').width - Spacing.xl * 2;

/**
 * Chủ đề màu cho từng slide (chip + gradient nền + dot). Nền sáng/tối riêng để
 * card luôn sang ở cả hai chế độ. `accent` là màu đặc dùng cho chip (chữ trắng)
 * và dot đang chọn.
 */
type PromoStyle = { accent: string; gradLight: [string, string]; gradDark: [string, string] };

const PROMO_THEME: Record<string, PromoStyle> = {
  weekend: { accent: '#2F4FA0', gradLight: ['#E9F0FF', '#D3E3FB'], gradDark: ['#1C2B49', '#121D31'] },
  car: { accent: '#0A683E', gradLight: ['#E8F6EE', '#D4ECDC'], gradDark: ['#143026', '#0D2018'] },
  motorbike: { accent: '#B26A00', gradLight: ['#FFF6E6', '#FFE9C6'], gradDark: ['#33290F', '#22190A'] },
};
const DEFAULT_THEME = PROMO_THEME.weekend;

const themeOf = (id: string) => PROMO_THEME[id] ?? DEFAULT_THEME;

/** Banner gợi ý/ưu đãi: vuốt ngang để đổi slide + tự chạy theo timer. */
export function PromoCarousel({ items }: { items: Promo[] }) {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useTheme();
  const [width, setWidth] = useState(INITIAL_WIDTH);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const dragging = useRef(false);

  // Tự chạy: cứ AUTOPLAY_MS lại trượt sang slide kế (vòng lại đầu), trừ khi đang vuốt tay.
  useEffect(() => {
    if (width === 0 || items.length <= 1) return;
    const timer = setInterval(() => {
      if (dragging.current) return;
      const next = (indexRef.current + 1) % items.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      indexRef.current = next;
      setIndex(next);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [width, items.length]);

  const syncIndex = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== indexRef.current) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  const activeAccent = themeOf(items[index]?.id ?? '').accent;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onScroll={syncIndex}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          dragging.current = false;
          syncIndex(e);
        }}>
        {items.map((promo) => {
          const th = themeOf(promo.id);
          return (
            <View key={promo.id} style={[styles.slide, { width }]}>
              <View style={styles.shadowWrap}>
                <LinearGradient
                  colors={isDark ? th.gradDark : th.gradLight}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.card}>
                  {/* Vòng trang trí + quầng sáng sau minh hoạ */}
                  <View style={[styles.ring, { backgroundColor: th.accent }]} />
                  <View style={[styles.glow, { backgroundColor: th.accent }]} />

                  {/* Nội dung chữ */}
                  <View style={styles.left}>
                    <View style={[styles.chip, { backgroundColor: th.accent }]}>
                      <Text style={styles.chipText}>{promo.tag}</Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {promo.title}
                    </Text>
                  </View>

                  {/* Minh hoạ phương tiện */}
                  <Image source={promo.icon} style={styles.icon} contentFit="contain" />
                </LinearGradient>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((promo, i) => (
            <View
              key={promo.id}
              style={[
                styles.dot,
                i === index && [styles.dotActive, { backgroundColor: activeAccent }],
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    slide: { paddingRight: 0 },
    // Bọc ngoài để giữ đổ bóng khi card bên trong bị cắt góc (overflow hidden).
    shadowWrap: { borderRadius: Radius.lg, backgroundColor: Colors.surface, ...Shadow.card },
    card: {
      minHeight: 120,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.lg,
      paddingLeft: Spacing.lg,
      paddingRight: Spacing.lg,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    left: { maxWidth: '66%' },
    chip: {
      alignSelf: 'flex-start',
      borderRadius: Radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: Spacing.sm,
    },
    chipText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.8, color: '#FFFFFF' },
    title: { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 21, color: Colors.text },
    icon: { position: 'absolute', right: 16, bottom: 12, width: 84, height: 84 },
    glow: {
      position: 'absolute',
      right: 8,
      bottom: 2,
      width: 100,
      height: 100,
      borderRadius: 50,
      opacity: 0.16,
    },
    ring: {
      position: 'absolute',
      right: -20,
      top: -20,
      width: 80,
      height: 80,
      borderRadius: 40,
      opacity: 0.1,
    },
    dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: Spacing.md },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(13,27,61,0.2)' },
    dotActive: { width: 18 },
  });
