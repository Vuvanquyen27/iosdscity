import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { TextField } from '@/components/text-field';
import { Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/use-theme';
import { useUser } from '@/hooks/use-user';
import { useLanguage } from '@/i18n';

/** Trang con — Chỉnh sửa hồ sơ (tên, số điện thoại, email). */
export default function ProfileScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useLanguage();
  const { user, update } = useUser();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);

  const canSave = name.trim().length > 0;

  const onSave = () => {
    if (!canSave) return;
    update({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t('set.editProfile')} onBack={() => router.back()} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.hint}>{t('profile.hint')}</Text>
          <View style={styles.form}>
            <TextField
              label={t('common.fullName')}
              icon="person-outline"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
            <TextField
              label={t('common.phone')}
              icon="call-outline"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextField
              label={t('common.email')}
              icon="mail-outline"
              keyboardType="email-address"
              placeholder="email@dscity.vn"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <AppButton
            title={t('common.save')}
            icon="checkmark-circle-outline"
            onPress={onSave}
            disabled={!canSave}
            style={styles.save}
          />
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
    hint: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.xl },
    form: { gap: Spacing.lg },
    save: { marginTop: Spacing['2xl'] },
  });
