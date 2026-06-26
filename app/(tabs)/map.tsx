import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { PlaceListItem } from '@/components/place-list-item';
import { SectionHeader } from '@/components/section-header';
import { darkMapStyle, lightMapStyle } from '@/constants/map-style';
import { Fonts, Radius, Shadow, Spacing, type ThemeColors } from '@/constants/theme';
import { MAP_INITIAL_REGION, MY_LOCATION, places, type Place } from '@/data/mock';
import { useLocation } from '@/hooks/use-location';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { distanceTo } from '@/services/geo';
import { openDirections } from '@/services/maps';

const FILTERS = ['Bãi đậu xe', 'Ô tô', 'Xe máy', 'Chia sẻ'];

/** Màn 4 — Bản đồ tìm kiếm (Google Maps qua react-native-maps). */
export default function MapScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { isDark } = useTheme();
  const { location, status, refresh } = useLocation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(FILTERS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  // Vị trí thực nếu đã có quyền, không thì dùng vị trí giả lập để UI vẫn chạy.
  const myLocation = location ?? MY_LOCATION;
  const hasRealLocation = status === 'granted' && location != null;

  // Khoảng cách tới từng bãi đỗ tính lại theo vị trí của tôi (cập nhật khi di chuyển).
  const placesWithDistance = useMemo(
    () => places.map((p) => ({ ...p, distance: distanceTo(myLocation, p.coordinate) })),
    [myLocation]
  );
  const selectedPlace = placesWithDistance.find((p) => p.id === selectedId) ?? null;

  // Marker tự vẽ (custom view) có thể không hiện ngay trên Android nếu tắt
  // tracksViewChanges quá sớm — bật lúc đầu rồi tắt để tối ưu hiệu năng.
  const [trackMarkers, setTrackMarkers] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTrackMarkers(false), 1200);
    return () => clearTimeout(t);
  }, []);

  /** Bấm marker: chọn + đưa pin vào giữa khung nhìn. */
  function focusPlace(place: Place) {
    setSelectedId(place.id);
    mapRef.current?.animateToRegion(
      {
        latitude: place.coordinate.latitude,
        longitude: place.coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      350
    );
  }

  /** Nút định vị: về vị trí của tôi (xin lại quyền nếu chưa có). */
  function goToMyLocation() {
    setSelectedId(null);
    if (!hasRealLocation) refresh();
    mapRef.current?.animateToRegion(
      { ...myLocation, latitudeDelta: 0.014, longitudeDelta: 0.014 },
      400
    );
  }

  function openPlace(id: string) {
    router.push({ pathname: '/parking/[id]', params: { id } });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Bản đồ thật phủ nền */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={MAP_INITIAL_REGION}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        showsCompass={false}
        showsUserLocation={hasRealLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}>
        {/* Pin các bãi đậu xe */}
        {placesWithDistance.map((place) => {
          const active = place.id === selectedId;
          return (
            <Marker
              key={place.id}
              coordinate={place.coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={trackMarkers}
              onPress={(e) => {
                e.stopPropagation();
                focusPlace(place);
              }}>
              <View style={[styles.pin, active && styles.pinActive]}>
                <Text style={styles.pinText}>P</Text>
              </View>
            </Marker>
          );
        })}

        {/* Vị trí của tôi — chấm tự vẽ chỉ khi chưa có quyền (nếu có thì OS tự vẽ chấm xanh). */}
        {!hasRealLocation ? (
          <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={trackMarkers}>
            <View style={styles.myLocation}>
              <View style={styles.myLocationDot} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      {/* Lớp trên: tìm kiếm + filter */}
      <View style={styles.top}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm địa điểm, bãi đậu xe..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="options-outline" size={20} color={Colors.green} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      {/* Nút định vị về vị trí của tôi */}
      <Pressable
        onPress={goToMyLocation}
        style={({ pressed }) => [styles.locateBtn, pressed && styles.locateBtnPressed]}
        hitSlop={8}>
        <Ionicons name="locate" size={22} color={Colors.green} />
      </Pressable>

      {/* Khi chọn 1 bãi đỗ: thẻ chỉ đường → mở Google Maps để đi đến đó */}
      {selectedPlace ? (
        <View style={styles.directionsCard}>
          <View style={styles.directionsInfo}>
            <Text style={styles.directionsName} numberOfLines={1}>
              {selectedPlace.name.replace('Bãi đậu xe ', '')}
            </Text>
            <View style={styles.directionsMeta}>
              <Ionicons name="navigate-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.directionsDistance}>Cách bạn {selectedPlace.distance}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => openDirections(selectedPlace.coordinate, selectedPlace.name)}
            style={({ pressed }) => [styles.directionsBtn, pressed && styles.locateBtnPressed]}
            hitSlop={6}>
            <Ionicons name="navigate" size={18} color={Colors.white} />
            <Text style={styles.directionsBtnText}>Chỉ đường</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Bottom sheet tĩnh: danh sách gần bạn */}
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <SectionHeader title="Gần bạn" onAction={() => {}} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {placesWithDistance.map((place, i) => (
            <View key={place.id}>
              {i > 0 ? <View style={styles.separator} /> : null}
              <PlaceListItem place={place} onPress={() => openPlace(place.id)} />
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.mapBg },
    pin: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      backgroundColor: Colors.green,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: Colors.white,
      ...Shadow.card,
    },
    pinActive: {
      backgroundColor: Colors.navy,
      transform: [{ scale: 1.18 }],
    },
    pinText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },
    myLocation: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(10,104,62,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    myLocationDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: Colors.green,
      borderWidth: 2,
      borderColor: Colors.white,
    },
    top: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      height: 50,
      paddingHorizontal: Spacing.lg,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      ...Shadow.card,
    },
    searchInput: { flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: Colors.text, padding: 0 },
    filters: { gap: Spacing.sm, paddingVertical: Spacing.md, paddingRight: Spacing.xl },
    locateBtn: {
      position: 'absolute',
      right: Spacing.xl,
      bottom: '48%',
      width: 46,
      height: 46,
      borderRadius: Radius.full,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.card,
    },
    locateBtnPressed: { opacity: 0.7 },
    directionsCard: {
      position: 'absolute',
      left: Spacing.xl,
      right: Spacing.xl,
      bottom: '54%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      ...Shadow.card,
    },
    directionsInfo: { flex: 1 },
    directionsName: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.text },
    directionsMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    directionsDistance: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
    directionsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 40,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.full,
      backgroundColor: Colors.green,
    },
    directionsBtnText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.white },
    sheet: {
      marginTop: 'auto',
      backgroundColor: Colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      maxHeight: '46%',
      ...Shadow.tabBar,
    },
    handle: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: Colors.border,
      marginBottom: Spacing.lg,
    },
    separator: { height: 1, backgroundColor: Colors.border },
  });
