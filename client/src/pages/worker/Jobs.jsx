import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { LayoutGrid, List, Search } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import JobCard from '../../components/JobCard';
import MapView from '../../components/MapView';
import { acceptJob, listJobs } from '../../api/jobs';
import { updateProfile } from '../../api/users';
import { formatRelativeTime } from '../../utils/formatDate';

export default function WorkerJobs() {
  const [coords, setCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState(8);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500);
  const [pkg, setPkg] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const pageSize = 6;

  const syncLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          await updateProfile({ location: { lat: latitude, lng: longitude } });
        } catch {
          /* optional */
        }
      },
      () => toast.error('Allow location to browse nearby jobs'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const load = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await listJobs({
        lat: coords.lat,
        lng: coords.lng,
        radiusKm,
      });
      if (res.success) {
        setJobs(res.data.jobs || []);
        setPage(1);
      } else {
        toast.error(res.message || 'Failed to load');
      }
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [coords, radiusKm]);

  useEffect(() => {
    syncLocation();
  }, [syncLocation]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const p = Number(j.price) || 0;
      if (p < priceMin || p > priceMax) return false;
      if (pkg !== 'all' && j.packageSize !== pkg) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const blob = `${j.title} ${j.pickupLocation?.address} ${j.deliveryLocation?.address}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, priceMin, priceMax, pkg, search]);

  const slice = useMemo(() => {
    return filtered.slice(0, page * pageSize);
  }, [filtered, page]);

  const handleAccept = async (job) => {
    setBusyId(job._id);
    try {
      const res = await acceptJob(job._id);
      if (res.success) {
        toast.success('Job accepted');
        setSelected(null);
        await load();
      } else {
        toast.error(res.message || 'Could not accept');
      }
    } catch (e) {
      toast.error(e.userMessage || 'Could not accept');
    } finally {
      setBusyId(null);
    }
  };

  const previewMarkers = useMemo(() => {
    if (!selected) return [];
    const p = selected.pickupLocation?.coordinates?.coordinates;
    const d = selected.deliveryLocation?.coordinates?.coordinates;
    const m = [];
    if (p?.length === 2) m.push({ id: 'p', lat: p[1], lng: p[0], label: 'P' });
    if (d?.length === 2) m.push({ id: 'd', lat: d[1], lng: d[0], label: 'D' });
    return m;
  }, [selected]);

  const previewCenter = useMemo(() => {
    if (!previewMarkers.length) return null;
    const lat = previewMarkers.reduce((s, x) => s + x.lat, 0) / previewMarkers.length;
    const lng = previewMarkers.reduce((s, x) => s + x.lng, 0) / previewMarkers.length;
    return { lat, lng };
  }, [previewMarkers]);

  return (
    <DashboardShell title="Open jobs">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Search title or area…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`rounded-lg border px-3 py-2 ${view === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`rounded-lg border px-3 py-2 ${view === 'list' ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200'}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-muted">Radius: {radiusKm} km</label>
            <input
              type="range"
              min={1}
              max={20}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="mt-1 w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Min price ($)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              value={priceMin}
              min={0}
              onChange={(e) => setPriceMin(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Max price ($)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              value={priceMax}
              min={0}
              onChange={(e) => setPriceMax(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Package</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              value={pkg}
              onChange={(e) => setPkg(e.target.value)}
            >
              <option value="all">All sizes</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={syncLocation}
          className="mt-3 text-xs font-semibold text-primary hover:underline"
        >
          Refresh location
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div
          className={
            view === 'grid' ? 'mt-6 grid gap-4 sm:grid-cols-2' : 'mt-6 space-y-3'
          }
        >
          {slice.map((j) => (
            <JobCard
              key={j._id}
              job={j}
              onSelect={setSelected}
              showAccept={false}
            />
          ))}
        </div>
      )}

      {slice.length < filtered.length ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gray-50"
          >
            Load more
          </button>
        </div>
      ) : null}

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-ink">{selected.title}</h3>
                <p className="text-xs text-muted">{formatRelativeTime(selected.createdAt)}</p>
              </div>
              <button
                type="button"
                className="text-sm text-muted hover:text-ink"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm text-muted">
              <p>
                <span className="font-semibold text-ink">Pickup:</span>{' '}
                {selected.pickupLocation?.address}
              </p>
              <p>
                <span className="font-semibold text-ink">Drop:</span>{' '}
                {selected.deliveryLocation?.address}
              </p>
              <p>
                <span className="font-semibold text-ink">Distance:</span> {selected.distance} km ·{' '}
                <span className="font-semibold text-ink">Price:</span> $
                {Number(selected.price).toFixed(2)}
              </p>
              <p className="capitalize">
                <span className="font-semibold text-ink">Package:</span> {selected.packageSize}
              </p>
              {previewCenter ? (
                <MapView
                  mapKey={selected._id}
                  center={previewCenter}
                  markers={previewMarkers}
                  height="200px"
                  zoom={11}
                />
              ) : null}
              <button
                type="button"
                disabled={busyId === selected._id}
                onClick={() => handleAccept(selected)}
                className="mt-2 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busyId === selected._id ? 'Accepting…' : 'Accept job'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
