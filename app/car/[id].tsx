import { useLocalSearchParams } from 'expo-router';

import { VehicleDetail } from '@/components/vehicle-detail';
import { getVehicle, vehicles } from '@/data/mock';

/** Màn 6 — Thuê ô tô. */
export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = getVehicle(id) ?? vehicles.find((v) => v.kind === 'car')!;
  return <VehicleDetail vehicle={vehicle} />;
}
