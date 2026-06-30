import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
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
import { TextField } from '@/components/text-field';
import { Fonts, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles, useThemeColors } from '@/hooks/use-theme';
import { signUpWithPhone } from '@/services/auth';

/** Chuẩn hoá SĐT VN về E.164 (+84…) — Supabase Auth bắt buộc định dạng này. */
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) return '+84' + digits.slice(1);
  if (digits.startsWith('84')) return '+' + digits;
  return '+84' + digits;
}

/** SĐT di động VN hợp lệ: sau chuẩn hoá là +84 + 9 chữ số. */
function isValidPhone(raw: string): boolean {
  return /^\+84\d{9}$/.test(toE164(raw));
}

/** Quy tắc mật khẩu — trả về trạng thái từng điều kiện để hiện checklist. */
function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    digit: /\d/.test(pw),
  };
}
const isStrongPassword = (pw: string) => Object.values(passwordChecks(pw)).every(Boolean);

/** Ánh xạ lỗi Supabase Auth sang câu tiếng Việt thân thiện (không lộ chi tiết kỹ thuật). */
function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('already') || m.includes('exists') || m.includes('registered'))
    return 'Số điện thoại này đã được đăng ký. Hãy đăng nhập.';
  if (m.includes('password')) return 'Mật khẩu chưa đạt yêu cầu. Vui lòng chọn mật khẩu khác.';
  if (m.includes('phone')) return 'Số điện thoại không hợp lệ.';
  if (m.includes('signups') || m.includes('disabled'))
    return 'Đăng ký đang tạm khoá. Vui lòng liên hệ quản trị.';
  if (m.includes('rate') || m.includes('too many'))
    return 'Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.';
  if (m.includes('network') || m.includes('fetch') || m.includes('timeout'))
    return 'Mất kết nối mạng. Vui lòng thử lại.';
  return 'Đăng ký thất bại. Vui lòng thử lại sau.';
}

/** Màn — Đăng ký tài khoản (họ tên + SĐT + mật khẩu). */
export default function RegisterScreen() {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // chỉ hiện lỗi sau khi bấm Đăng ký

  const checks = passwordChecks(password);

  // Lỗi từng trường (chỉ hiện sau lần bấm đầu để không "la" người dùng quá sớm).
  const nameErr = submitted && name.trim().length < 2 ? 'Vui lòng nhập họ tên (tối thiểu 2 ký tự).' : '';
  const phoneErr = submitted && !isValidPhone(phone) ? 'Số điện thoại không hợp lệ (vd: 0912 345 678).' : '';
  const passwordErr = submitted && !isStrongPassword(password) ? 'Mật khẩu chưa đạt yêu cầu bên dưới.' : '';
  const confirmErr = submitted && confirm !== password ? 'Mật khẩu nhập lại không khớp.' : '';

  async function handleRegister() {
    setSubmitted(true);
    if (
      name.trim().length < 2 ||
      !isValidPhone(phone) ||
      !isStrongPassword(password) ||
      confirm !== password
    ) {
      return; // lỗi đã hiện inline, không gọi API
    }
    setLoading(true);
    try {
      await signUpWithPhone(toE164(phone), password, name.trim());
      // phone_autoconfirm bật → có session ngay, vào thẳng trang chủ.
      router.replace('/home');
    } catch (e) {
      Alert.alert('Đăng ký thất bại', friendlyError(e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace('/login')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quay lại đăng nhập">
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
          <Text style={styles.title}>Tạo tài khoản DSCITY</Text>
          <Text style={styles.subtitle}>Đăng ký để bắt đầu sử dụng</Text>

          <View style={styles.form}>
            <Field error={nameErr}>
              <TextField
                label="Họ tên"
                placeholder="Nguyễn Văn A"
                icon="person-outline"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </Field>

            <Field error={phoneErr}>
              <TextField
                label="Số điện thoại"
                placeholder="0123 456 789"
                icon="call-outline"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </Field>

            <Field error={passwordErr}>
              <TextField
                label="Mật khẩu"
                placeholder="Tối thiểu 8 ký tự"
                icon="lock-closed-outline"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Field>

            {/* Checklist yêu cầu mật khẩu — hiện ngay khi bắt đầu gõ. */}
            {password.length > 0 ? (
              <View style={styles.rules}>
                <Rule ok={checks.length} text="Ít nhất 8 ký tự" />
                <Rule ok={checks.letter} text="Có chữ cái" />
                <Rule ok={checks.digit} text="Có chữ số" />
              </View>
            ) : null}

            <Field error={confirmErr}>
              <TextField
                label="Nhập lại mật khẩu"
                placeholder="Nhập lại mật khẩu"
                icon="lock-closed-outline"
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
            </Field>

            <AppButton
              title="Đăng ký"
              variant="dark"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <Pressable hitSlop={8} onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Đăng nhập</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Bọc một ô nhập + dòng lỗi inline bên dưới (nếu có). */
function Field({ error, children }: { error: string; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/** Một dòng điều kiện mật khẩu (đạt → xanh, chưa → mờ). */
function Rule({ ok, text }: { ok: boolean; text: string }) {
  const styles = useThemedStyles(makeStyles);
  const colors = useThemeColors();
  return (
    <View style={styles.rule}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={ok ? colors.green : colors.textMuted}
      />
      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{text}</Text>
    </View>
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
  errorText: { fontFamily: Fonts.medium, fontSize: 12.5, color: Colors.danger, marginTop: Spacing.xs, marginLeft: Spacing.xs },
  rules: { gap: 6, marginTop: -Spacing.sm, marginLeft: Spacing.xs },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText: { fontFamily: Fonts.regular, fontSize: 12.5, color: Colors.textMuted },
  ruleTextOk: { color: Colors.green, fontFamily: Fonts.medium },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: Spacing['2xl'] },
  footerText: { ...Typography.body, color: Colors.textMuted },
  footerLink: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.green },
});
