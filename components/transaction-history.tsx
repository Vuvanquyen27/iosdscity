/**
 * DSCITY — Danh sách giao dịch (gom theo ngày, kiểu sao kê).
 *
 * Gom giao dịch theo NGÀY (mới nhất trước), mỗi nhóm có header ngày trên nền
 * xám cực nhạt, bên dưới là từng item: icon tròn (đỏ = tiền ra, xanh = tiền
 * vào), loại + nội dung (truncate 1 dòng), số tiền + giờ.
 *
 * Dùng: `<TransactionHistory transactions={bankTransactions} />`
 *
 * Toàn bộ màu lấy từ theme dự án (tự đổi theo chế độ sáng/tối): tiền ra dùng
 * `danger`, tiền vào dùng `success`; nền/chữ/viền dùng token chuẩn.
 */
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { type BankTransaction } from '@/data/mock';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';

/** Sắc nền nhạt cho icon — phủ mờ nên hợp cả nền sáng lẫn tối. */
const OUT_SOFT = 'rgba(220, 38, 38, 0.12)';
const IN_SOFT = 'rgba(22, 163, 74, 0.12)';

/** Nhóm chữ số theo hàng nghìn: 50000 -> "50.000" (dấu chấm kiểu VN). */
export function groupThousands(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** "dd/MM/yyyy" + "HH:mm" -> số sắp xếp được (yyyyMMddHHmm). */
function sortKey(date: string, time: string): number {
  const [d, m, y] = date.split('/').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return ((y * 100 + m) * 100 + d) * 10000 + hh * 100 + mm;
}

interface DateGroup {
  date: string;
  items: BankTransaction[];
}

/** Gom theo ngày; nhóm & item trong nhóm đều mới nhất trước. */
function groupByDate(transactions: BankTransaction[]): DateGroup[] {
  const map = new Map<string, BankTransaction[]>();
  for (const tx of transactions) {
    const arr = map.get(tx.date);
    if (arr) arr.push(tx);
    else map.set(tx.date, [tx]);
  }
  const groups: DateGroup[] = [...map.entries()].map(([date, items]) => ({
    date,
    items: items.sort((a, b) => sortKey(b.date, b.time) - sortKey(a.date, a.time)),
  }));
  // Nhóm: ngày mới nhất trước (so theo item đầu — đã là item mới nhất của nhóm).
  groups.sort((a, b) => sortKey(b.date, b.items[0].time) - sortKey(a.date, a.items[0].time));
  return groups;
}

export interface TransactionHistoryProps {
  transactions: BankTransaction[];
}

/** Danh sách giao dịch gom theo ngày. */
export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { t } = useLanguage();
  const groups = useMemo(() => groupByDate(transactions), [transactions]);

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t('tx.empty')}</Text>
      </View>
    );
  }

  return (
    <View>
      {groups.map((group) => (
        <View key={group.date}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{group.date}</Text>
          </View>

          {group.items.map((tx, i) => {
            const isOut = tx.type === 'OUT';
            const color = isOut ? Colors.danger : Colors.success;
            return (
              <View key={tx.id} style={styles.itemWrap}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.row}>
                  <View
                    style={[styles.iconCircle, { backgroundColor: isOut ? OUT_SOFT : IN_SOFT }]}>
                    <Ionicons name={isOut ? 'arrow-up' : 'arrow-down'} size={18} color={color} />
                  </View>

                  <View style={styles.middle}>
                    <Text style={styles.txType}>{isOut ? t('tx.out') : t('tx.in')}</Text>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description}
                    </Text>
                  </View>

                  <View style={styles.right}>
                    <Text style={[styles.txAmount, { color }]} numberOfLines={1}>
                      {isOut ? '-' : '+'}
                      {groupThousands(tx.amount)} VND
                    </Text>
                    <Text style={styles.txTime}>{tx.time}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    // Header ngày — nền xám cực nhạt (Colors.bg ~ #F3F6FA ở chế độ sáng).
    dateHeader: {
      backgroundColor: Colors.bg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    dateHeaderText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },

    itemWrap: { backgroundColor: Colors.surface },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg, // 16px ngang
      paddingVertical: Spacing.md, // 12px dọc
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    middle: { flex: 1 },
    txType: {
      fontFamily: Fonts.medium,
      fontSize: 14,
      color: Colors.text,
      textTransform: 'uppercase',
    },
    txDesc: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    txAmount: { fontFamily: Fonts.bold, fontSize: 14 },
    txTime: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
    // Divider mỏng, thụt vào ngang phần icon cho gọn.
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginLeft: Spacing.lg + 40 + Spacing.md,
    },

    empty: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing['3xl'],
      paddingHorizontal: Spacing.xl,
      backgroundColor: Colors.surface,
    },
    emptyText: {
      fontFamily: Fonts.regular,
      fontSize: 13,
      color: Colors.textMuted,
      textAlign: 'center',
    },
  });
