import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { PlaceListItem } from '@/components/place-list-item';
import { SectionHeader } from '@/components/section-header';
import { darkMapStyle, lightMapStyle } from '@/constants/map-style';
import { Fonts, Radius, Shadow, Spacing, type ThemeColors } from '@/constants/theme';
import {
  MAP_INITIAL_REGION,
  MY_LOCATION,
  isBookable,
  type LatLng,
  type Place,
} from '@/data/mock';
import { useParkingLots } from '@/hooks/use-catalog';
import { useLocation } from '@/hooks/use-location';
import { useNearbyParking } from '@/hooks/use-nearby-parking';
import { useTheme, useThemeColors, useThemedStyles } from '@/hooks/use-theme';
import { useLanguage, type UiKey } from '@/i18n';
import { describeCoordinate, geocodePlace } from '@/services/geocode';
import { distanceTo, haversineMeters } from '@/services/geo';
import { openDirections } from '@/services/maps';

/** Bộ lọc — lưu `key` ổn định (không đổi theo ngôn ngữ), nhãn dịch qua `labelKey`. */
const FILTERS: { key: string; labelKey: UiKey }[] = [
  { key: 'parking', labelKey: 'order.parkingPrefix' },
  { key: 'car', labelKey: 'filter.car' },
  { key: 'motorbike', labelKey: 'filter.motorbike' },
  { key: 'share', labelKey: 'filter.share' },
];

type MapStyles = ReturnType<typeof makeStyles>;

/** Bỏ dấu + thường hoá để tìm kiếm tiếng Việt không phân biệt dấu/hoa-thường. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu thanh đã tách bởi NFD
    .replace(/đ/g, 'd'); // đ (không bị NFD tách)
}

/**
 * Viewport culling — chỉ giữ những pin trong khung nhìn hiện tại (cộng biên đệm
 * 40% mỗi chiều để pin sát mép vẫn sẵn sàng khi lướt tới). Số marker vẽ trên
 * bản đồ luôn tối thiểu; dữ liệu càng nhiều, lợi ích càng lớn.
 */
function cullToRegion<T extends { coordinate: LatLng }>(items: T[], region: Region): T[] {
  const latMargin = region.latitudeDelta * 0.9; // nửa khung (0.5) + đệm (0.4)
  const lngMargin = region.longitudeDelta * 0.9;
  return items.filter(
    (it) =>
      Math.abs(it.coordinate.latitude - region.latitude) <= latMargin &&
      Math.abs(it.coordinate.longitude - region.longitude) <= lngMargin
  );
}

/**
 * Pin bãi đỗ — tách riêng + memo hoá để KHÔNG vẽ lại khi cha re-render (lúc lướt
 * bản đồ hay cập nhật vị trí). Chỉ nhận props ổn định: `coordinate` (giữ nguyên
 * tham chiếu gốc qua spread), `id`, `active`. Nhờ vậy chỉ đúng pin đổi `active`
 * mới render lại → lướt mượt.
 */
