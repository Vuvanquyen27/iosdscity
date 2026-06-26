import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { useThemeColors, useThemedStyles } from '@/hooks/use-theme';

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Nội dung ghim dưới đáy (vd: nút Lưu) — nằm ngoài vùng cuộn. */
  footer?: React.ReactNode;
}

/**
 * Bottom sheet tái sử dụng cho các trang con trong Cài đặt.
 * Trượt từ dưới lên, có lớp phủ nền, tay nắm kéo, tiêu đề + nút đóng,
 * vùng nội dung cuộn được và footer ghim tuỳ chọn. Theo theme sáng/tối.
 */
export function Sheet({ visible, title, onClose, children, footer }: SheetProps) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay },
    sheetWrap: { width: '100%' },
    sheet: {
      backgroundColor: Colors.bg,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
      maxHeight: '88%',
      ...Shadow.tabBar,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: Radius.full,
      backgroundColor: Colors.border,
      marginBottom: Spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    title: { ...Typography.h1, fontSize: 20, color: Colors.text, flex: 1 },
    close: {
      width: 32,
      height: 32,
      borderRadius: Radius.full,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { paddingBottom: Spacing.lg },
    footer: { paddingTop: Spacing.md },
  });
