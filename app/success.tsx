import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import { AppButton } from '@/components/app-button';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';

/** Màn 9 — Thanh toán / Xác nhận thành công. */
export default function SuccessScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();

  const params = useLocalSearchParams<{
    code?: string;
    title?: string;
    subtitle?: string;
    showQr?: string;
  }>();
  const code = params.code ?? 'PARK-240512-8X7A';
  const title = params.title ?? 'Đặt chỗ thành công!';
  const subtitle = params.subtitle ?? 'Vui lòng xuất trình mã QR tại bãi xe';
  const showQr = params.showQr !== '0';

  // Hiệu ứng bung nhẹ cho dấu tick.
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        <Animated.View style={[styles.tickCircle, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={56} color={Colors.white} />
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Mã QR thật sinh từ chuỗi mã đặt chỗ (ẩn với các luồng không cần QR, ví dụ nạp tiền).
            QR luôn giữ navy trên nền trắng để quét được ở cả chế độ tối. */}
        {showQr ? (
          <>
            <View style={styles.qrCard}>
              <QRCode value={code} size={180} color={Colors.navy} backgroundColor={Colors.white} />
            </View>

            <Pressable hitSlop={8} style={styles.detailLink}>
              <Text style={styles.detailLinkText}>Xem chi tiết đặt chỗ</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.green} />
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <AppButton title="Về trang chủ" variant="dark" onPress={() => router.dismissAll()} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing['2xl'],
    },
    tickCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: Colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing['2xl'],
      ...Shadow.card,
    },
    title: { ...Typography.h1, color: Colors.text, textAlign: 'center' },
    code: {
      fontFamily: Fonts.bold,
      fontSize: 22,
      color: Colors.green,
      letterSpacing: 1,
      marginTop: Spacing.md,
    },
    subtitle: {
      ...Typography.body,
      color: Colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
    // Nền trắng cố định để QR luôn quét được, kể cả chế độ tối.
    qrCard: {
      backgroundColor: Colors.white,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      marginTop: Spacing['2xl'],
      ...Shadow.card,
    },
    detailLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xl },
    detailLinkText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.green },
    footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  });
