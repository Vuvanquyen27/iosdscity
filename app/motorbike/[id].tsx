import { useLocalSearchParams } from 'expo-router';

import { VehicleDetail } from '@/components/vehicle-detail';
import { getVehicle, vehicles } from '@/data/mock';

/** Màn 7 — Thuê xe máy. */
export default function MotorbikeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = getVehicle(id) ?? vehicles.find((v) => v.kind === 'motorbike')!;
  return <VehicleDetail vehicle={vehicle} />;
}
