/**
 * DSCITY — Style bản đồ Google (react-native-maps `customMapStyle`).
 *
 * Chỉ áp dụng khi provider là Google (Android, hoặc iOS bản build có Google SDK).
 * Trên Apple Maps (iOS Expo Go) prop này bị bỏ qua — không sao.
 *
 * `darkMapStyle`: tông xanh-đen hợp với nền tối của app (Colors.bg dark).
 * `lightMapStyle`: rỗng = giữ style Google mặc định cho chế độ sáng.
 */

export const lightMapStyle: any[] = [];

export const darkMapStyle: any[] = [
  { elementType: 'geometry', stylers: [{ color: '#0e1521' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e1521' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2a3647' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#13322a' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#18212f' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0e1521' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2a3647' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0a0f1a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3b4a63' }],
  },
];
