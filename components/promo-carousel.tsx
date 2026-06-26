import { Image } from 'expo-image';
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

import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { Promo } from '@/data/mock';
import { useThemedStyles } from '@/hooks/use-theme';

const AUTOPLAY_MS = 4000;
// Carousel nằm trong vùng nội dung có padding ngang Spacing.xl ở hai bên.
const INITIAL_WIDTH = Dimensions.get('window').width - Spacing.xl * 2;

/** Banner gợi ý/ưu đãi: vuốt ngang để đổi slide + tự chạy theo timer. */
export function PromoCarousel({ items }: { items: Promo[] }) {
  const styles = useThemedStyles(makeStyles);
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
        {items.map((promo) => (
          <View key={promo.id} style={[styles.banner, { width }]}>
            <View style={styles.flex}>
              <Text style={styles.tag}>{promo.tag}</Text>
              <Text style={styles.title}>{promo.title}</Text>
            </View>
            <Image source={promo.icon} style={styles.icon} contentFit="contain" />
          </View>
        ))}
      </ScrollView>

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((promo, i) => (
            <View key={promo.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.yellowSoft,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      ...Shadow.card,
    },
    icon: { width: 72, height: 72 },
    tag: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.green, letterSpacing: 1 },
    title: {
      ...Typography.bodyMed,
      color: Colors.text,
      marginTop: Spacing.xs,
      fontFamily: Fonts.semibold,
    },
    dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: Spacing.md },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(13,27,61,0.2)' },
    dotActive: { width: 18, backgroundColor: Colors.green },
  });
