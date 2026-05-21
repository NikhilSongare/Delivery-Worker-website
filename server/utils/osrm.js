const axios = require('axios');

const OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1/driving';

function haversineKm(pickup, delivery) {
  const dx = pickup.lng - delivery.lng;
  const dy = pickup.lat - delivery.lat;
  const approxKm = Math.sqrt(dx * dx + dy * dy) * 111;
  return Math.max(0.5, Math.round(approxKm * 100) / 100);
}

async function fetchRouteMetrics(pickup, delivery) {
  const coordsPath = `${pickup.lng},${pickup.lat};${delivery.lng},${delivery.lat}`;
  const url = `${OSRM_ROUTE_URL}/${coordsPath}`;
  const { data } = await axios.get(url, {
    params: { overview: 'false' },
    timeout: 12000,
  });

  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(data.message || 'Routing unavailable');
  }

  const route = data.routes[0];
  return {
    distanceKm: Math.round((route.distance / 1000) * 100) / 100,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
  };
}

async function fetchRouteMetricsWithFallback(pickup, delivery) {
  try {
    return await fetchRouteMetrics(pickup, delivery);
  } catch {
    const distanceKm = haversineKm(pickup, delivery);
    return {
      distanceKm,
      durationMin: Math.max(5, Math.round(distanceKm * 3)),
    };
  }
}

module.exports = { fetchRouteMetrics, fetchRouteMetricsWithFallback, haversineKm };
