import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { TextField } from '@/components/text-field';
import { Fonts, Images, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';

/** Màn 2 — Đăng nhập / Đăng ký. */
export default function LoginScreen() {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Demo: bỏ qua validate thật, vào thẳng trang chủ.
  const handleLogin = () => router.replace('/home');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Logo thương hiệu */}
          <View style={styles.hero}>
            <Image source={Images.logo} style={styles.logo} contentFit="contain" />
          </View>

          <Text style={styles.title}>Chào mừng bạn đến với DSCITY 👋</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          <View style={styles.form}>
            <TextField
              label="Số điện thoại"
              placeholder="0123 456 789"
              keyboardType="phone-pad"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
            />
            <TextField
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              secureTextEntry
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
            />

            <Pressable style={styles.forgot} hitSlop={8}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Pressable>

            <AppButton title="Đăng nhập" onPress={handleLogin} />

            {/* Divider "hoặc" */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.line} />
            </View>

            <AppButton
              title="Đăng nhập với Google"
              variant="social"
              icon="logo-google"
              onPress={handleLogin}
            />
            <View style={{ height: Spacing.md }} />
            <AppButton
              title="Đăng nhập với Apple"
              variant="social"
              icon="logo-apple"
              onPress={handleLogin}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <Pressable hitSlop={8}>
              <Text style={styles.footerLink}>Đăng ký ngay</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['2xl'], flexGrow: 1 },
  hero: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.lg },
  logo: { width: 200, height: 154 },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.xs },
  form: { marginTop: Spacing['2xl'], gap: Spacing.lg },
  forgot: { alignSelf: 'flex-end', marginTop: -Spacing.xs },
  forgotText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.green },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xs },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: Spacing['2xl'] },
  footerText: { ...Typography.body, color: Colors.textMuted },
  footerLink: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.green },
});
