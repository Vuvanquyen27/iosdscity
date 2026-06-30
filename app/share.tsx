import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppHeader } from '@/components/app-header';
import { RatingBadge } from '@/components/rating-badge';
import { SectionHeader } from '@/components/section-header';
import { Fonts, Radius, Shadow, Spacing, Typography, type ThemeColors } from '@/constants/theme';
import { formatVND, type Trip } from '@/data/mock';
import { useTrips } from '@/hooks/use-catalog';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';

type Mode = 'find' | 'offer';

/** Màn 8 — Chia sẻ phương tiện. */
export default function ShareScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { isDark } = useTheme();
  const [mode, setMode] = useState<Mode>('find');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: trips, loading } = useTrips();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.headerWrap}>
        <AppHeader variant="back" title="Chia sẻ phương tiện" onBack={() => router.back()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tab chọn chế độ */}
        <View style={styles.segment}>
          <SegmentTab label="Tìm chuyến" active={mode === 'find'} onPress={() => setMode('find')} />
          <SegmentTab label="Chia sẻ xe" active={mode === 'offer'} onPress={() => setMode('offer')} />
        </View>

        {/* Form */}
        <View style={styles.card}>
          <FormRow icon="locate" placeholder="Nhập điểm đón" value={from} onChangeText={setFrom} />
          <View style={styles.formSeparator} />
          <FormRow icon="location" placeholder="Nhập điểm đến" value={to} onChangeText={setTo} />
          <View style={styles.formSeparator} />
          <View style={styles.formRow}>
            <Ionicons name="time-outline" size={20} color={Colors.green} />
            <Text style={styles.timeValue}>Hôm nay, 09:00</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </View>

        <AppButton title={mode === 'find' ? 'Tìm chuyến' : 'Đăng chuyến'} onPress={() => {}} />

        {/* Gợi ý chuyến đi */}
        <View style={{ marginTop: Spacing['2xl'] }}>
          <SectionHeader title="Gợi ý chuyến đi" onAction={() => {}} />
          <View style={{ gap: Spacing.md }}>
            {loading ? (
              <ActivityIndicator color={Colors.green} style={{ paddingVertical: Spacing['2xl'] }} />
            ) : trips.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có chuyến đi nào.</Text>
            ) : (
              trips.map((t) => <TripCard key={t.id} trip={t} />)
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SegmentTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable style={[styles.segTab, active && styles.segTabActive]} onPress={onPress}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FormRow({
  icon,
  placeholder,
  value,
  onChangeText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <View style={styles.formRow}>
      <Ionicons name={icon} size={20} color={Colors.green} />
      <TextInput
        style={styles.formInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripTop}>
        <Image source={{ uri: trip.avatar }} style={styles.tripAvatar} contentFit="cover" />
        <View style={styles.flex}>
          <Text style={styles.tripName}>{trip.driverName}</Text>
          <RatingBadge rating={trip.rating} compact />
        </View>
        <Text style={styles.tripPrice}>{formatVND(trip.price)}</Text>
      </View>

      <View style={styles.tripRoute}>
        <Ionicons name="navigate-outline" size={16} color={Colors.green} />
        <Text style={styles.tripRouteText}>
          {trip.from} → {trip.to}
        </Text>
      </View>

      <View style={styles.tripMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{trip.time}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>Còn {trip.seatsLeft} chỗ</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: Spacing.xl },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], paddingTop: Spacing.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  segTab: { flex: 1, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  segTabActive: { backgroundColor: Colors.green },
  segText: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted },
  segTextActive: { color: Colors.white, fontFamily: Fonts.semibold },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, height: 56 },
  formInput: { flex: 1, fontFamily: Fonts.regular, fontSize: 15, color: Colors.text, padding: 0 },
  formSeparator: { height: 1, backgroundColor: Colors.border, marginLeft: 32 },
  timeValue: { flex: 1, fontFamily: Fonts.medium, fontSize: 15, color: Colors.text },
  tripCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  tripTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  tripAvatar: { width: 44, height: 44, borderRadius: Radius.full, backgroundColor: Colors.border },
  tripName: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold },
  tripPrice: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.green },
  tripRoute: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tripRouteText: { ...Typography.bodyMed, color: Colors.text, fontFamily: Fonts.semibold },
  tripMeta: { flexDirection: 'row', gap: Spacing.xl },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...Typography.caption, color: Colors.textMuted },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing['2xl'] },
});
