function priceFromDistanceKm(km) {
  const base = 5;
  const perKm = 1.8;
  const minimum = 9.99;
  const raw = base + Math.max(0, km) * perKm;
  return Math.round(Math.max(minimum, raw) * 100) / 100;
}

module.exports = { priceFromDistanceKm };
