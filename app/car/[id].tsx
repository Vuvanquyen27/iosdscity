import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { VehicleDetail } from '@/components/vehicle-detail';
import { useVehicle } from '@/hooks/use-catalog';
import { useThemeColors } from '@/hooks/use-theme';

/** Màn 6 — Thuê ô tô. */
export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicle, loading } = useVehicle(id);
  const Colors = useThemeColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator color={Colors.green} />
      </View>
    );
  }
  if (!vehicle) return null;
  return <VehicleDetail vehicle={vehicle} />;
}
