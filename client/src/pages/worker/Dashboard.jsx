import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardShell from '../../components/DashboardShell';
import JobCard from '../../components/JobCard';
import { acceptJob, listJobs } from '../../api/jobs';
import { fetchPaymentHistory } from '../../api/payments';
import { updateProfile } from '../../api/users';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';
import { DollarSign } from 'lucide-react';

export default function WorkerDashboard() {
  const { user, refreshMe } = useAuth();
  const [coords, setCoords] = useState(null);
  const [online, setOnline] = useState(!!user?.isAvailable);
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const syncLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Location not supported — enter jobs list to set coordinates manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          await updateProfile({
            location: { lat: latitude, lng: longitude },
          });
        } catch {
          /* non-fatal */
        }
      },
      () => toast.error('Allow location to see nearby jobs'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const loadLists = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const [openRes, payRes] = await Promise.all([
        listJobs({ lat: coords.lat, lng: coords.lng, radiusKm: 15 }),
        fetchPaymentHistory().catch(() => ({ success: false })),
      ]);
      if (openRes.success) {
        setJobs(openRes.data.jobs || []);
      }
      if (payRes.success) {
        setPayments(payRes.data.payments || []);
      }
      const mineRes = await listJobs({ mine: 1 });
      if (mineRes.success) {
        setMyJobs(mineRes.data.jobs || []);
      }
    } catch (e) {
      toast.error(e.userMessage || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [coords, user?._id]);

  useEffect(() => {
    setOnline(!!user?.isAvailable);
  }, [user?.isAvailable]);

  useEffect(() => {
    syncLocation();
  }, [syncLocation]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const activeJob = useMemo(
    () => myJobs.find((j) => ['assigned', 'in-progress'].includes(j.status)),
    [myJobs]
  );

  const completedRecent = useMemo(
    () =>
      myJobs
        .filter((j) => j.status === 'completed')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5),
    [myJobs]
  );

  const earnings = useMemo(() => {
    const now = new Date();
    const startDay = new Date(now);
    startDay.setHours(0, 0, 0, 0);
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - 7);

    let today = 0;
    let week = 0;
    let total = 0;
    payments.forEach((p) => {
      if (p.status !== 'completed') return;
      const amt = Number(p.workerEarning || p.amount * 0.85) || 0;
      const d = new Date(p.createdAt);
      total += amt;
      if (d >= startWeek) week += amt;
      if (d >= startDay) today += amt;
    });
    return { today, week, total };
  }, [payments]);

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    try {
      const res = await updateProfile({ isAvailable: next });
      if (res.success) {
        await refreshMe();
        toast.success(next ? 'You are online' : 'You are offline');
      } else {
        setOnline(!next);
        toast.error(res.message || 'Could not update');
      }
    } catch (e) {
      setOnline(!next);
      toast.error(e.userMessage || 'Could not update');
    }
  };

  const handleAccept = async (job) => {
    setBusyId(job._id);
    try {
      const res = await acceptJob(job._id);
      if (res.success) {
        toast.success('Job accepted');
        await loadLists();
      } else {
        toast.error(res.message || 'Could not accept');
      }
    } catch (e) {
      toast.error(e.userMessage || 'Could not accept');
    } finally {
      setBusyId(null);
    }
  };

  const nearbyFiltered = useMemo(() => {
    if (!activeJob) return jobs;
    return jobs.filter((j) => j._id !== activeJob._id);
  }, [jobs, activeJob]);

  return (
    <DashboardShell title="Worker">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 text-primary">
            <DollarSign className="h-5 w-5" />
            <h2 className="text-lg font-semibold text-ink">Earnings</h2>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted">Today</p>
              <p className="text-lg font-bold text-ink">${earnings.today.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">This week</p>
              <p className="text-lg font-bold text-ink">${earnings.week.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Total</p>
              <p className="text-lg font-bold text-ink">${earnings.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-ink">Availability</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted">{online ? 'Online' : 'Offline'}</span>
            <button
              type="button"
              onClick={toggleOnline}
              className={`relative h-8 w-14 rounded-full transition ${
                online ? 'bg-success' : 'bg-gray-300'
              }`}
              aria-pressed={online}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
                  online ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
          <button
            type="button"
            onClick={syncLocation}
            className="mt-4 text-xs font-semibold text-primary hover:underline"
          >
            Refresh GPS
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Nearby open jobs</h2>
        <Link
          to="/worker/jobs"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Browse all filters
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {nearbyFiltered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-muted">
              No open jobs in range. Try going online or expanding radius on the jobs page.
            </p>
          ) : (
            nearbyFiltered.slice(0, 6).map((j) => (
              <div key={j._id} className="relative">
                <JobCard job={j} showAccept compact onAccept={handleAccept} />
                {busyId === j._id ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink">My active job</h2>
        {activeJob ? (
          <div className="mt-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{activeJob.title}</p>
                <p className="mt-1 text-sm text-muted capitalize">{activeJob.status}</p>
                <p className="mt-2 text-sm text-muted">
                  Customer: {activeJob.customer?.name || '—'} · {activeJob.customer?.phone || '—'}
                </p>
              </div>
              <Link
                to={`/customer/track/${activeJob._id}`}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Open tracking
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No active delivery right now.</p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Recent completed</h2>
        <ul className="mt-3 space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          {completedRecent.length === 0 ? (
            <li className="text-sm text-muted">No completed jobs yet.</li>
          ) : (
            completedRecent.map((j) => (
              <li
                key={j._id}
                className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0"
              >
                <span className="text-sm font-medium text-ink">{j.title}</span>
                <span className="text-xs text-muted">{formatDate(j.updatedAt || j.createdAt)}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </DashboardShell>
  );
}
