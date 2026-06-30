/**
 * DSCITY — Hồ sơ người dùng toàn cục.
 *
 * - Đã ĐĂNG NHẬP: nạp hồ sơ từ Supabase (bảng profiles); `update()` ghi thẳng lên DB.
 * - CHƯA đăng nhập (chế độ demo): dùng hồ sơ mock + lưu chỉnh sửa vào AsyncStorage.
 * Tự nạp lại khi trạng thái đăng nhập đổi (onAuthChange).
 *
 * Dùng: `const { user, update } = useUser();`
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { avatarUrl, user as defaultUser, type User } from '@/data/mock';
import { fetchProfile, updateProfile } from '@/services/api';
import { getSession, onAuthChange } from '@/services/auth';
import type { ProfileRow } from '@/types/database';

const STORAGE_KEY = 'dscity:user';

/** Các trường người dùng tự chỉnh được trong màn Hồ sơ. */
export type EditableUser = Pick<User, 'name' | 'phone' | 'email'>;

interface UserContextValue {
  user: User;
  /** Gộp thay đổi + lưu (Supabase nếu đã đăng nhập, không thì AsyncStorage). */
  update: (patch: Partial<EditableUser>) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

/** Lấy tên gọi (từ cuối) từ họ tên đầy đủ — "Nguyễn Văn Minh" → "Minh". */
function deriveFirstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : name.trim();
}

/** Gộp patch vào user, suy lại firstName & avatar khi tên thay đổi. */
function mergeUser(prev: User, patch: Partial<EditableUser>): User {
  const next: User = { ...prev, ...patch };
  if (patch.name !== undefined && patch.name !== prev.name) {
    next.firstName = deriveFirstName(patch.name) || prev.firstName;
    next.avatar = avatarUrl(patch.name);
  }
  return next;
}

/** ProfileRow (DB) → User (hiển thị). Số dư lấy từ useWallet nên để 0 ở đây. */
function profileToUser(p: ProfileRow): User {
  const name = p.full_name || 'Người dùng';
  return {
    name,
    firstName: deriveFirstName(name),
    phone: p.phone ?? '',
    email: p.email ?? '',
    balance: 0,
    avatar: p.avatar_url || avatarUrl(name),
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const signedIn = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const p = await fetchProfile();
        if (active && p) setUser(profileToUser(p));
      } catch {
        /* lỗi mạng — giữ hồ sơ hiện tại */
      }
    }

    async function init() {
      const session = await getSession();
      signedIn.current = !!session;
      if (session) {
        loadProfile();
      } else {
        // Chế độ demo: nạp phần hồ sơ đã chỉnh lưu local (nếu có).
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && saved) {
          const patch = JSON.parse(saved) as Partial<EditableUser>;
          setUser((prev) => mergeUser(prev, patch));
        }
      }
    }

    init();

    // Đăng nhập/đăng xuất → nạp lại hồ sơ tương ứng.
    const unsub = onAuthChange((isSignedIn) => {
      signedIn.current = isSignedIn;
      if (isSignedIn) loadProfile();
      else setUser(defaultUser);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const update = useCallback((patch: Partial<EditableUser>) => {
    setUser((prev) => {
      const next = mergeUser(prev, patch);
      if (signedIn.current) {
        updateProfile({
          full_name: next.name,
          phone: next.phone || null,
          email: next.email || null,
        }).catch(() => {
          /* bỏ qua lỗi ghi — UI đã cập nhật lạc quan */
        });
      } else {
        const toSave: EditableUser = { name: next.name, phone: next.phone, email: next.email };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
      }
      return next;
    });
  }, []);

  const value = useMemo<UserContextValue>(() => ({ user, update }), [user, update]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser phải được dùng bên trong <UserProvider>.');
  }
  return ctx;
}
