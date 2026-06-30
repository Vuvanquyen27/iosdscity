import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Shadow, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type UiKey } from '@/i18n';

/** Cấu hình icon + key nhãn cho từng tab (khớp tên file trong app/(tabs)/). */
const TAB_META: Record<
  string,
  { labelKey: UiKey; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap }
> = {
  home: { labelKey: 'tab.home', icon: 'home-outline', iconActive: 'home' },
  map: { labelKey: 'tab.map', icon: 'map-outline', iconActive: 'map' },
  booking: { labelKey: 'tab.booking', icon: 'calendar-outline', iconActive: 'calendar' },
  notifications: {
    labelKey: 'tab.notifications',
    icon: 'notifications-outline',
    iconActive: 'notifications',
  },
  account: { labelKey: 'tab.account', icon: 'person-outline', iconActive: 'person' },
};

/** Bottom navigation 5 tab — tab active màu green, nền trắng bo góc trên. */
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null; // bỏ qua route không nằm trong tab bar

        const isFocused = state.index === index;
        const color = isFocused ? Colors.green : Colors.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}>
            <Ionicons name={isFocused ? meta.iconActive : meta.icon} size={24} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {t(meta.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      paddingTop: Spacing.sm,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      ...Shadow.tabBar,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
    label: { fontFamily: Fonts.medium, fontSize: 11 },
  });
