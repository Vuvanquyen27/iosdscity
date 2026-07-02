import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { Colors, Fonts, Images, Spacing } from '@/constants/theme';

const AUTO_ADVANCE_MS = 2500;

// Tỉ lệ gốc của hình minh hoạ (canvas thiết kế 402×500).
const ART_W = 402;
const ART_H = 500;

/**
 * Minh hoạ hero (design_handoff_dscity_splash/reference.html):
 * skyline 3 lớp (bóng mờ → xanh nhạt → royal/navy) + icon smart-city (wifi / kính lúp /
 * ghim định vị) + hàng cây hai bên đổ dần về đường chân trời + dải đường xanh phối cảnh +
 * ô tô SUV chạy về phía người xem (đèn pha hổ phách + quầng sáng).
 * viewBox 402×500, neo đáy giữa để luôn dính mép dưới màn hình.
 */
const SKYLINE_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 402 500" preserveAspectRatio="xMidYMax slice">
  <defs>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33549B"/><stop offset="0.5" stop-color="#27437F"/><stop offset="1" stop-color="#1D3468"/></linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DCE9F8" stop-opacity="0"/><stop offset="1" stop-color="#CFE0F5"/></linearGradient>
    <radialGradient id="beam" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="0.5" stop-color="#EAF3FF" stop-opacity="0.5"/><stop offset="1" stop-color="#EAF3FF" stop-opacity="0"/></radialGradient>
    <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D4DCE9"/></linearGradient>
    <pattern id="wGhost" width="10" height="13" patternUnits="userSpaceOnUse"><rect width="10" height="13" fill="#DCE6F4"/><rect x="2.4" y="3" width="3.6" height="5.4" rx="0.5" fill="#FFFFFF" opacity="0.8"/></pattern>
    <pattern id="wMidB" width="9" height="12" patternUnits="userSpaceOnUse"><rect width="9" height="12" fill="#8FACD9"/><rect x="2" y="2.6" width="3.4" height="5" rx="0.4" fill="#E6EFFB" opacity="0.9"/></pattern>
    <pattern id="wRoyal" width="9" height="12" patternUnits="userSpaceOnUse"><rect width="9" height="12" fill="#2F55A4"/><rect x="2" y="2.6" width="3.4" height="5" rx="0.4" fill="#BCD3F2" opacity="0.9"/></pattern>
    <pattern id="wRoyal2" width="9" height="12" patternUnits="userSpaceOnUse"><rect width="9" height="12" fill="#3E66B8"/><rect x="2" y="2.6" width="3.4" height="5" rx="0.4" fill="#D4E4F9" opacity="0.9"/></pattern>
    <pattern id="wNavyD" width="9" height="12" patternUnits="userSpaceOnUse"><rect width="9" height="12" fill="#1B3364"/><rect x="2" y="2.6" width="3.4" height="5" rx="0.4" fill="#6E96D2" opacity="0.9"/></pattern>
    <pattern id="wNavyD2" width="9" height="12" patternUnits="userSpaceOnUse"><rect width="9" height="12" fill="#24407A"/><rect x="2" y="2.6" width="3.4" height="5" rx="0.4" fill="#8AB0E4" opacity="0.9"/></pattern>
  </defs>

  <rect x="0" y="0" width="402" height="345" fill="#FFFFFF"/>

  <g fill="url(#wGhost)">
    <rect x="-4" y="118" width="20" height="227"/>
    <rect x="22" y="76" width="16" height="269"/>
    <rect x="44" y="132" width="18" height="213"/>
    <rect x="70" y="60" width="17" height="285"/>
    <rect x="94" y="120" width="16" height="225"/>
    <rect x="118" y="88" width="15" height="257"/>
    <rect x="140" y="52" width="18" height="293"/>
    <rect x="166" y="112" width="15" height="233"/>
    <rect x="190" y="42" width="17" height="303"/>
    <rect x="214" y="96" width="15" height="249"/>
    <rect x="238" y="66" width="17" height="279"/>
    <rect x="262" y="122" width="16" height="223"/>
    <rect x="288" y="84" width="16" height="261"/>
    <rect x="312" y="126" width="16" height="219"/>
    <rect x="338" y="72" width="17" height="273"/>
    <rect x="362" y="110" width="16" height="235"/>
    <rect x="384" y="90" width="20" height="255"/>
  </g>
  <g fill="#DCE6F4">
    <path d="M140 52 L149 32 L158 52 Z"/>
    <path d="M190 42 L198.5 22 L207 42 Z"/>
    <path d="M338 72 L346.5 54 L355 72 Z"/>
  </g>

  <g stroke="#B9CDE9" stroke-width="2.4" fill="none" opacity="0.95" stroke-linecap="round">
    <path d="M52 96 Q63 83 74 96"/><path d="M56.5 101 Q63 94 69.5 101"/>
    <path d="M330 44 Q341 31 352 44"/><path d="M334.5 49 Q341 42 347.5 49"/>
    <path d="M172 84 Q181 74 190 84"/><path d="M175.5 88.5 Q181 82.5 186.5 88.5"/>
    <circle cx="300" cy="96" r="8"/><line x1="306" y1="102" x2="312" y2="108"/>
  </g>
  <circle cx="63" cy="105" r="1.8" fill="#B9CDE9"/>
  <circle cx="341" cy="53" r="1.8" fill="#B9CDE9"/>
  <circle cx="181" cy="92.5" r="1.6" fill="#B9CDE9"/>
  <g opacity="0.95"><path d="M118 60 C118 53.5 112.8 49 107.5 49 C102.2 49 97 53.5 97 60 C97 67.5 107.5 79 107.5 79 C107.5 79 118 67.5 118 60 Z" fill="none" stroke="#B9CDE9" stroke-width="2.4"/><circle cx="107.5" cy="60" r="3.2" fill="none" stroke="#B9CDE9" stroke-width="2.4"/></g>

  <g>
    <rect x="0" y="176" width="24" height="169" fill="url(#wMidB)"/>
    <rect x="34" y="152" width="22" height="193" fill="url(#wMidB)"/>
    <rect x="64" y="188" width="24" height="157" fill="url(#wMidB)"/>
    <rect x="112" y="160" width="22" height="185" fill="url(#wMidB)"/>
    <rect x="160" y="176" width="24" height="169" fill="url(#wMidB)"/>
    <rect x="218" y="152" width="22" height="193" fill="url(#wMidB)"/>
    <rect x="266" y="182" width="24" height="163" fill="url(#wMidB)"/>
    <rect x="316" y="158" width="22" height="187" fill="url(#wMidB)"/>
    <rect x="356" y="180" width="24" height="165" fill="url(#wMidB)"/>
    <path d="M45 152 L45 134 M45 134 L45 132" stroke="#8FACD9" stroke-width="2.2"/>
    <circle cx="45" cy="130" r="2.2" fill="#FFC107"/>
    <path d="M229 152 L229 136" stroke="#8FACD9" stroke-width="2.2"/>
    <circle cx="229" cy="134" r="2.2" fill="#FFC107"/>
  </g>

  <g>
    <rect x="-4" y="210" width="30" height="135" fill="url(#wNavyD)"/>
    <rect x="30" y="192" width="26" height="153" fill="url(#wRoyal)"/>
    <rect x="60" y="222" width="24" height="123" fill="url(#wNavyD2)"/>
    <rect x="88" y="180" width="28" height="165" fill="url(#wNavyD)"/>
    <path d="M88 180 L102 158 L116 180 Z" fill="#1B3364"/>
    <rect x="120" y="214" width="24" height="131" fill="url(#wRoyal2)"/>
    <rect x="148" y="190" width="26" height="155" fill="url(#wRoyal)"/>
    <line x1="161" y1="190" x2="161" y2="170" stroke="#2F55A4" stroke-width="2.4"/>
    <circle cx="161" cy="168" r="2.4" fill="#FFC107"/>
    <rect x="178" y="222" width="22" height="123" fill="url(#wNavyD2)"/>
    <rect x="204" y="186" width="26" height="159" fill="url(#wNavyD)"/>
    <rect x="234" y="214" width="22" height="131" fill="url(#wRoyal2)"/>
    <rect x="260" y="196" width="26" height="149" fill="url(#wRoyal)"/>
    <path d="M260 196 L273 176 L286 196 Z" fill="#2F55A4"/>
    <rect x="290" y="224" width="22" height="121" fill="url(#wNavyD2)"/>
    <rect x="316" y="184" width="28" height="161" fill="url(#wNavyD)"/>
    <line x1="330" y1="184" x2="330" y2="164" stroke="#1B3364" stroke-width="2.4"/>
    <circle cx="330" cy="162" r="2.4" fill="#FFC107"/>
    <rect x="348" y="212" width="24" height="133" fill="url(#wRoyal)"/>
    <rect x="376" y="194" width="30" height="151" fill="url(#wNavyD2)"/>
  </g>

  <rect x="0" y="300" width="402" height="45" fill="url(#haze)"/>

  <rect x="0" y="340" width="402" height="160" fill="url(#road)"/>
  <path d="M162 340 L240 340 L494 500 L-92 500 Z" fill="url(#road)"/>
  <path d="M170 342 L-60 500" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.95"/>
  <path d="M232 342 L462 500" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" opacity="0.95"/>
  <g fill="#FFFFFF" opacity="0.8">
    <rect x="199.2" y="414" width="4.2" height="13" rx="1.8"/>
  </g>

  <g>
    <circle cx="14" cy="322" r="17" fill="#5FAE63"/>
    <circle cx="30" cy="314" r="19" fill="#3C9A40"/>
    <circle cx="48" cy="322" r="15" fill="#66BB6A"/>
    <rect x="27" y="326" width="7" height="22" rx="2.4" fill="#5E3F22"/>
    <circle cx="66" cy="330" r="13" fill="#2E7D32"/>
    <circle cx="80" cy="334" r="11" fill="#4CAF50"/>
    <rect x="70" y="340" width="6" height="16" rx="2" fill="#5E3F22"/>
    <circle cx="98" cy="338" r="10" fill="#7CC47F"/>
    <circle cx="110" cy="342" r="8" fill="#9CCC65"/>
    <circle cx="121" cy="345" r="6.5" fill="#56B45A"/>
    <circle cx="131" cy="348" r="5" fill="#7CC47F"/>
  </g>
  <g>
    <circle cx="388" cy="322" r="17" fill="#5FAE63"/>
    <circle cx="372" cy="314" r="19" fill="#3C9A40"/>
    <circle cx="354" cy="322" r="15" fill="#66BB6A"/>
    <rect x="368" y="326" width="7" height="22" rx="2.4" fill="#5E3F22"/>
    <circle cx="336" cy="330" r="13" fill="#2E7D32"/>
    <circle cx="322" cy="334" r="11" fill="#4CAF50"/>
    <rect x="326" y="340" width="6" height="16" rx="2" fill="#5E3F22"/>
    <circle cx="304" cy="338" r="10" fill="#9CCC65"/>
    <circle cx="292" cy="342" r="8" fill="#7CC47F"/>
    <circle cx="281" cy="345" r="6.5" fill="#56B45A"/>
    <circle cx="271" cy="348" r="5" fill="#7CC47F"/>
    <circle cx="311" cy="346" r="2.4" fill="#FF9800"/>
    <circle cx="299" cy="349" r="2" fill="#FFC107"/>
  </g>

  <g>
    <ellipse cx="201" cy="415" rx="52" ry="8" fill="#0A162D" opacity="0.4"/>
    <ellipse cx="168" cy="398" rx="26" ry="13" fill="url(#beam)"/>
    <ellipse cx="234" cy="398" rx="26" ry="13" fill="url(#beam)"/>
    <rect x="172" y="330" width="58" height="20" rx="9" fill="#F4F7FB"/>
    <path d="M173 344 L229 344 L240 362 L162 362 Z" fill="#152C58"/>
    <path d="M178 346 L206 346 L201 360 L175 360 Z" fill="#3E66B8" opacity="0.6"/>
    <rect x="152" y="356" width="98" height="42" rx="15" fill="url(#carBody)"/>
    <rect x="157" y="359" width="88" height="4" rx="2" fill="#FFFFFF" opacity="0.7"/>
    <rect x="144" y="362" width="12" height="9" rx="4" fill="#EDF1F7"/>
    <rect x="246" y="362" width="12" height="9" rx="4" fill="#EDF1F7"/>
    <rect x="179" y="378" width="44" height="10" rx="4" fill="#152C58"/>
    <rect x="194" y="381" width="14" height="3.4" rx="1.4" fill="#FFC107"/>
    <rect x="158" y="368" width="23" height="12" rx="5" fill="#FFFDF2" stroke="#FFE082" stroke-width="1.4"/>
    <rect x="221" y="368" width="23" height="12" rx="5" fill="#FFFDF2" stroke="#FFE082" stroke-width="1.4"/>
    <rect x="152" y="388" width="98" height="12" rx="5" fill="#C5CEDC"/>
    <rect x="168" y="391" width="10" height="5" rx="2.4" fill="#EAEFF6"/>
    <rect x="224" y="391" width="10" height="5" rx="2.4" fill="#EAEFF6"/>
    <rect x="156" y="394" width="19" height="14" rx="4" fill="#0D1B3D"/>
    <rect x="227" y="394" width="19" height="14" rx="4" fill="#0D1B3D"/>
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

      {/* Logo thương hiệu (mark trên + wordmark dưới) + tagline */}
      <View style={[styles.top, { paddingTop: insets.top + SCREEN_TOP_GAP }]}>
        <View style={styles.logoBlock}>
          <Image source={Images.logoMark} style={styles.logoMark} contentFit="contain" />
          <Image source={Images.wordmark} style={styles.wordmark} contentFit="contain" />
        </View>
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
  logoBlock: { alignItems: 'center', gap: 10 },
  logoMark: { width: 132, height: 132 },
  wordmark: { width: 238, height: 94 },
  headline: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 34,
    color: Colors.royal,
    textAlign: 'center',
    marginTop: 26,
  },
  scene: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%' },
  dots: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.38)' },
  dotActive: {
    width: 12,
    height: 12,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
});
