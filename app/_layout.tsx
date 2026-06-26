import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PreferencesProvider } from '@/hooks/use-preferences';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';
import { UserProvider } from '@/hooks/use-user';
import { LanguageProvider } from '@/i18n';

// Giữ splash gốc cho tới khi font nạp xong.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 300 });

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Chặn render tới khi font sẵn sàng (tránh nháy font hệ thống).
  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <UserProvider>
              <PreferencesProvider>
                <RootNavigator />
              </PreferencesProvider>
            </UserProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Stack điều hướng — tách riêng để đọc theme (nền + thanh trạng thái đổi theo chế độ). */
function RootNavigator() {
  const { colors, isDark } = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="parking/[id]" />
        <Stack.Screen name="car/[id]" />
        <Stack.Screen name="motorbike/[id]" />
        <Stack.Screen name="share" />
        <Stack.Screen name="topup" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="success" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}
