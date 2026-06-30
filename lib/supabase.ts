/**
 * DSCITY — Client Supabase cho Expo / React Native.
 *
 * - Session lưu vào AsyncStorage (giữ đăng nhập sau khi đóng app).
 * - Tự refresh token khi app quay lại foreground (AppState).
 * - Khoá lấy từ biến môi trường EXPO_PUBLIC_* (xem .env.example).
 *
 * Dùng: `import { supabase } from '@/lib/supabase';`
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Báo sớm, rõ ràng — tránh lỗi khó hiểu lúc gọi query.
  console.warn(
    '[supabase] Thiếu EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Tạo file .env từ .env.example rồi khởi động lại Expo.'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost',
  supabaseAnonKey ?? 'public-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // RN không có URL session như web → tắt để khỏi cảnh báo.
      detectSessionInUrl: false,
    },
  }
);

// Tự bật/tắt refresh token theo trạng thái app (khuyến nghị của Supabase cho RN).
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
