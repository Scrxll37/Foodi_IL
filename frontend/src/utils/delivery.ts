import { Restaurant } from "../types";

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface DeliveryCalculation {
  distanceKm: number;
  transitMinutes: number;
  prepMinutes: number;
  totalMinutes: number;
  formattedTime: string;
}

export function getNearestBranchInfo(
  restaurant: Restaurant,
  userLat: number = 30.4278,
  userLng: number = -9.5981
): DeliveryCalculation {
  const prep = restaurant.avgPrepMinutes || 12;
  let minDistance = Infinity;

  if (restaurant.branches && restaurant.branches.length > 0) {
    for (const branch of restaurant.branches) {
      const d = calculateDistanceKm(userLat, userLng, branch.lat, branch.lng);
      if (d < minDistance) {
        minDistance = d;
      }
    }
  } else {
    const lat = restaurant.lat ?? 30.42;
    const lng = restaurant.lng ?? -9.59;
    minDistance = calculateDistanceKm(userLat, userLng, lat, lng);
  }

  const transit = Math.max(3, Math.round(minDistance * 2.5));
  const total = prep + transit;

  return {
    distanceKm: Math.round(minDistance * 10) / 10,
    transitMinutes: transit,
    prepMinutes: prep,
    totalMinutes: total,
    formattedTime: `${total}'`
  };
}
