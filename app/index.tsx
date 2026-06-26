import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Images, Spacing } from '@/constants/theme';

const AUTO_ADVANCE_MS = 2500;

const { height: SCREEN_H } = Dimensions.get('window');
const CITY_H = Math.round(SCREEN_H * 0.42);
const ROAD_H = 46;

/** Màn 1 — Splash / Onboarding. Tự chuyển sang Đăng nhập hoặc chạm để tiếp tục. */
export default function SplashOnboarding() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/login'), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable style={styles.screen} onPress={() => router.replace('/login')}>
      <StatusBar style="dark" />

      {/* Logo thương hiệu + headline */}
      <View style={[styles.top, { paddingTop: insets.top + SCREEN_H * 0.1 }]}>
        <Image source={Images.logo} style={styles.logo} contentFit="contain" />
        <Text style={styles.headline}>
          Kết nối thông minh{'\n'}Di chuyển thuận tiện
        </Text>
      </View>

      {/* Minh hoạ skyline thành phố ở nửa dưới */}
      <CitySkyline />

      {/* Page indicator */}
      <View style={[styles.dots, { bottom: insets.bottom + Spacing.lg }]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </Pressable>
  );
}

/** Skyline thành phố + ô tô (vẽ bằng View, không cần ảnh). */
function CitySkyline() {
  return (
    <View style={sky.wrap} pointerEvents="none">
      <LinearGradient colors={['#FFFFFF', '#E8F0FA', '#CFE0F4']} style={StyleSheet.absoluteFill} />

      {/* Lớp nhà phía sau (xanh nhạt) */}
      <View style={sky.row}>
        {BACK.map((b, i) => (
          <Building key={i} h={b.h} w={b.w} color="#A9C2E6" />
        ))}
      </View>

      {/* Lớp nhà phía trước (navy đậm) */}
      <View style={sky.row}>
        {FRONT.map((b, i) => (
          <Building key={i} h={b.h} w={b.w} color="#23396B" windows={b.win} />
        ))}
      </View>

      {/* Mặt đường + vạch kẻ */}
      <View style={sky.road}>
        <View style={sky.dashes}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={sky.dash} />
          ))}
        </View>
      </View>

      {/* Ô tô chạy trên đường */}
      <View style={sky.car}>
        <MaterialCommunityIcons name="car-side" size={56} color={Colors.navy} style={sky.carFlip} />
      </View>
    </View>
  );
}

/** Một toà nhà silhouette, có thể kèm vài ô cửa sổ sáng. */
function Building({ h, w, color, windows = 0 }: { h: number; w: number; color: string; windows?: number }) {
  return (
    <View style={[sky.building, { height: h, width: w, backgroundColor: color }]}>
      {windows > 0 && (
        <View style={sky.winGrid}>
          {Array.from({ length: windows }).map((_, i) => (
            <View key={i} style={sky.win} />
          ))}
        </View>
      )}
    </View>
  );
}

const BACK = [
  { h: 70, w: 26 }, { h: 100, w: 22 }, { h: 80, w: 28 }, { h: 130, w: 24 },
  { h: 95, w: 26 }, { h: 150, w: 30 }, { h: 110, w: 24 }, { h: 140, w: 28 },
  { h: 85, w: 22 }, { h: 120, w: 26 }, { h: 75, w: 24 },
];

const FRONT = [
  { h: 90, w: 28 }, { h: 130, w: 26, win: 6 }, { h: 110, w: 24 }, { h: 170, w: 30, win: 9 },
  { h: 120, w: 26 }, { h: 150, w: 28, win: 6 }, { h: 100, w: 24 }, { h: 145, w: 30, win: 9 },
  { h: 115, w: 26 }, { h: 95, w: 24 },
];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white },
  top: { alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  logo: { width: 240, height: 180 },
  headline: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 34,
    color: Colors.navy,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  dots: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(13,27,61,0.18)' },
  dotActive: { width: 24, backgroundColor: Colors.green },
});

const sky = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: CITY_H, overflow: 'hidden' },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: ROAD_H,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
  },
  building: { borderTopLeftRadius: 3, borderTopRightRadius: 3, overflow: 'hidden' },
  winGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 6, justifyContent: 'center' },
  win: { width: 4, height: 6, backgroundColor: '#FFD24D', opacity: 0.85, borderRadius: 1 },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ROAD_H,
    backgroundColor: '#46587A',
    justifyContent: 'center',
  },
  dashes: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  dash: { width: 18, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
  car: { position: 'absolute', bottom: ROAD_H - 14, alignSelf: 'center' },
  carFlip: { transform: [{ scaleX: -1 }] },
});
