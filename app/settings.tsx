import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { Sheet } from '@/components/sheet';
import { TextField } from '@/components/text-field';
import { LANGUAGE_BY_CODE } from '@/constants/languages';
import { Fonts, Images, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { user } from '@/data/mock';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type Lang } from '@/i18n';
import { translateBatch } from '@/services/translate';

type IconName = keyof typeof Ionicons.glyphMap;
type SheetId = 'profile' | 'payment' | 'security' | 'language' | 'help' | 'terms' | 'privacy' | 'about';

interface Profile {
  name: string;
  phone: string;
  email: string;
}

const PROFILE_KEY = 'dscity:profile';

/** Boolean lưu vào AsyncStorage: đọc khi mở, ghi khi đổi. */
function usePersistedBool(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [val, setVal] = useState(initial);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((s) => {
        if (s === '1' || s === '0') setVal(s === '1');
      })
      .catch(() => {});
  }, [key]);
  const set = useCallback(
    (v: boolean) => {
      setVal(v);
      AsyncStorage.setItem(key, v ? '1' : '0').catch(() => {});
    },
    [key]
  );
  return [val, set];
}

/** Lưu một chuỗi lựa chọn (vd: id thanh toán mặc định) vào AsyncStorage. */
function usePersistedString(key: string, initial: string): [string, (v: string) => void] {
  const [val, setVal] = useState(initial);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((s) => {
        if (s) setVal(s);
      })
      .catch(() => {});
  }, [key]);
  const set = useCallback(
    (v: string) => {
      setVal(v);
      AsyncStorage.setItem(key, v).catch(() => {});
    },
    [key]
  );
  return [val, set];
}

/** Hồ sơ chỉnh sửa được, lưu vào AsyncStorage (ghi đè dữ liệu mock). */
function useProfile(): [Profile, (p: Profile) => void] {
  const [profile, setProfile] = useState<Profile>({ name: user.name, phone: user.phone, email: '' });
  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY)
      .then((s) => {
        if (s) setProfile((prev) => ({ ...prev, ...JSON.parse(s) }));
      })
      .catch(() => {});
  }, []);
  const save = useCallback((p: Profile) => {
    setProfile(p);
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p)).catch(() => {});
  }, []);
  return [profile, save];
}

interface HelpContent {
  faq: { q: string; a: string }[];
  contact: string;
  terms: string[];
  privacy: string[];
  about: string;
}

/**
 * Nội dung gốc (song ngữ) cho các trang trợ giúp / điều khoản / về app.
 * vi/en có sẵn; ngôn ngữ khác dịch online từ bản tiếng Anh (xem useHelpContent).
 */
