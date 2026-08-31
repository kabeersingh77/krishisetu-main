interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface Destination extends Location {
  quantity?: number;
  priority?: number;
  orderId?: string;
}

interface RouteStop extends Destination {
  stopOrder: number;
  distanceFromPrev: number;
  cumulativeDistance: number;
  estimatedArrival: number; // minutes from start
}

interface RouteResult {
  optimizedStops: RouteStop[];
  totalDistance: number;
  estimatedDuration: number;
  utilization: number;
  unoptimizedDistance: number;
  unoptimizedDuration: number;
  savings: {
    distance: number;
    time: number;
    distancePct: number;
    timePct: number;
  };
}

/**
 * Haversine formula to calculate distance between two lat/lng points in km
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

/**
 * Estimate travel time in minutes given distance in km
 * Accounts for: road factor (1.3x straight-line), average speed, stop time
 */
function estimateTravelTime(distanceKm: number, numStops: number = 0): number {
  const roadDistance = distanceKm * 1.3; // Road distance is ~1.3x straight-line
  const avgSpeedKmh = 35; // Average speed for delivery trucks in Indian roads
  const stopTimeMinutes = 15; // Average time per delivery stop
  return (roadDistance / avgSpeedKmh) * 60 + numStops * stopTimeMinutes;
}

/**
 * Calculate total route distance for a sequence of destinations (unoptimized order)
 */
function calculateRouteDistance(origin: Location, destinations: Destination[]): number {
  let total = 0;
  let current = origin;
  for (const dest of destinations) {
    total += haversineDistance(current.lat, current.lng, dest.lat, dest.lng);
    current = dest;
  }
  return total;
}

/**
 * Nearest-Neighbor Heuristic with Priority and Capacity Constraints
 * 
 * Algorithm:
 * 1. Start at origin
 * 2. Sort unvisited destinations by a composite score:
 *    - Distance (weighted 0.7) - closer is better
 *    - Priority (weighted 0.3) - higher priority first
 * 3. Pick the best scoring destination
 * 4. Track cumulative load against vehicle capacity
 * 5. Repeat until all destinations are visited or capacity is reached
 * 6. Calculate savings vs. naive sequential order
 */
export function optimizeRoute(
  origin: Location,
  destinations: Destination[],
  vehicleCapacity: number = 1000
): RouteResult {
  if (destinations.length === 0) {
    return {
      optimizedStops: [],
      totalDistance: 0,
      estimatedDuration: 0,
      utilization: 0,
      unoptimizedDistance: 0,
      unoptimizedDuration: 0,
      savings: { distance: 0, time: 0, distancePct: 0, timePct: 0 }
    };
  }

  // Calculate unoptimized (naive sequential) route
  const unoptimizedDistance = calculateRouteDistance(origin, destinations);
  const unoptimizedDuration = estimateTravelTime(unoptimizedDistance, destinations.length);

  // Nearest-neighbor with priority weighting
  const unvisited = destinations.map((d, i) => ({ ...d, originalIndex: i }));
  const optimizedStops: RouteStop[] = [];
  let currentLat = origin.lat;
  let currentLng = origin.lng;
  let totalDistance = 0;
  let totalLoad = 0;
  let stopOrder = 0;

  while (unvisited.length > 0) {
    // Calculate composite scores for all unvisited destinations
    const scores = unvisited.map(dest => {
      const dist = haversineDistance(currentLat, currentLng, dest.lat, dest.lng);
      const maxDist = Math.max(...unvisited.map(d => haversineDistance(currentLat, currentLng, d.lat, d.lng)), 1);
      const normalizedDist = dist / maxDist; // 0 = closest, 1 = farthest
      const normalizedPriority = dest.priority ? (1 - dest.priority / 10) : 0.5; // Higher priority = lower score
      
      // Composite score (lower = better)
      return {
        dest,
        dist,
        score: normalizedDist * 0.7 + normalizedPriority * 0.3
      };
    });

    // Sort by composite score (lower is better)
    scores.sort((a, b) => a.score - b.score);
    const best = scores[0];

    // Check capacity constraint
    const destLoad = best.dest.quantity || 0;
    if (vehicleCapacity > 0 && totalLoad + destLoad > vehicleCapacity) {
      // Skip this destination if it would exceed capacity
      const idx = unvisited.indexOf(best.dest);
      if (idx > -1) unvisited.splice(idx, 1);
      continue;
    }

    totalLoad += destLoad;
    totalDistance += best.dist;
    stopOrder++;

    optimizedStops.push({
      ...best.dest,
      stopOrder,
      distanceFromPrev: Math.round(best.dist * 10) / 10,
      cumulativeDistance: Math.round(totalDistance * 10) / 10,
      estimatedArrival: Math.round(estimateTravelTime(totalDistance, stopOrder))
    });

    currentLat = best.dest.lat;
    currentLng = best.dest.lng;

    const idx = unvisited.indexOf(best.dest);
    if (idx > -1) unvisited.splice(idx, 1);
  }

  const optimizedDuration = estimateTravelTime(totalDistance, optimizedStops.length);

  // Calculate savings
  const distanceSaved = unoptimizedDistance - totalDistance;
  const timeSaved = unoptimizedDuration - optimizedDuration;

  return {
    optimizedStops,
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedDuration: Math.round(optimizedDuration),
    utilization: vehicleCapacity > 0 ? Math.round((totalLoad / vehicleCapacity) * 100) / 100 : 0,
    unoptimizedDistance: Math.round(unoptimizedDistance * 10) / 10,
    unoptimizedDuration: Math.round(unoptimizedDuration),
    savings: {
      distance: Math.round(Math.max(0, distanceSaved) * 10) / 10,
      time: Math.round(Math.max(0, timeSaved)),
      distancePct: unoptimizedDistance > 0 ? Math.round(Math.max(0, distanceSaved / unoptimizedDistance * 100)) : 0,
      timePct: unoptimizedDuration > 0 ? Math.round(Math.max(0, timeSaved / unoptimizedDuration * 100)) : 0
    }
  };
}
