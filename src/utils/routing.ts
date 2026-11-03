export type LatLng = [number, number];

export interface RouteGeometry {
  points: LatLng[];
  cumulativeDistances: number[];
  totalDistance: number;
}

const routeCache = new Map<string, LatLng[]>();

export function getHaversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000;
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getBearing(p1: LatLng, p2: LatLng): number {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const dLng = ((p2[1] - p1[1]) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function buildRouteGeometry(points: LatLng[]): RouteGeometry {
  if (points.length < 2) {
    return {
      points,
      cumulativeDistances: [0],
      totalDistance: 0,
    };
  }

  const cumulativeDistances: number[] = [0];
  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dist = getHaversineDistance(points[i], points[i + 1]);
    total += dist;
    cumulativeDistances.push(total);
  }

  return {
    points,
    cumulativeDistances,
    totalDistance: total,
  };
}

export function getPositionAtDistance(
  route: RouteGeometry,
  dist: number
): { position: LatLng; bearing: number; segmentIndex: number } {
  const { points, cumulativeDistances, totalDistance } = route;

  if (points.length === 0) {
    return { position: [30.4215, -9.589], bearing: 0, segmentIndex: 0 };
  }
  if (points.length === 1 || dist <= 0) {
    const bearing = points.length > 1 ? getBearing(points[0], points[1]) : 0;
    return { position: points[0], bearing, segmentIndex: 0 };
  }
  if (dist >= totalDistance) {
    const lastIdx = points.length - 1;
    const bearing = getBearing(points[lastIdx - 1], points[lastIdx]);
    return { position: points[lastIdx], bearing, segmentIndex: lastIdx - 1 };
  }

  let seg = 0;
  while (
    seg < cumulativeDistances.length - 1 &&
    cumulativeDistances[seg + 1] < dist
  ) {
    seg++;
  }

  const dStart = cumulativeDistances[seg];
  const dEnd = cumulativeDistances[seg + 1];
  const segLength = dEnd - dStart;

  const ratio = segLength > 0 ? (dist - dStart) / segLength : 0;
  const p1 = points[seg];
  const p2 = points[seg + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * ratio;
  const lng = p1[1] + (p2[1] - p1[1]) * ratio;
  const bearing = getBearing(p1, p2);

  return {
    position: [lat, lng],
    bearing,
    segmentIndex: seg,
  };
}

function generateStreetGridFallback(from: LatLng, to: LatLng): LatLng[] {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;

  const midCorner1: LatLng = [lat1, (lng1 + lng2) / 2];
  const midCorner2: LatLng = [(lat1 + lat2) / 2, (lng1 + lng2) / 2];
  const midCorner3: LatLng = [lat2, (lng1 + lng2) / 2];

  const roughPoints: LatLng[] = [from, midCorner1, midCorner2, midCorner3, to];
  const detailed: LatLng[] = [];

  for (let i = 0; i < roughPoints.length - 1; i++) {
    const pA = roughPoints[i];
    const pB = roughPoints[i + 1];
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      const r = s / steps;
      detailed.push([pA[0] + (pB[0] - pA[0]) * r, pA[1] + (pB[1] - pA[1]) * r]);
    }
  }
  detailed.push(to);
  return detailed;
}

export async function fetchRoadRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const cacheKey = `${from[0].toFixed(5)},${from[1].toFixed(5)}->${to[0].toFixed(5)},${to[1].toFixed(5)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.routes?.[0]?.geometry?.coordinates?.length > 1) {
        const coords: LatLng[] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as LatLng
        );
        routeCache.set(cacheKey, coords);
        return coords;
      }
    }
  } catch (e) {
  }

  const fallback = generateStreetGridFallback(from, to);
  routeCache.set(cacheKey, fallback);
  return fallback;
}