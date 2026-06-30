/**
 * DSCITY — Ví & lịch sử đơn toàn cục.
 *
 * - Đã ĐĂNG NHẬP: số dư + lịch sử đơn lấy từ Supabase (wallets + bookings);
 *   `spend()` tạo đơn thật + trừ ví, `topup()` cộng ví thật.
 * - CHƯA đăng nhập (demo): dùng số dư/giao dịch mock + lưu AsyncStorage.
 *
 * Dùng: `const { balance, transactions, spend, topup } = useWallet();`
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

import {
  user as defaultUser,
  transactions as seedTransactions,
  type PaymentMethod,
  type Transaction,
} from '@/data/mock';
import { bookAndPay, fetchMyBookings, fetchWalletBalance, topup as apiTopup } from '@/services/api';
import { getSession, onAuthChange } from '@/services/auth';
import type { ServiceType } from '@/types/database';

const STORAGE_KEY = 'dscity:wallet';

/** Thông tin một khoản chi. Có serviceType+targetId → ghi đơn THẬT (khi đã đăng nhập). */
export type SpendInput = Pick<Transaction, 'kind' | 'name' | 'amount'> & {
  serviceType?: ServiceType;
  targetId?: string;
};

interface WalletState {
  balance: number;
  transactions: Transaction[];
}

interface WalletContextValue {
  balance: number;
  /** Lịch sử đơn — mới nhất ở đầu. */
  transactions: Transaction[];
  /** Trừ tiền (+ đặt đơn thật nếu đã đăng nhập & có targetId). false nếu số dư không đủ. */
  spend: (input: SpendInput) => Promise<boolean>;
  /** Cộng tiền vào ví (nạp tiền). */
  topup: (amount: number, method?: PaymentMethod) => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

/** Trạng thái ví mặc định (chế độ demo, chưa đăng nhập). */
const INITIAL: WalletState = {
  balance: defaultUser.balance,
  transactions: seedTransactions,
};

/** Ngày giờ hiện tại dạng "dd/MM/yyyy, HH:mm" cho nhãn giao dịch local. */
function nowLabel(): string {
  const d = new Date();
  const p = (n: number) => n.toString().padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}, ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(INITIAL);
  // Bản sao đồng bộ để spend()/topup() đọc số dư mới nhất ngay trong cùng tick.
  const ref = useRef(state);
  const signedIn = useRef(false);

  /** Đặt state + ref (dữ liệu server — KHÔNG lưu storage). */
  const apply = useCallback((next: WalletState) => {
    ref.current = next;
    setState(next);
  }, []);

  /** Đặt state + ref + lưu storage (chế độ demo). */
  const commitLocal = useCallback((next: WalletState) => {
    ref.current = next;
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    async function loadServer() {
      try {
        const [balance, transactions] = await Promise.all([fetchWalletBalance(), fetchMyBookings()]);
        if (active) apply({ balance, transactions });
      } catch {
        /* lỗi mạng — giữ trạng thái hiện tại */
      }
    }

    async function init() {
      const session = await getSession();
      signedIn.current = !!session;
      if (session) {
        loadServer();
      } else {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && saved) {
          const parsed = JSON.parse(saved) as Partial<WalletState>;
          apply({
            balance: typeof parsed.balance === 'number' ? parsed.balance : INITIAL.balance,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL.transactions,
          });
        }
      }
    }

    init();

    const unsub = onAuthChange((isSignedIn) => {
      signedIn.current = isSignedIn;
      if (isSignedIn) loadServer();
      else apply(INITIAL);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [apply]);

  const spend = useCallback<WalletContextValue['spend']>(
    async (input) => {
      const cur = ref.current;
      if (input.amount > cur.balance) return false; // không đủ tiền

      // Đã đăng nhập + có đích → đặt đơn THẬT trên Supabase.
      if (signedIn.current && input.serviceType && input.targetId) {
        try {
          await bookAndPay({
            serviceType: input.serviceType,
            targetId: input.targetId,
            amount: input.amount,
            name: input.name,
          });
        } catch (e) {
          if (e instanceof Error && e.message === 'insufficient') return false;
          throw e; // lỗi khác → để màn gọi hiển thị
        }
        const [balance, transactions] = await Promise.all([fetchWalletBalance(), fetchMyBookings()]);
        apply({ balance, transactions });
        return true;
      }

      // Demo (chưa đăng nhập): trừ ví + ghi 1 giao dịch local.
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        kind: input.kind,
        name: input.name,
        amount: input.amount,
        datetime: nowLabel(),
        status: 'completed',
      };
      commitLocal({ balance: cur.balance - input.amount, transactions: [tx, ...cur.transactions] });
      return true;
    },
    [apply, commitLocal]
  );

  const topup = useCallback<WalletContextValue['topup']>(
    async (amount, method = 'MOMO') => {
      if (amount <= 0) return;
      if (signedIn.current) {
        const balance = await apiTopup(amount, method);
        apply({ ...ref.current, balance });
        return;
      }
      const cur = ref.current;
      commitLocal({ ...cur, balance: cur.balance + amount });
    },
    [apply, commitLocal]
  );

  const value = useMemo<WalletContextValue>(
    () => ({ balance: state.balance, transactions: state.transactions, spend, topup }),
    [state, spend, topup]
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet phải được dùng bên trong <WalletProvider>.');
  }
  return ctx;
}
