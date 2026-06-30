import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { TextField } from '@/components/text-field';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type Lang } from '@/i18n';

/** Trang con — Chọn ngôn ngữ (có tìm kiếm, danh sách đầy đủ). */
export default function LanguageScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t, lang, setLang, languages, loading } = useLanguage();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (l) =>
        l.native.toLowerCase().includes(q) ||
        l.label.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [languages, query]);

  const select = (code: Lang) => {
    setLang(code);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t('lang.title')} onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <TextField
            icon="search-outline"
            placeholder={t('lang.search')}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <View style={styles.card}>
          {list.map((l, i) => {
            const selected = lang === l.code;
            return (
              <View key={l.code}>
                {i > 0 ? <View style={styles.separator} /> : null}
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => select(l.code)}>
                  <Text style={styles.flag}>{l.flag}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.native}>{l.native}</Text>
                    <Text style={styles.sub}>{l.label}</Text>
                  </View>
                  {selected && loading ? (
                    <ActivityIndicator size="small" color={Colors.green} />
                  ) : (
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={selected ? Colors.green : Colors.textMuted}
                    />
                  )}
                </Pressable>
              </View>
            );
          })}
          {list.length === 0 ? <Text style={styles.empty}>{t('lang.empty')}</Text> : null}
        </View>
      </ScrollView>
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
    searchWrap: { marginBottom: Spacing.lg },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      ...Shadow.card,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 60 },
    rowPressed: { opacity: 0.6 },
    flag: { fontSize: 24 },
    native: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium },
    sub: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
    separator: { height: 1, backgroundColor: Colors.border },
    empty: {
      ...Typography.body,
      color: Colors.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },
  });
