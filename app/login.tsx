import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
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
import { AppleIcon, GoogleIcon } from '@/components/brand-icons';
import { TextField } from '@/components/text-field';
import { Fonts, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles, useThemeColors } from '@/hooks/use-theme';
import { signInWithPhone } from '@/services/auth';

/** Chuẩn hoá SĐT VN về E.164 (+84…) — Supabase Auth bắt buộc định dạng này. */
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return '+84' + digits.slice(1);
  if (digits.startsWith('84')) return '+' + digits;
  return '+84' + digits;
}

/** Màn 2 — Đăng nhập / Đăng ký. */
export default function LoginScreen() {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Đăng nhập thật bằng SĐT + mật khẩu (Supabase Auth).
  async function handleLogin() {
    if (!phone.trim() || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại và mật khẩu.');
      return;
    }
    setLoading(true);
    try {
      await signInWithPhone(toE164(phone), password);
      router.replace('/home');
    } catch (e) {
      Alert.alert(
        'Đăng nhập thất bại',
        e instanceof Error ? e.message : 'Sai số điện thoại hoặc mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  }

  // OAuth Google/Apple chưa cấu hình → tạm vào thẳng (demo).
  const handleSocialDemo = () => router.replace('/home');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Quay lại màn Splash / Onboarding (hero) */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace({ pathname: '/', params: { stay: '1' } })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Chào mừng bạn đến với DSCITY 👋</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          <View style={styles.form}>
            <TextField
              label="Số điện thoại"
              placeholder="0123 456 789"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextField
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable style={styles.forgot} hitSlop={8}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </Pressable>

            <AppButton
              title="Đăng nhập"
              variant="dark"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            />

            {/* Divider "hoặc" */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.line} />
            </View>

            <AppButton
              title="Đăng nhập với Google"
              variant="social"
              iconNode={<GoogleIcon size={20} />}
              onPress={handleSocialDemo}
            />
            <View style={{ height: Spacing.md }} />
            <AppButton
              title="Đăng nhập với Apple"
              variant="social"
              iconNode={<AppleIcon size={20} color={colors.text} />}
              onPress={handleSocialDemo}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <Pressable hitSlop={8} onPress={() => router.push('/register')}>
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
  header: { paddingHorizontal: Spacing.lg, height: 44, justifyContent: 'center' },
  backBtn: { alignSelf: 'flex-start', padding: Spacing.xs },
  title: { ...Typography.h1, fontSize: 26, lineHeight: 34, color: Colors.text, marginTop: Spacing.lg },
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
