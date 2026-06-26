/**
 * DSCITY — Hồ sơ người dùng toàn cục.
 *
 * Giữ thông tin người dùng (khởi tạo từ mock), nạp phần đã chỉnh từ
 * AsyncStorage khi mở app, và lưu lại mỗi khi `update()` được gọi.
 * Khi đổi tên: tự suy lại `firstName` (lời chào trang chủ) và `avatar`.
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
  useState,
  type ReactNode,
} from 'react';

import { avatarUrl, user as defaultUser, type User } from '@/data/mock';

const STORAGE_KEY = 'dscity:user';

/** Các trường người dùng tự chỉnh được trong màn Hồ sơ. */
export type EditableUser = Pick<User, 'name' | 'phone' | 'email'>;

interface UserContextValue {
  user: User;
  /** Gộp thay đổi + lưu. Đổi tên sẽ cập nhật lại firstName & avatar. */
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);

  // Nạp phần hồ sơ đã chỉnh (nếu có) khi mở app.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const patch = JSON.parse(saved) as Partial<EditableUser>;
        setUser((prev) => mergeUser(prev, patch));
      })
      .catch(() => {
        /* bỏ qua lỗi đọc storage — dùng hồ sơ mặc định */
      });
  }, []);

  const update = useCallback((patch: Partial<EditableUser>) => {
    setUser((prev) => {
      const next = mergeUser(prev, patch);
      const toSave: EditableUser = { name: next.name, phone: next.phone, email: next.email };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {
        /* bỏ qua lỗi ghi storage */
      });
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
