import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Fonts, Images, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useHelpContent } from '@/hooks/use-help-content';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type UiKey } from '@/i18n';

type Topic = 'help' | 'terms' | 'privacy' | 'about';

const TITLE_KEY: Record<Topic, UiKey> = {
  help: 'set.help',
  terms: 'set.terms',
  privacy: 'set.privacy',
  about: 'set.about',
};

/** Trang con — Trợ giúp / Điều khoản / Bảo mật / Giới thiệu (song ngữ). */
export default function InfoScreen() {
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, lang } = useLanguage();
  const params = useLocalSearchParams<{ topic: string }>();
  const topic: Topic = (['help', 'terms', 'privacy', 'about'] as const).includes(
    params.topic as Topic
  )
    ? (params.topic as Topic)
    : 'help';
  const content = useHelpContent(lang);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t(TITLE_KEY[topic])} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {topic === 'help' ? (
          <>
            {content.faq.map((item, i) => (
              <View key={i} style={styles.faqItem}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqA}>{item.a}</Text>
              </View>
            ))}
            <ContactRow text={content.contact} />
          </>
        ) : null}

        {topic === 'terms' ? <Paragraphs items={content.terms} /> : null}
        {topic === 'privacy' ? <Paragraphs items={content.privacy} /> : null}

        {topic === 'about' ? (
          <View style={styles.aboutWrap}>
            <Image source={Images.logo} style={styles.aboutLogo} contentFit="contain" />
            <Text style={styles.aboutBody}>{content.about}</Text>
            <Text style={styles.aboutVersion}>{t('set.version')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({ text }: { text: string }) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <View style={styles.contactRow}>
      <Ionicons name="headset-outline" size={18} color={Colors.green} />
      <Text style={styles.contactText}>{text}</Text>
    </View>
  );
}

function Paragraphs({ items }: { items: readonly string[] }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <>
      {items.map((p, i) => (
        <Text key={i} style={styles.paragraph}>
          {p}
        </Text>
      ))}
    </>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    headerWrap: { paddingHorizontal: Spacing.xl },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing['3xl'],
    },
    faqItem: { marginBottom: Spacing.lg },
    faqQ: {
      ...Typography.bodyMed,
      color: Colors.text,
      fontFamily: Fonts.semibold,
      marginBottom: Spacing.xs,
    },
    faqA: { ...Typography.body, color: Colors.textMuted, lineHeight: 21 },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    contactText: { ...Typography.body, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },
    paragraph: { ...Typography.body, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.md },
    aboutWrap: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
    aboutLogo: { width: 180, height: 138 },
    aboutBody: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
    aboutVersion: { ...Typography.caption, color: Colors.textMuted, fontFamily: Fonts.medium },
  });
