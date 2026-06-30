import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { Colors, Fonts, Images, Spacing } from '@/constants/theme';

const AUTO_ADVANCE_MS = 2500;

// Tỉ lệ gốc của hình minh hoạ skyline (theo thiết kế Figma).
const ART_W = 402;
const ART_H = 500;

/**
 * Minh hoạ skyline + đường + ô tô (xuất từ Figma, vẽ bằng SVG).
 * viewBox 402×500, neo đáy giữa để luôn dính mép dưới màn hình.
 */
const SKYLINE_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 402 500" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"></stop><stop offset="1" stop-color="#EFF5FC"></stop></linearGradient>
    <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF1FB"></stop><stop offset="1" stop-color="#DCE8F6"></stop></linearGradient>
    <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16294F"></stop><stop offset="1" stop-color="#0A1730"></stop></linearGradient>
    <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"></stop><stop offset="1" stop-color="#DCE2EC"></stop></linearGradient>
    <pattern id="winMid" width="8" height="12" patternUnits="userSpaceOnUse"><rect width="8" height="12" fill="#2E5AA0"></rect><rect x="1.8" y="2.6" width="3.2" height="5" rx="0.4" fill="#AECBEE" opacity="0.9"></rect></pattern>
    <pattern id="winMid2" width="8" height="12" patternUnits="userSpaceOnUse"><rect width="8" height="12" fill="#4E7CC0"></rect><rect x="1.8" y="2.6" width="3.2" height="5" rx="0.4" fill="#CBDDF5" opacity="0.9"></rect></pattern>
    <pattern id="winNavy" width="8" height="12" patternUnits="userSpaceOnUse"><rect width="8" height="12" fill="#16294F"></rect><rect x="1.8" y="2.6" width="3.2" height="5" rx="0.4" fill="#4E7CC0" opacity="0.85"></rect></pattern>
  </defs>

  <rect x="0" y="0" width="402" height="320" fill="url(#skyGrad)"></rect>

  <g fill="#CCDBEF" opacity="0.6">
    <rect x="4" y="170" width="16" height="150"></rect>
    <rect x="32" y="85" width="14" height="235"></rect><path d="M32 85 L39 68 L46 85 Z"></path>
    <rect x="62" y="185" width="18" height="135"></rect>
    <rect x="108" y="165" width="14" height="155"></rect>
    <rect x="148" y="120" width="16" height="200"></rect><rect x="154" y="100" width="4" height="20"></rect>
    <rect x="222" y="92" width="16" height="228"></rect><path d="M222 92 L230 74 L238 92 Z"></path>
    <rect x="270" y="170" width="14" height="150"></rect>
    <rect x="298" y="182" width="18" height="138"></rect>
    <rect x="340" y="80" width="14" height="240"></rect><path d="M340 80 L347 62 L354 80 Z"></path>
    <rect x="372" y="178" width="22" height="142"></rect>
  </g>

  <g>
    <rect x="18" y="182" width="20" height="140" fill="url(#winMid2)"></rect><rect x="56" y="150" width="22" height="172" fill="url(#winMid2)"></rect><rect x="94" y="190" width="18" height="132" fill="url(#winMid2)"></rect><rect x="176" y="168" width="22" height="154" fill="url(#winMid2)"></rect><rect x="206" y="150" width="20" height="172" fill="url(#winMid2)"></rect><rect x="258" y="182" width="20" height="140" fill="url(#winMid2)"></rect><rect x="286" y="160" width="22" height="162" fill="url(#winMid2)"></rect><rect x="330" y="186" width="20" height="136" fill="url(#winMid2)"></rect><rect x="360" y="168" width="22" height="154" fill="url(#winMid2)"></rect>
  </g>

  <g>
    <rect x="-2" y="168" width="24" height="156" fill="url(#winMid)"></rect><rect x="24" y="140" width="22" height="184" fill="url(#winMid)"></rect><rect x="52" y="182" width="20" height="142" fill="url(#winMid)"></rect><rect x="86" y="150" width="24" height="174" fill="url(#winMid)"></rect><rect x="118" y="100" width="22" height="224" fill="url(#winMid)"></rect><rect x="150" y="170" width="22" height="154" fill="url(#winMid)"></rect><rect x="190" y="144" width="24" height="180" fill="url(#winMid)"></rect><rect x="216" y="96" width="22" height="228" fill="url(#winMid)"></rect><rect x="248" y="172" width="22" height="152" fill="url(#winMid)"></rect><rect x="280" y="144" width="24" height="180" fill="url(#winMid)"></rect><rect x="314" y="174" width="20" height="150" fill="url(#winMid)"></rect><rect x="344" y="150" width="22" height="174" fill="url(#winMid)"></rect><rect x="372" y="170" width="30" height="154" fill="url(#winMid)"></rect>
  </g>

  <g>
    <rect x="2" y="182" width="24" height="148" fill="url(#winNavy)"></rect><rect x="34" y="158" width="22" height="172" fill="url(#winNavy)"></rect><rect x="132" y="178" width="24" height="152" fill="url(#winNavy)"></rect><rect x="238" y="184" width="22" height="146" fill="url(#winNavy)"></rect><rect x="322" y="158" width="22" height="172" fill="url(#winNavy)"></rect><rect x="356" y="178" width="26" height="152" fill="url(#winNavy)"></rect>
  </g>

  <rect x="122" y="86" width="14" height="14" fill="#2E5AA0"></rect><rect x="126" y="72" width="6" height="14" fill="#2E5AA0"></rect>
  <line x1="129" y1="72" x2="129" y2="50" stroke="#2E5AA0" stroke-width="2"></line><circle cx="129" cy="49" r="2" fill="#FFC107"></circle>
  <line x1="227" y1="96" x2="227" y2="70" stroke="#2E5AA0" stroke-width="2"></line><circle cx="227" cy="69" r="2" fill="#FFC107"></circle>
  <ellipse cx="292" cy="144" rx="12" ry="7" fill="#2E5AA0"></ellipse>
  <rect x="94" y="138" width="8" height="12" fill="#2E5AA0"></rect>

  <g stroke="#9DBEE6" stroke-width="2" fill="none" opacity="0.9" stroke-linecap="round">
    <path d="M48 114 Q56 105 64 114"></path><path d="M51 118 Q56 112 61 118"></path>
    <path d="M196 132 Q203 124 210 132"></path><path d="M199 136 Q203 131 207 136"></path>
    <circle cx="330" cy="120" r="7"></circle>
  </g>
  <circle cx="56" cy="121" r="1.4" fill="#9DBEE6"></circle><circle cx="203" cy="139" r="1.3" fill="#9DBEE6"></circle>
  <circle cx="330" cy="120" r="2" fill="#9DBEE6"></circle><path d="M330 127 L330 133" stroke="#9DBEE6" stroke-width="2" stroke-linecap="round"></path>

  <rect x="0" y="320" width="402" height="180" fill="url(#groundGrad)"></rect>

  <g><rect x="92" y="316" width="3" height="9" fill="#5E3F22"></rect><circle cx="90" cy="314" r="9" fill="#2E7D32"></circle><circle cx="98" cy="316" r="8" fill="#43A047"></circle><circle cx="94" cy="308" r="9" fill="#66BB6A"></circle></g>
  <g><rect x="302" y="316" width="3" height="9" fill="#5E3F22"></rect><circle cx="300" cy="314" r="9" fill="#2E7D32"></circle><circle cx="308" cy="316" r="8" fill="#43A047"></circle><circle cx="304" cy="308" r="9" fill="#66BB6A"></circle></g>
  <g><rect x="132" y="317" width="3" height="8" fill="#5E3F22"></rect><circle cx="130" cy="315" r="7" fill="#2E7D32"></circle><circle cx="136" cy="316" r="7" fill="#4CAF50"></circle></g>
  <g><rect x="288" y="317" width="3" height="8" fill="#5E3F22"></rect><circle cx="286" cy="315" r="7" fill="#2E7D32"></circle><circle cx="292" cy="316" r="7" fill="#4CAF50"></circle></g>

  <path d="M182 320 L220 320 L356 500 L46 500 Z" fill="#2A4576"></path>
  <path d="M188 320 L214 320 L344 500 L58 500 Z" fill="url(#roadGrad)"></path>
  <path d="M188 320 L58 500" stroke="#FFFFFF" stroke-width="2.5" opacity="0.85"></path>
  <path d="M214 320 L344 500" stroke="#FFFFFF" stroke-width="2.5" opacity="0.85"></path>
  <g fill="#FFFFFF" opacity="0.5"><rect x="199.5" y="334" width="3" height="9" rx="1"></rect><rect x="199" y="356" width="4" height="12" rx="1"></rect></g>

  <g><rect x="36" y="432" width="9" height="32" rx="2" fill="#5E3F22"></rect><circle cx="22" cy="436" r="16" fill="#2E7D32"></circle><circle cx="52" cy="436" r="16" fill="#43A047"></circle><circle cx="31" cy="420" r="16" fill="#43A047"></circle><circle cx="46" cy="422" r="15" fill="#66BB6A"></circle><circle cx="38" cy="428" r="20" fill="#3C9A40"></circle></g>
  <g><rect x="9" y="440" width="6" height="24" rx="2" fill="#5E3F22"></rect><circle cx="4" cy="438" r="12" fill="#2E7D32"></circle><circle cx="15" cy="434" r="13" fill="#4CAF50"></circle><circle cx="9" cy="428" r="11" fill="#66BB6A"></circle></g>
  <g><rect x="358" y="432" width="9" height="32" rx="2" fill="#5E3F22"></rect><circle cx="344" cy="436" r="16" fill="#2E7D32"></circle><circle cx="374" cy="436" r="16" fill="#43A047"></circle><circle cx="353" cy="420" r="16" fill="#43A047"></circle><circle cx="368" cy="422" r="15" fill="#66BB6A"></circle><circle cx="360" cy="428" r="20" fill="#3C9A40"></circle></g>
  <g><rect x="388" y="440" width="6" height="24" rx="2" fill="#5E3F22"></rect><circle cx="398" cy="438" r="12" fill="#2E7D32"></circle><circle cx="387" cy="434" r="13" fill="#4CAF50"></circle><circle cx="393" cy="428" r="11" fill="#66BB6A"></circle></g>

  <g>
    <ellipse cx="201" cy="430" rx="46" ry="7" fill="#0A162D" opacity="0.30"></ellipse>
    <rect x="177" y="368" width="48" height="19" rx="9" fill="#EEF1F6"></rect>
    <path d="M179 385 L223 385 L232 400 L170 400 Z" fill="#16294F"></path>
    <path d="M183 387 L210 387 L205 397 L180 397 Z" fill="#2E5AA0" opacity="0.6"></path>
    <rect x="159" y="392" width="84" height="38" rx="15" fill="url(#carBody)"></rect>
    <rect x="162" y="394" width="78" height="4" rx="2" fill="#FFFFFF" opacity="0.6"></rect>
    <rect x="182" y="411" width="38" height="8" rx="3" fill="#16294F"></rect>
    <rect x="196" y="414" width="10" height="2.4" rx="1" fill="#FFC107"></rect>
    <rect x="164" y="400" width="19" height="10" rx="4" fill="#FFF3C4" stroke="#FFC107" stroke-width="1"></rect>
    <rect x="219" y="400" width="19" height="10" rx="4" fill="#FFF3C4" stroke="#FFC107" stroke-width="1"></rect>
    <rect x="159" y="420" width="84" height="10" rx="4" fill="#C9D1DD"></rect>
    <rect x="173" y="422" width="8" height="4" rx="2" fill="#E8EDF4"></rect>
    <rect x="221" y="422" width="8" height="4" rx="2" fill="#E8EDF4"></rect>
    <rect x="163" y="424" width="16" height="12" rx="3" fill="#0D1B3D"></rect>
    <rect x="223" y="424" width="16" height="12" rx="3" fill="#0D1B3D"></rect>
  </g>
