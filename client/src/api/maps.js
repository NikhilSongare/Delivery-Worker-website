import api from './axiosConfig';

export async function fetchRoute(pickup, delivery) {
  const res = await api.get('/maps/route', {
    params: {
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      deliveryLat: delivery.lat,
      deliveryLng: delivery.lng,
    },
  });
  const body = res.data;
  if (!body?.success || !body?.data?.coordinates) {
    throw new Error(body?.message || 'Route fetch failed');
  }
  return body.data.coordinates;
}