const PlaceMarker = memo(function PlaceMarker({
  id,
  name,
  coordinate,
  active,
  bookable,
  onPress,
  styles,
}: {
  id: string;
  name: string;
  coordinate: LatLng;
  active: boolean;
  /** Bãi đối tác (đặt được) → pin xanh đặc; bãi Google → pin viền nhạt. */
  bookable: boolean;
  onPress: (id: string, coordinate: LatLng, name: string) => void;
  styles: MapStyles;
}) {
  // tracksViewChanges đắt (chụp lại texture mỗi frame). Bật ngắn khi mount / khi
  // đổi active để native chụp lại ảnh pin, rồi tắt để pan không tốn frame.
  const [track, setTrack] = useState(true);
  useEffect(() => {
    setTrack(true);
    const t = setTimeout(() => setTrack(false), 400);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={track}
      onPress={(e) => {
        e.stopPropagation();
        onPress(id, coordinate, name);
      }}>
      <View
        style={[styles.pin, !bookable && !active && styles.pinGoogle, active && styles.pinActive]}>
        <Text style={[styles.pinText, !bookable && !active && styles.pinTextGoogle]}>P</Text>
      </View>
    </Marker>
  );
});

/** Màn 4 — Bản đồ tìm kiếm (Google Maps qua react-native-maps). */
export default function MapScreen() {
  const styles = useThemedStyles(makeStyles);
  const Colors = useThemeColors();
  const { isDark } = useTheme();
  const { location, status, refresh } = useLocation();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(FILTERS[0].key);

  // Tham số "vào map từ màn khác": canh giữa + chọn sẵn một địa điểm.
  const params = useLocalSearchParams<{
    focusId?: string;
    focusLat?: string;
    focusLng?: string;
    focusName?: string;
    ts?: string;
  }>();

  const [selectedId, setSelectedId] = useState<string | null>(params.focusId ?? null);

  // Điểm đích tự chọn (tìm kiếm địa điểm bất kỳ / nhấn giữ bản đồ) — không phải
  // bãi đỗ nên không có trang chi tiết, chỉ để xem + chỉ đường.
  const [customDest, setCustomDest] = useState<{ coordinate: LatLng; name: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Vùng canh giữa lúc MỚI mở map (chỉ tính 1 lần) — để vào từ màn khác là thấy
  // ngay địa điểm, không phải chờ animateToRegion (tab có thể vừa mount).
  const initialFocusRef = useRef<Region | null | undefined>(undefined);
  if (initialFocusRef.current === undefined) {
    const lat = Number(params.focusLat);
    const lng = Number(params.focusLng);
    initialFocusRef.current =
      params.focusLat && params.focusLng && !Number.isNaN(lat) && !Number.isNaN(lng)
        ? { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        : null;
  }
  const initialFocus = initialFocusRef.current;

  // Vị trí thực nếu đã có quyền, không thì dùng vị trí giả lập để UI vẫn chạy.
  const myLocation = location ?? MY_LOCATION;
  const hasRealLocation = status === 'granted' && location != null;

  // Khung nhìn hiện tại — chỉ cập nhật khi lướt xong (onRegionChangeComplete),
  // KHÔNG cập nhật trong lúc kéo nên không gây re-render mỗi frame.
  const [region, setRegion] = useState<Region>(initialFocus ?? { ...MAP_INITIAL_REGION });

  /**
   * Vào map từ màn khác (Trang chủ / Chi tiết): chọn + canh giữa địa điểm được
   * truyền vào. `ts` là nonce nên bấm lại CÙNG địa điểm vẫn canh lại được. Lần
   * mount đầu đã được `initialFocus` lo nên ở đây bỏ qua (so token để khỏi lặp).
   */
  const focusToken = `${params.focusId ?? ''}|${params.focusLat ?? ''}|${params.focusLng ?? ''}|${params.ts ?? ''}`;
  const lastFocus = useRef(focusToken);
  useEffect(() => {
    if (focusToken === lastFocus.current) return;
    lastFocus.current = focusToken;
    if (params.focusId) setSelectedId(params.focusId);
    const lat = Number(params.focusLat);
    const lng = Number(params.focusLng);
    if (params.focusLat && params.focusLng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        350
      );
    }
  }, [focusToken, params.focusId, params.focusLat, params.focusLng]);

  // Tâm + bán kính khung nhìn → tìm bãi đỗ Google quanh đó (toàn quốc).
  // Bán kính co giãn theo mức zoom (≈ nửa chiều cao khung nhìn), làm tròn 500m để
  // zoom lặt vặt không kích hoạt gọi lại API; Google giới hạn ≤ 50km.
  const searchCenter = useMemo<LatLng>(
    () => ({ latitude: region.latitude, longitude: region.longitude }),
    [region.latitude, region.longitude]
  );
  const searchRadius = useMemo(
    () =>
      Math.min(
        50000,
        Math.max(800, Math.round((region.latitudeDelta * 111000 * 0.6) / 500) * 500)
      ),
    [region.latitudeDelta]
  );
  const googlePlaces = useNearbyParking(searchCenter, searchRadius);

  // Bãi ĐỐI TÁC (Supabase) — có giá + đặt chỗ trong app.
  const { data: parkingLots } = useParkingLots();

  // Gộp bãi ĐỐI TÁC (đặt được) + bãi GOOGLE (chỉ chỉ đường); bỏ bãi Google trùng
  // vị trí (≤ 60m) với bãi đối tác để không hiện đôi. Khoảng cách tính từ vị trí tôi.
  const allPlaces = useMemo(() => {
    const partner = parkingLots.map((p) => ({
      ...p,
      distance: distanceTo(myLocation, p.coordinate),
    }));
    const extras = googlePlaces
      .filter((g) => !partner.some((p) => haversineMeters(p.coordinate, g.coordinate) < 60))
      .map((g) => ({ ...g, distance: distanceTo(myLocation, g.coordinate) }));
    return [...partner, ...extras];
  }, [myLocation, googlePlaces, parkingLots]);

  // Địa điểm đang chọn: ưu tiên tìm trong danh sách đã nạp; nếu vào từ màn khác
  // mà địa điểm chưa có (ví dụ bãi Google chưa lướt tới), dựng tạm từ tham số
  // focus để thẻ chỉ đường vẫn hiện.
  const selectedPlace = useMemo<Place | null>(() => {
    const found = allPlaces.find((p) => p.id === selectedId);
    if (found) return found;
    const lat = Number(params.focusLat);
    const lng = Number(params.focusLng);
    if (
      selectedId &&
      selectedId === params.focusId &&
      params.focusLat &&
      params.focusLng &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng)
    ) {
      const coordinate: LatLng = { latitude: lat, longitude: lng };
      return {
        id: selectedId,
        source: 'google',
        name: params.focusName ?? t('map.place'),
        coordinate,
        distance: distanceTo(myLocation, coordinate),
        image: '',
      };
    }
    return null;
  }, [allPlaces, selectedId, params.focusId, params.focusLat, params.focusLng, params.focusName, myLocation, t]);

  // Đích đang hiển thị trên thẻ chỉ đường: ưu tiên điểm tự chọn (tìm kiếm / nhấn
  // giữ), rồi tới bãi đỗ đang chọn. `id` null ⇒ điểm tự chọn (không có chi tiết).
  const target = useMemo(() => {
    if (customDest) {
      return {
        id: null as string | null,
        name: customDest.name,
        coordinate: customDest.coordinate,
        distance: distanceTo(myLocation, customDest.coordinate),
      };
    }
    if (selectedPlace) {
      return {
        id: selectedPlace.id,
        name: selectedPlace.name,
        coordinate: selectedPlace.coordinate,
        distance: selectedPlace.distance,
      };
    }
    return null;
  }, [customDest, selectedPlace, myLocation]);

  // Lọc theo ô tìm kiếm (không phân biệt dấu/hoa-thường) — áp cho cả pin lẫn danh sách.
  const query = normalize(search.trim());
  const visiblePlaces = useMemo(
    () =>
      query ? allPlaces.filter((p) => normalize(p.name).includes(query)) : allPlaces,
    [allPlaces, query]
  );

  // Viewport culling: chỉ những pin trong khung nhìn mới được vẽ → bản đồ nhẹ,
  // lướt mượt kể cả khi danh sách bãi đỗ lớn dần.
  const markersInView = useMemo(() => cullToRegion(visiblePlaces, region), [visiblePlaces, region]);

  // Chấm vị trí tự vẽ: bật tracksViewChanges lúc đầu để Android chụp được view,
  // rồi tắt để khỏi tốn frame khi lướt.
  const [trackMine, setTrackMine] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTrackMine(false), 1200);
    return () => clearTimeout(t);
  }, []);

  /** Bấm marker / danh sách: chỉ chọn + canh giữa để HIỆN địa điểm trong app.
   *  Việc dẫn đường (mở Google Maps) do thẻ "Chỉ đường" bên dưới đảm nhiệm. Tham
   *  chiếu ổn định (useCallback) để PlaceMarker memo không bị render lại khi lướt. */
  const focusPlace = useCallback((id: string, coordinate: LatLng) => {
    setCustomDest(null); // bỏ điểm tự chọn (nếu có) khi chọn một bãi đỗ
    setSelectedId(id);
    mapRef.current?.animateToRegion(
      {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      350
    );
  }, []);

  /** Nút định vị: về vị trí của tôi (xin lại quyền nếu chưa có). */
  function goToMyLocation() {
    setSelectedId(null);
    setCustomDest(null);
    if (!hasRealLocation) refresh();
    mapRef.current?.animateToRegion(
      { ...myLocation, latitudeDelta: 0.014, longitudeDelta: 0.014 },
      400
    );
  }

  function openPlace(id: string) {
    router.push({ pathname: '/parking/[id]', params: { id } });
  }

  /** Canh giữa một toạ độ bất kỳ (dùng cho điểm đích tự chọn). */
  const focusCoordinate = useCallback((coordinate: LatLng) => {
    mapRef.current?.animateToRegion(
      { ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      350
    );
  }, []);

  /**
   * Tìm kiếm: nếu khớp một bãi đã nạp thì chọn luôn; nếu không, geocode để tìm
   * ĐỊA ĐIỂM BẤT KỲ (tên/địa chỉ) rồi thả ghim đích để chỉ đường.
   */
  const handleSearchSubmit = useCallback(async () => {
    const q = search.trim();
    if (!q) return;
    const norm = normalize(q);
    const match = allPlaces.find((p) => normalize(p.name).includes(norm));
    if (match) {
      focusPlace(match.id, match.coordinate);
      return;
    }
    setSearching(true);
    // Thiên vị theo vị trí THẬT của tôi (nếu có), không thì theo tâm bản đồ đang
    // xem — để "one coffee" ra quán gần đây, không nhảy ra nước ngoài.
    const near: LatLng = location ?? { latitude: region.latitude, longitude: region.longitude };
    const found = await geocodePlace(q, near);
    setSearching(false);
    if (!found) {
      Alert.alert(t('map.notFoundTitle'), t('map.notFoundMsg', { q }));
      return;
    }
    setSelectedId(null);
    setCustomDest(found);
    focusCoordinate(found.coordinate);
  }, [search, allPlaces, focusPlace, focusCoordinate, t, location, region]);

  /** Nhấn giữ bản đồ: thả ghim đích tại điểm bất kỳ, tra tên địa chỉ để hiện thẻ. */
  const handleLongPress = useCallback(
    async (coordinate: LatLng) => {
      setSelectedId(null);
      setCustomDest({ coordinate, name: t('map.gettingAddress') });
      focusCoordinate(coordinate);
      const label = await describeCoordinate(coordinate);
      // Chỉ cập nhật nếu người dùng chưa chọn điểm khác trong lúc chờ.
      setCustomDest((cur) =>
        cur && cur.coordinate === coordinate
          ? { coordinate, name: label || t('map.selectedLocation') }
          : cur
      );
    },
    [focusCoordinate, t]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Bản đồ thật phủ nền */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialFocus ?? MAP_INITIAL_REGION}
        customMapStyle={isDark ? darkMapStyle : lightMapStyle}
        showsCompass={false}
        showsUserLocation={hasRealLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setRegion}
        onPress={() => {
          setSelectedId(null);
          setCustomDest(null);
        }}
        onLongPress={(e) => handleLongPress(e.nativeEvent.coordinate)}>
        {/* Pin các bãi đậu xe — đã lọc theo khung nhìn (viewport culling) */}
        {markersInView.map((place) => (
          <PlaceMarker
            key={place.id}
            id={place.id}
            name={place.name}
            coordinate={place.coordinate}
            active={place.id === selectedId}
            bookable={isBookable(place)}
            onPress={focusPlace}
            styles={styles}
          />
        ))}

        {/* Ghim điểm đích tự chọn (tìm kiếm / nhấn giữ) — phân biệt với pin bãi đỗ. */}
        {customDest ? (
          <Marker coordinate={customDest.coordinate} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.destPin}>
              <Ionicons name="location" size={40} color={Colors.navy} />
            </View>
          </Marker>
        ) : null}

        {/* Vị trí của tôi — chấm tự vẽ chỉ khi chưa có quyền (nếu có thì OS tự vẽ chấm xanh). */}
        {!hasRealLocation ? (
          <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={trackMine}>
            <View style={styles.myLocation}>
              <View style={styles.myLocationDot} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      {/* Lớp trên: tìm kiếm + filter */}
      <View style={styles.top}>
        <View style={styles.searchBar}>
          <Pressable onPress={handleSearchSubmit} hitSlop={8}>
            {searching ? (
              <ActivityIndicator size="small" color={Colors.green} />
            ) : (
              <Ionicons name="search" size={18} color={Colors.textMuted} />
            )}
          </Pressable>
          <TextInput
            style={styles.searchInput}
            placeholder={t('map.searchPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : (
            <Ionicons name="options-outline" size={20} color={Colors.green} />
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={t(f.labelKey)}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
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

      {/* Đích đang chọn (bãi đỗ HOẶC điểm tự chọn): thẻ thông tin + nút chỉ đường (mở Google Maps).
          Bãi đỗ thì bấm vùng thông tin mở chi tiết; điểm tự chọn thì không có chi tiết. */}
      {target ? (
        <View style={styles.directionsCard}>
          <Pressable
            style={({ pressed }) => [
              styles.directionsInfo,
              target.id != null && pressed && styles.locateBtnPressed,
            ]}
            onPress={target.id != null ? () => openPlace(target.id!) : undefined}
            disabled={target.id == null}
            hitSlop={6}>
            <Text style={styles.directionsName} numberOfLines={1}>
              {target.name.replace('Bãi đậu xe ', '')}
            </Text>
            <View style={styles.directionsMeta}>
              <Ionicons name="navigate-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.directionsDistance}>
                {t('map.distanceFromYou', { d: target.distance })}
              </Text>
              {target.id != null ? (
                <>
                  <Text style={styles.directionsDot}>·</Text>
                  <Text style={styles.directionsDetail}>{t('map.viewDetail')}</Text>
                  <Ionicons name="chevron-forward" size={13} color={Colors.green} />
                </>
              ) : null}
            </View>
          </Pressable>
          <Pressable
            onPress={() => openDirections(target.coordinate, target.name)}
            style={({ pressed }) => [styles.directionsBtn, pressed && styles.locateBtnPressed]}
            hitSlop={6}>
            <Ionicons name="navigate" size={18} color={Colors.white} />
            <Text style={styles.directionsBtnText}>{t('place.directions')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Bottom sheet tĩnh: danh sách gần bạn / kết quả tìm kiếm */}
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <SectionHeader
          title={query ? t('map.results', { n: visiblePlaces.length }) : t('map.nearYou')}
          onAction={query ? undefined : () => {}}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          {visiblePlaces.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>{t('map.noResults')}</Text>
            </View>
          ) : (
            visiblePlaces.map((place, i) => (
              <View key={place.id}>
                {i > 0 ? <View style={styles.separator} /> : null}
                <PlaceListItem
                  place={place}
                  onPress={() => focusPlace(place.id, place.coordinate)}
                />
              </View>
            ))
          )}
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
    // Bãi Google (chỉ chỉ đường): pin nền sáng, viền xanh để phân biệt với bãi đối tác.
    pinGoogle: {
      backgroundColor: Colors.surface,
      borderColor: Colors.green,
    },
    pinText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.white },
    pinTextGoogle: { color: Colors.green },
    // Ghim điểm đích tự chọn (tìm kiếm / nhấn giữ) — icon định vị nổi bật.
    destPin: { alignItems: 'center', justifyContent: 'center' },
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
    directionsDot: { color: Colors.textMuted },
    directionsDetail: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.green },
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
    empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing['2xl'] },
    emptyText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  });