const CONTENT: Record<'vi' | 'en', HelpContent> = {
  vi: {
    faq: [
      {
        q: 'Làm sao để đặt xe hoặc bãi đỗ?',
        a: 'Chọn dịch vụ ở trang chủ, chọn địa điểm hoặc xe, chọn gói thuê rồi xác nhận. Mã đặt chỗ hiển thị ngay sau khi thanh toán.',
      },
      {
        q: 'Tôi có thể huỷ đơn không?',
        a: 'Bạn được miễn phí huỷ trong vòng 1 giờ sau khi đặt. Tiền cọc sẽ được hoàn lại vào ví DSCITY.',
      },
      {
        q: 'Nạp tiền vào ví bằng cách nào?',
        a: 'Vào tab Tài khoản, mở ví và chọn Nạp tiền. Hỗ trợ thẻ VISA/Mastercard và ví MoMo.',
      },
    ],
    contact: 'Hotline 1900 1234 (8:00–22:00) · support@dscity.vn',
    terms: [
      'Khi sử dụng DSCITY, bạn đồng ý tuân thủ các điều khoản dịch vụ và quy định đặt xe, đỗ xe hiện hành.',
      'Người dùng chịu trách nhiệm cung cấp thông tin chính xác và sử dụng dịch vụ đúng mục đích.',
      'DSCITY có quyền tạm ngưng tài khoản vi phạm quy định hoặc có dấu hiệu gian lận.',
      'Mọi tranh chấp được giải quyết theo pháp luật Việt Nam.',
    ],
    privacy: [
      'Chúng tôi thu thập thông tin cơ bản (tên, số điện thoại, vị trí) để cung cấp dịch vụ đặt xe và đỗ xe.',
      'Dữ liệu của bạn được mã hoá và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý.',
      'Bạn có thể yêu cầu xoá tài khoản và dữ liệu cá nhân bất kỳ lúc nào trong phần Cài đặt.',
    ],
    about:
      'DSCITY là nền tảng di chuyển thông minh: đặt bãi đỗ xe, thuê ô tô và xe máy, đi chung xe — tất cả trong một ứng dụng.',
  },
  en: {
    faq: [
      {
        q: 'How do I book a vehicle or a parking spot?',
        a: 'Pick a service on the home screen, choose a place or vehicle and a plan, then confirm. Your booking code appears right after payment.',
      },
      {
        q: 'Can I cancel a booking?',
        a: 'Cancellation is free within 1 hour of booking. The deposit is refunded to your DSCITY wallet.',
      },
      {
        q: 'How do I top up my wallet?',
        a: 'Open the Account tab, tap the wallet and choose Top up. VISA/Mastercard and MoMo are supported.',
      },
    ],
    contact: 'Hotline 1900 1234 (8:00–22:00) · support@dscity.vn',
    terms: [
      'By using DSCITY you agree to follow the current service terms and the booking and parking rules.',
      'Users are responsible for providing accurate information and using the service as intended.',
      'DSCITY may suspend accounts that break the rules or show signs of fraud.',
      'Any dispute is resolved under the laws of Vietnam.',
    ],
    privacy: [
      'We collect basic information (name, phone number, location) to provide booking and parking services.',
      'Your data is encrypted and is not shared with third parties without your consent.',
      'You can request deletion of your account and personal data at any time in Settings.',
    ],
    about:
      'DSCITY is a smart mobility platform: book parking, rent cars and motorbikes, and share rides — all in one app.',
  },
};

/**
 * Nội dung trợ giúp theo ngôn ngữ hiện tại.
 * vi/en trả ngay; ngôn ngữ khác dịch online từ bản tiếng Anh (giữ tiếng Anh
 * trong lúc chờ, an toàn lỗi mạng — giống cơ chế của i18n).
 */
