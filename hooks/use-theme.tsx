import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

import { darkColors, lightColors, type ColorScheme, type ThemeColors } from '@/constants/theme';

const STORAGE_KEY = 'dscity:color-scheme';

interface ThemeContextValue {
  /** Chế độ hiện tại. */
  scheme: ColorScheme;
  /** Bảng màu tương ứng chế độ — dùng trong style/JSX. */
  colors: ThemeColors;
  /** Tiện ích: có đang ở chế độ tối không. */
  isDark: boolean;
  /** Bật/tắt chế độ tối. */
  toggle: () => void;
  /** Đặt chế độ cụ thể. */
  setScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Bọc toàn app: giữ chế độ màu, nạp lựa chọn đã lưu (hoặc theo hệ thống),
 * và lưu lại mỗi khi đổi.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>(
    () => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light')
  );

  // Nạp lựa chọn đã lưu (nếu có) khi mở app.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setSchemeState(saved);
        }
      })
      .catch(() => {
        /* bỏ qua lỗi đọc storage — dùng mặc định theo hệ thống */
      });
  }, []);

  const setScheme = useCallback((next: ColorScheme) => {
    setSchemeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      /* bỏ qua lỗi ghi storage */
    });
  }, []);

  const toggle = useCallback(() => {
    setSchemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      isDark: scheme === 'dark',
      toggle,
      setScheme,
    }),
    [scheme, toggle, setScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Lấy toàn bộ giá trị theme (scheme, colors, toggle…). */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme phải được dùng bên trong <ThemeProvider>.');
  }
  return ctx;
}

/** Tiện ích: chỉ lấy bảng màu hiện tại (dùng cho color inline trong JSX). */
export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}

/**
 * Tạo StyleSheet theo bảng màu hiện tại.
 *
 * Dùng: đặt `makeStyles` ở cấp module rồi gọi trong component:
 *   const styles = useThemedStyles(makeStyles);
 *   ...
 *   const makeStyles = (Colors: ThemeColors) => StyleSheet.create({ ... });
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useThemeColors();
  return useMemo(() => factory(colors), [colors, factory]);
}
