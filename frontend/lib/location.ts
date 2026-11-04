export interface SearchLocation {
  label: string;
  latitude: number;
  longitude: number;
}

export const MANUAL_LOCATIONS: SearchLocation[] = [
  { label: 'Levubu, Limpopo', latitude: -23.73, longitude: 30.17 },
  { label: 'Polokwane, Limpopo', latitude: -23.90, longitude: 29.45 },
  { label: 'Johannesburg, Gauteng', latitude: -26.20, longitude: 28.04 },
  { label: 'Pretoria, Gauteng', latitude: -25.75, longitude: 28.19 },
  { label: 'Zeerust, North West', latitude: -25.54, longitude: 26.08 },
  { label: 'Kroonstad, Free State', latitude: -27.65, longitude: 27.23 },
  { label: 'Bethal, Mpumalanga', latitude: -26.46, longitude: 29.47 },
  { label: 'Mbombela, Mpumalanga', latitude: -25.47, longitude: 30.97 },
  { label: 'Mooi River, KwaZulu-Natal', latitude: -29.21, longitude: 29.99 },
  { label: 'Durban, KwaZulu-Natal', latitude: -29.86, longitude: 31.02 },
  { label: 'Ceres, Western Cape', latitude: -33.37, longitude: 19.31 },
  { label: 'Cape Town, Western Cape', latitude: -33.93, longitude: 18.42 },
];

export function distanceInKm(
  from: Pick<SearchLocation, 'latitude' | 'longitude'>,
  to: Pick<SearchLocation, 'latitude' | 'longitude'>,
): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDifference = radians(to.latitude - from.latitude);
  const longitudeDifference = radians(to.longitude - from.longitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(longitudeDifference / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