function useHelpContent(lang: Lang): HelpContent {
  const [content, setContent] = useState<HelpContent>(lang === 'vi' ? CONTENT.vi : CONTENT.en);

  useEffect(() => {
    if (lang === 'vi') {
      setContent(CONTENT.vi);
      return;
    }
    if (lang === 'en') {
      setContent(CONTENT.en);
      return;
    }

    let cancelled = false;
    const base = CONTENT.en;
    setContent(base); // hiển thị tiếng Anh trong lúc dịch
    const strings = [
      base.contact,
      base.about,
      ...base.terms,
      ...base.privacy,
      ...base.faq.flatMap((f) => [f.q, f.a]),
    ];
    translateBatch(strings, lang, 'en')
      .then((map) => {
        if (cancelled) return;
        const tr = (s: string) => map[s] ?? s;
        setContent({
          contact: tr(base.contact),
          about: tr(base.about),
          terms: base.terms.map(tr),
          privacy: base.privacy.map(tr),
          faq: base.faq.map((f) => ({ q: tr(f.q), a: tr(f.a) })),
        });
      })
      .catch(() => {
        /* lỗi mạng -> giữ tiếng Anh */
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return content;
}

/** Màn 11 — Cài đặt. */
export default function SettingsScreen() {
  const { isDark, toggle } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();

  const [sheet, setSheet] = useState<SheetId | null>(null);
  const open = (id: SheetId) => setSheet(id);
  const close = () => setSheet(null);

  const content = useHelpContent(lang);
  const currentLang = LANGUAGE_BY_CODE[lang];

  const [profile, saveProfile] = useProfile();
  const [push, setPush] = usePersistedBool('dscity:notif.push', true);
  const [promo, setPromo] = usePersistedBool('dscity:notif.promo', false);
  const [location, setLocation] = usePersistedBool('dscity:location', true);

  const confirmLogout = () => {
    Alert.alert(t('set.logout.confirmTitle'), t('set.logout.confirmMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('set.logout'), style: 'destructive', onPress: () => router.replace('/login') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title={t('set.title')} onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hồ sơ tóm tắt */}
        <Pressable style={styles.profile} onPress={() => open('profile')}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} contentFit="cover" />
          <View style={styles.flex}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.phone}>{profile.phone}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Tài khoản */}
        <Group title={t('set.group.account')}>
          <Row icon="person-outline" label={t('set.profile')} onPress={() => open('profile')} />
          <Row icon="card-outline" label={t('set.payment')} onPress={() => open('payment')} />
          <Row icon="lock-closed-outline" label={t('set.security')} onPress={() => open('security')} last />
        </Group>

        {/* Thông báo */}
        <Group title={t('set.group.notify')}>
          <Row
            icon="notifications-outline"
            label={t('set.push')}
            right={<Toggle value={push} onValueChange={setPush} />}
          />
          <Row
            icon="mail-outline"
            label={t('set.promo')}
            right={<Toggle value={promo} onValueChange={setPromo} />}
            last
          />
        </Group>

        {/* Ứng dụng */}
        <Group title={t('set.group.app')}>
          <Row
            icon="moon-outline"
            label={t('set.dark')}
            right={<Toggle value={isDark} onValueChange={toggle} />}
          />
          <Row
            icon="navigate-outline"
            label={t('set.location')}
            right={<Toggle value={location} onValueChange={setLocation} />}
          />
          <Row
            icon="language-outline"
            label={t('set.language')}
            value={currentLang ? `${currentLang.flag} ${currentLang.native}` : lang}
            onPress={() => open('language')}
            last
          />
        </Group>

        {/* Hỗ trợ */}
        <Group title={t('set.group.support')}>
          <Row icon="help-circle-outline" label={t('set.help')} onPress={() => open('help')} />
          <Row icon="document-text-outline" label={t('set.terms')} onPress={() => open('terms')} />
          <Row icon="shield-checkmark-outline" label={t('set.privacy')} onPress={() => open('privacy')} />
          <Row
            icon="information-circle-outline"
            label={t('set.about')}
            value={t('set.version')}
            onPress={() => open('about')}
            last
          />
        </Group>

        <AppButton
          title={t('set.logout')}
          variant="outline"
          icon="log-out-outline"
          onPress={confirmLogout}
          style={styles.logout}
        />
      </ScrollView>

      {/* Trang con */}
      <ProfileSheet
        visible={sheet === 'profile'}
        profile={profile}
        onClose={close}
        onSave={(p) => {
          saveProfile(p);
          close();
        }}
      />
      <PaymentSheet visible={sheet === 'payment'} onClose={close} />
      <SecuritySheet visible={sheet === 'security'} onClose={close} />
      <LanguageSheet
        visible={sheet === 'language'}
        current={lang}
        onSelect={(l) => {
          setLang(l);
          close();
        }}
        onClose={close}
      />
      <InfoSheet visible={sheet === 'help'} title={t('set.help')} onClose={close}>
        {content.faq.map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
        <ContactRow text={content.contact} />
      </InfoSheet>
      <InfoSheet visible={sheet === 'terms'} title={t('set.terms')} onClose={close}>
        <Paragraphs items={content.terms} />
      </InfoSheet>
      <InfoSheet visible={sheet === 'privacy'} title={t('set.privacy')} onClose={close}>
        <Paragraphs items={content.privacy} />
      </InfoSheet>
      <AboutSheet visible={sheet === 'about'} onClose={close} body={content.about} />
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------------------
// Trang con (sheet)
// ----------------------------------------------------------------------------

/** Chỉnh sửa hồ sơ: tên, số điện thoại, email. */
function ProfileSheet({
  visible,
  profile,
  onClose,
  onSave,
}: {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onSave: (p: Profile) => void;
}) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);

  // Đồng bộ lại khi mở sheet (hoặc khi hồ sơ nạp xong từ storage).
  useEffect(() => {
    if (visible) {
      setName(profile.name);
      setPhone(profile.phone);
      setEmail(profile.email);
    }
  }, [visible, profile]);

  return (
    <Sheet
      visible={visible}
      title={t('set.editProfile')}
      onClose={onClose}
      footer={<AppButton title={t('common.save')} onPress={() => onSave({ name, phone, email })} />}>
      <Text style={styles.sheetHint}>{t('profile.hint')}</Text>
      <View style={styles.formGap}>
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
    </Sheet>
  );
}

/** Phương thức thanh toán: chọn mặc định + nút thêm mới. */
function PaymentSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const [defaultId, setDefaultId] = usePersistedString('dscity:payment.default', 'visa');

  const methods: { id: string; icon: IconName; label: string }[] = [
    { id: 'visa', icon: 'card-outline', label: 'VISA •••• 4242' },
    { id: 'momo', icon: 'wallet-outline', label: 'MoMo' },
    { id: 'cash', icon: 'cash-outline', label: lang === 'vi' ? 'Tiền mặt' : 'Cash' },
  ];

  return (
    <Sheet visible={visible} title={t('set.payment')} onClose={onClose}>
      <View style={styles.listCard}>
        {methods.map((m, i) => {
          const selected = defaultId === m.id;
          return (
            <Pressable
              key={m.id}
              style={({ pressed }) => [styles.optionRow, pressed && styles.rowPressed]}
              onPress={() => setDefaultId(m.id)}>
              {i > 0 ? <View style={styles.optionSep} /> : null}
              <View style={styles.iconTile}>
                <Ionicons name={m.icon} size={20} color={Colors.green} />
              </View>
              <Text style={styles.optionLabel}>{m.label}</Text>
              {selected ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('pay.default')}</Text>
                </View>
              ) : null}
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? Colors.green : Colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={({ pressed }) => [styles.addRow, pressed && styles.rowPressed]}
        onPress={() => Alert.alert(t('set.payment'), t('pay.added'))}>
        <Ionicons name="add-circle-outline" size={22} color={Colors.green} />
        <Text style={styles.addText}>{t('pay.add')}</Text>
      </Pressable>
    </Sheet>
  );
}

/** Bảo mật: đổi mật khẩu + công tắc sinh trắc học. */
function SecuritySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [biometric, setBiometric] = usePersistedBool('dscity:biometric', false);

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const submit = () => {
    if (next.length < 6) {
      Alert.alert(t('set.security'), t('sec.tooShort'));
      return;
    }
    if (next !== confirm) {
      Alert.alert(t('set.security'), t('sec.mismatch'));
      return;
    }
    reset();
    Alert.alert(t('set.security'), t('sec.changed'));
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title={t('set.security')}
      onClose={onClose}
      footer={<AppButton title={t('sec.change')} onPress={submit} />}>
      <View style={styles.formGap}>
        <TextField label={t('sec.current')} icon="lock-closed-outline" secureTextEntry value={current} onChangeText={setCurrent} />
        <TextField label={t('sec.new')} icon="key-outline" secureTextEntry value={next} onChangeText={setNext} />
        <TextField label={t('sec.confirm')} icon="key-outline" secureTextEntry value={confirm} onChangeText={setConfirm} />
      </View>
      <View style={styles.bioRow}>
        <Ionicons name="finger-print-outline" size={20} color={Colors.green} />
        <Text style={styles.bioLabel}>{t('sec.biometric')}</Text>
        <Toggle value={biometric} onValueChange={setBiometric} />
      </View>
    </Sheet>
  );
}

/** Chọn ngôn ngữ giao diện — danh sách đầy đủ, có tìm kiếm. */
function LanguageSheet({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: Lang;
  onSelect: (l: Lang) => void;
  onClose: () => void;
}) {
  const { t, languages, loading } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const [query, setQuery] = useState('');

  // Xoá ô tìm kiếm mỗi lần mở lại sheet.
  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const q = query.trim().toLowerCase();
  const list = q
    ? languages.filter(
        (l) =>
          l.native.toLowerCase().includes(q) ||
          l.label.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      )
    : languages;

  return (
    <Sheet visible={visible} title={t('lang.title')} onClose={onClose}>
      <View style={styles.searchWrap}>
        <TextField icon="search-outline" placeholder={t('lang.search')} value={query} onChangeText={setQuery} />
      </View>
      <View style={styles.listCard}>
        {list.map((l, i) => {
          const selected = current === l.code;
          return (
            <Pressable
              key={l.code}
              style={({ pressed }) => [styles.optionRow, pressed && styles.rowPressed]}
              onPress={() => onSelect(l.code)}>
              {i > 0 ? <View style={styles.optionSep} /> : null}
              <Text style={styles.flag}>{l.flag}</Text>
              <View style={styles.flex}>
                <Text style={styles.optionLabel}>{l.native}</Text>
                <Text style={styles.langSub}>{l.label}</Text>
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
          );
        })}
        {list.length === 0 ? <Text style={styles.langEmpty}>{t('lang.empty')}</Text> : null}
      </View>
    </Sheet>
  );
}

/** Trang nội dung đơn giản (FAQ / điều khoản / bảo mật). */
function InfoSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      {children}
    </Sheet>
  );
}

/** Trang giới thiệu: logo + mô tả + phiên bản. */
function AboutSheet({ visible, onClose, body }: { visible: boolean; onClose: () => void; body: string }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(makeStyles);
  return (
    <Sheet visible={visible} title={t('set.about')} onClose={onClose}>
      <View style={styles.aboutWrap}>
        <Image source={Images.logo} style={styles.aboutLogo} contentFit="contain" />
        <Text style={styles.aboutBody}>{body}</Text>
        <Text style={styles.aboutVersion}>{t('set.version')}</Text>
      </View>
    </Sheet>
  );
}

// ----------------------------------------------------------------------------
// Mảnh dùng lại
// ----------------------------------------------------------------------------

function FaqItem({ q, a }: { q: string; a: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.faqItem}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
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

/** Nhóm cài đặt: tiêu đề + thẻ bo góc. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/** Dòng cài đặt: icon + nhãn, bên phải là chevron / giá trị / công tắc. */
function Row({
  icon,
  label,
  value,
  right,
  onPress,
  last = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const interactive = !!onPress;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && interactive && styles.rowPressed]}
      onPress={onPress}
      disabled={!interactive}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={20} color={Colors.green} />
      </View>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      {right ?? (
        <View style={styles.rowRight}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {interactive ? (
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          ) : null}
        </View>
      )}
      {!last ? <View style={styles.separator} /> : null}
    </Pressable>
  );
}

/** Công tắc dùng màu brand. */
function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const Colors = useThemeColors();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border, true: Colors.green }}
      thumbColor={Colors.white}
      ios_backgroundColor={Colors.border}
    />
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    flex: { flex: 1 },
    headerWrap: { paddingHorizontal: Spacing.xl },
    content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing['3xl'] },
    profile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadow.card,
    },
    avatar: { width: 56, height: 56, borderRadius: Radius.full, backgroundColor: Colors.border },
    name: { ...Typography.h2, color: Colors.text },
    phone: { ...Typography.body, color: Colors.textMuted, marginTop: 2 },
    group: { marginBottom: Spacing.xl },
    groupTitle: {
      ...Typography.caption,
      color: Colors.textMuted,
      fontFamily: Fonts.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      ...Shadow.card,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      minHeight: 56,
      paddingVertical: Spacing.sm,
    },
    rowPressed: { opacity: 0.6 },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: Colors.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    rowValue: { ...Typography.body, color: Colors.textMuted },
    separator: {
      position: 'absolute',
      left: 36 + Spacing.md,
      right: 0,
      bottom: 0,
      height: 1,
      backgroundColor: Colors.border,
    },
    logout: { marginTop: Spacing.sm },

    // --- sheet ---
    sheetHint: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg },
    formGap: { gap: Spacing.lg },
    listCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      minHeight: 56,
      paddingVertical: Spacing.sm,
    },
    optionSep: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 1,
      backgroundColor: Colors.border,
    },
    optionLabel: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },
    searchWrap: { marginBottom: Spacing.md },
    flag: { fontSize: 22 },
    langSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
    langEmpty: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
    badge: {
      backgroundColor: Colors.greenSoft,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    badgeText: { ...Typography.caption, color: Colors.green, fontFamily: Fonts.semibold },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
    },
    addText: { ...Typography.bodyMed, color: Colors.green, fontFamily: Fonts.semibold },
    bioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    bioLabel: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.medium, flex: 1 },

    // --- nội dung ---
    faqItem: { marginBottom: Spacing.lg },
    faqQ: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold, marginBottom: Spacing.xs },
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
    aboutWrap: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
    aboutLogo: { width: 160, height: 124 },
    aboutBody: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
    aboutVersion: { ...Typography.caption, color: Colors.textMuted, fontFamily: Fonts.medium },
  });