</svg>`;

/** Màn 1 — Splash / Onboarding. Tự chuyển sang Đăng nhập hoặc chạm để tiếp tục. */
export default function SplashOnboarding() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const sceneH = (width * ART_H) / ART_W;
  // `stay=1` khi người dùng bấm nút quay lại từ màn đăng nhập → ở lại hero, không tự chuyển.
  const { stay } = useLocalSearchParams<{ stay?: string }>();

  useEffect(() => {
    if (stay) return;
    const timer = setTimeout(() => router.replace('/login'), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [stay]);

  return (
    <Pressable style={styles.screen} onPress={() => router.replace('/login')}>
      <StatusBar style="dark" />

      {/* Logo thương hiệu + headline */}
      <View style={[styles.top, { paddingTop: insets.top + SCREEN_TOP_GAP }]}>
        <Image source={Images.logo} style={styles.logo} contentFit="contain" />
        <Text style={styles.headline}>
          Kết nối thông minh{'\n'}Di chuyển thuận tiện
        </Text>
      </View>

      {/* Minh hoạ skyline + đường + ô tô (SVG) */}
      <View style={[styles.scene, { height: sceneH }]} pointerEvents="none">
        <SvgXml xml={SKYLINE_XML} width={width} height={sceneH} />
      </View>

      {/* Page indicator */}
      <View style={[styles.dots, { bottom: insets.bottom + Spacing.lg }]}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </Pressable>
  );
}

const SCREEN_TOP_GAP = 48;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.white, alignItems: 'center' },
  top: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
  logo: { width: 240, height: 150 },
  headline: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.navy,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
  scene: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%' },
  dots: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.32)' },
  dotActive: {
    width: 11,
    height: 11,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
});
