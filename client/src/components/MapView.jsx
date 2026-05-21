import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { fetchRoute } from '../api/maps';
import { debugLog } from '../utils/debugLog';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapResizeHandler({ containerRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;
    const fix = () => map.invalidateSize({ animate: false });
    fix();
    const raf = requestAnimationFrame(fix);
    const t = setTimeout(fix, 200);
    const t2 = setTimeout(fix, 600);

    const el = containerRef?.current;
    let observer;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => fix());
      observer.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      clearTimeout(t2);
      observer?.disconnect();
    };
  }, [map, containerRef]);

  return null;
}

function MapViewController({ center, zoom, fitPoints, recenterMode = 'fit' }) {
  const map = useMap();
  const lastFitKeyRef = useRef('');

  useEffect(() => {
    if (!map || recenterMode === 'follow') return undefined;
    if (!fitPoints?.length) return undefined;
    const valid = fitPoints.filter((p) => p?.lat != null && p?.lng != null);
    if (!valid.length) return undefined;

    const fitKey = valid.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
    if (fitKey === lastFitKeyRef.current) return undefined;
    lastFitKeyRef.current = fitKey;

    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], zoom ?? map.getZoom(), { animate: true });
    } else {
      const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
    }

    const mc = map.getCenter();
    debugLog('H3', 'MapView.jsx:MapViewController', 'view synced (fit)', {
      fitKey,
      mapCenter: { lat: mc.lat, lng: mc.lng },
      propCenter: center ?? null,
    });
    return undefined;
  }, [map, fitPoints, zoom, recenterMode, center]);

  useEffect(() => {
    if (!map || !center?.lat || !center?.lng) return undefined;
    if (recenterMode !== 'follow' && fitPoints?.filter((p) => p?.lat != null).length >= 2) {
      return undefined;
    }
    map.setView([center.lat, center.lng], zoom ?? map.getZoom(), { animate: true });
    const mc = map.getCenter();
    debugLog('H3', 'MapView.jsx:MapViewController', 'view synced (center)', {
      recenterMode,
      mapCenter: { lat: mc.lat, lng: mc.lng },
      propCenter: center,
    });
    return undefined;
  }, [map, center?.lat, center?.lng, zoom, fitPoints, recenterMode]);

  return null;
}

function MapDebugProbe({ center, pickup, delivery, markers }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return undefined;
    const mc = map.getCenter();
    const size = map.getSize();
    debugLog('H3-H5', 'MapView.jsx:MapDebugProbe', 'map state vs props', {
      propCenter: center ?? null,
      mapCenter: { lat: mc.lat, lng: mc.lng },
      mapZoom: map.getZoom(),
      mapSize: { x: size.x, y: size.y },
      pickup: pickup ?? null,
      delivery: delivery ?? null,
      markerCount: markers?.length ?? 0,
    });
  }, [map, center, pickup, delivery, markers]);

  return null;
}

function RoutePolyline({ pickup, delivery }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map || !pickup?.lat || !pickup?.lng || !delivery?.lat || !delivery?.lng) {
      return undefined;
    }

    let cancelled = false;

    const clearLayer = () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };

    const drawFallback = () => {
      clearLayer();
      layerRef.current = L.polyline(
        [
          [pickup.lat, pickup.lng],
          [delivery.lat, delivery.lng],
        ],
        { color: '#2563eb', weight: 4, opacity: 0.65, dashArray: '10 10' }
      ).addTo(map);
      debugLog('H2', 'MapView.jsx:RoutePolyline', 'fallback straight line drawn', { pickup, delivery });
    };

    debugLog('H1-H2', 'MapView.jsx:RoutePolyline', 'fetching route via API', { pickup, delivery });

    (async () => {
      try {
        const coordinates = await fetchRoute(pickup, delivery);
        if (cancelled) return;
        clearLayer();
        const latlngs = coordinates.map((c) => [c.lat, c.lng]);
        layerRef.current = L.polyline(latlngs, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.85,
        }).addTo(map);
        debugLog('H2', 'MapView.jsx:RoutePolyline', 'route polyline drawn', {
          pointCount: latlngs.length,
        });
      } catch (err) {
        if (cancelled) return;
        debugLog('H2', 'MapView.jsx:RoutePolyline', 'route fetch failed', {
          error: err.message,
        });
        drawFallback();
      }
    })();

    return () => {
      cancelled = true;
      clearLayer();
    };
  }, [map, pickup?.lat, pickup?.lng, delivery?.lat, delivery?.lng]);

  return null;
}

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapView({
  center,
  zoom = 12,
  markers = [],
  height = '240px',
  mapContainerClassName = '',
  onMapClick,
  pickup,
  delivery,
  recenterMode = 'fit',
  mapKey,
}) {
  const wrapperRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const c = useMemo(() => {
    if (center?.lat != null && center?.lng != null) return center;
    if (pickup?.lat != null && pickup?.lng != null) return pickup;
    if (delivery?.lat != null && delivery?.lng != null) return delivery;
    return DEFAULT_CENTER;
  }, [center, pickup, delivery]);

  const fitPoints = useMemo(() => {
    const pts = [];
    if (pickup?.lat != null && pickup?.lng != null) pts.push(pickup);
    if (delivery?.lat != null && delivery?.lng != null) pts.push(delivery);
    for (const m of markers) {
      if (m?.lat != null && m?.lng != null) pts.push({ lat: m.lat, lng: m.lng });
    }
    return pts;
  }, [pickup, delivery, markers]);

  const instanceKey = mapKey ?? 'map-default';

  return (
    <div
      ref={wrapperRef}
      className={`relative h-full w-full min-h-0 overflow-hidden rounded-xl border border-gray-200 ${mapContainerClassName}`}
      style={{ height }}
    >
      {!mounted ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-muted">
          Loading map…
        </div>
      ) : (
      <MapContainer
        key={instanceKey}
        center={[c.lat, c.lng]}
        zoom={zoom}
        className="h-full w-full z-0"
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={OSM_TILE_URL}
        />
        <MapResizeHandler containerRef={wrapperRef} />
        <MapViewController center={c} zoom={zoom} fitPoints={fitPoints} recenterMode={recenterMode} />
        <ClickHandler onMapClick={onMapClick} />
        <MapDebugProbe center={c} pickup={pickup} delivery={delivery} markers={markers} />
        <RoutePolyline pickup={pickup} delivery={delivery} />
        {markers.map((m, i) => (
          <Marker key={m.id || i} position={[m.lat, m.lng]}>
            {m.label ? (
              <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent>
                {m.label}
              </Tooltip>
            ) : null}
          </Marker>
        ))}
      </MapContainer>
      )}
    </div>
  );
}