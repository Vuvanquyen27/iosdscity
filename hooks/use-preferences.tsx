/**
 * DSCITY — Tuỳ chọn trong Cài đặt (thông báo, định vị, bảo mật, thanh toán).
 *
 * Mỗi tuỳ chọn được lưu vào AsyncStorage nên giữ nguyên sau khi mở lại app.
 * Dùng: `const { prefs, setPref } = usePreferences();`
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { PaymentMethod } from '@/data/mock';

export interface Preferences {
  /** Thông báo đẩy. */
  push: boolean;
  /** Email khuyến mãi. */
  promo: boolean;
  /** Dịch vụ định vị. */
  location: boolean;
  /** Đăng nhập bằng vân tay / Face ID. */
  biometric: boolean;
  /** Phương thức thanh toán mặc định. */
  payment: PaymentMethod;
}

const DEFAULTS: Preferences = {
  push: true,
  promo: false,
  location: true,
  biometric: false,
  payment: 'MOMO',
};

interface PreferencesContextValue {
  prefs: Preferences;
  /** Đặt một tuỳ chọn + lưu. */
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const STORAGE_KEY = 'dscity:prefs';

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  // Nạp tuỳ chọn đã lưu (nếu có) khi mở app.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const parsed = JSON.parse(saved) as Partial<Preferences>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      })
      .catch(() => {
        /* bỏ qua lỗi đọc storage — dùng mặc định */
      });
  }, []);

  const setPref = useCallback<PreferencesContextValue['setPref']>((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        /* bỏ qua lỗi ghi storage */
      });
      return next;
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(() => ({ prefs, setPref }), [prefs, setPref]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences phải được dùng bên trong <PreferencesProvider>.');
  }
  return ctx;
}
