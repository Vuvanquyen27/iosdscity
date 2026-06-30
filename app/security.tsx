import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { TextField } from '@/components/text-field';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';

/** Trang con — Bảo mật & mật khẩu (đổi mật khẩu + sinh trắc học). */
export default function SecurityScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t } = useLanguage();
  const { prefs, setPref } = usePreferences();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = current.length > 0 && next.length > 0 && confirm.length > 0;

  const edit = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setError('');
    setDone(false);
  };

  const submit = () => {
    if (next.length < 6) {
      setError(t('sec.tooShort'));
      return;
    }
    if (next !== confirm) {
      setError(t('sec.mismatch'));
      return;
    }
    setError('');
    setCurrent('');
    setNext('');
    setConfirm('');
    setDone(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t('set.security')} onBack={() => router.back()} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <TextField
              label={t('sec.current')}
              icon="lock-closed-outline"
              secureTextEntry
              value={current}
              onChangeText={edit(setCurrent)}
            />
            <TextField
              label={t('sec.new')}
              icon="key-outline"
              secureTextEntry
              value={next}
              onChangeText={edit(setNext)}
            />
            <TextField
              label={t('sec.confirm')}
              icon="key-outline"
              secureTextEntry
              value={confirm}
              onChangeText={edit(setConfirm)}
            />
          </View>

          {error ? (
            <View style={[styles.notice, styles.noticeError]}>
              <Ionicons name="alert-circle" size={18} color={Colors.danger} />
              <Text style={[styles.noticeText, { color: Colors.danger }]}>{error}</Text>
            </View>
          ) : null}
          {done ? (
            <View style={[styles.notice, styles.noticeOk]}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={[styles.noticeText, { color: Colors.success }]}>{t('sec.changed')}</Text>
            </View>
          ) : null}

          <AppButton
            title={t('sec.change')}
            icon="shield-checkmark-outline"
            onPress={submit}
            disabled={!canSubmit}
            style={styles.submit}
          />

          <View style={styles.bioCard}>
            <View style={styles.bioIcon}>
              <Ionicons name="finger-print-outline" size={20} color={Colors.green} />
            </View>
            <Text style={styles.bioLabel}>{t('sec.biometric')}</Text>
            <Switch
              value={prefs.biometric}
              onValueChange={(v) => setPref('biometric', v)}
              trackColor={{ false: Colors.border, true: Colors.green }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.border}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    headerWrap: { paddingHorizontal: Spacing.xl },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing['3xl'],
    },
    form: { gap: Spacing.lg },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      marginTop: Spacing.lg,
    },
    noticeError: { backgroundColor: Colors.surface },
    noticeOk: { backgroundColor: Colors.greenSoft },
    noticeText: { ...Typography.bodyMed, fontFamily: Fonts.medium, flex: 1 },
    submit: { marginTop: Spacing.xl },
    bioCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginTop: Spacing['2xl'],
      ...Shadow.card,
    },
    bioIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bioLabel: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },
  });
