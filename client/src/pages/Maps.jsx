import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function Maps() {
  useEffect(() => {
    const map = L.map('map', {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer(TILE_URL, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.marker(DEFAULT_CENTER).addTo(map).bindPopup('Delivery Worker map preview');

    const fixSize = () => map.invalidateSize();
    requestAnimationFrame(fixSize);
    const t = setTimeout(fixSize, 200);

    return () => {
      clearTimeout(t);
      map.remove();
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-ink">Maps</h1>
          <p className="mt-1 text-sm text-muted">
            OpenStreetMap preview — no Google API required.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div id="map" />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/customer/post-job" className="font-semibold text-primary hover:underline">
            Post a job
          </Link>
          {' · '}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Home
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
