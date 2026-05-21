import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Package, Phone, Truck, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getJob, updateJobStatus } from '../api/jobs';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { formatDate } from '../utils/formatDate';
import MapView from '../components/MapView';
import { debugLog } from '../utils/debugLog';

export default function TrackJob() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const socket = useSocket(!!user && !!jobId);
  const emitTimer = useRef(null);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workerPos, setWorkerPos] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getJob(jobId);
      if (res.success) setJob(res.data.job);
      else toast.error(res.message || 'Could not load job');
    } catch (e) {
      toast.error(e.userMessage || 'Could not load job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !jobId || !job) return undefined;

    const onLoc = (payload) => {
      if (payload.jobId === jobId) {
        setWorkerPos({ lat: payload.lat, lng: payload.lng });
      }
    };
    const onStatus = (payload) => {
      if (payload.jobId === jobId) {
        void load();
      }
    };

    socket.emit('join-job-room', { jobId });
    socket.on('location-update', onLoc);
    socket.on('status-change', onStatus);
    return () => {
      socket.off('location-update', onLoc);
      socket.off('status-change', onStatus);
    };
  }, [jobId, job, load, socket]);

  const isWorker = user && job?.worker && String(job.worker._id || job.worker) === String(user._id);

  useEffect(() => {
    if (!isWorker || !jobId || !socket) return undefined;

    emitTimer.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          socket.emit('location-update', {
            jobId,
            lat: latitude,
            lng: longitude,
          });
          setWorkerPos({ lat: latitude, lng: longitude });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 }
      );
    }, 5000);

    return () => clearInterval(emitTimer.current);
  }, [isWorker, jobId, socket]);

  const pickup = job?.pickupLocation?.coordinates?.coordinates;
  const delivery = job?.deliveryLocation?.coordinates?.coordinates;

  useEffect(() => {
    if (!job) return;
    debugLog('H4', 'TrackJob.jsx:coords', 'job coordinates loaded', {
      pickupRaw: pickup ?? null,
      deliveryRaw: delivery ?? null,
      pickupLocKeys: job.pickupLocation ? Object.keys(job.pickupLocation) : [],
      coordNest: job.pickupLocation?.coordinates
        ? Object.keys(job.pickupLocation.coordinates)
        : [],
    });
  }, [job, pickup, delivery]);

  const pickupPt = useMemo(
    () => (pickup?.length === 2 ? { lat: pickup[1], lng: pickup[0] } : null),
    [pickup]
  );
  const deliveryPt = useMemo(
    () => (delivery?.length === 2 ? { lat: delivery[1], lng: delivery[0] } : null),
    [delivery]
  );

  const center = useMemo(() => {
    if (workerPos) return workerPos;
    if (pickupPt) return pickupPt;
    return { lat: 20.5937, lng: 78.9629 };
  }, [workerPos, pickupPt]);

  const markers = useMemo(() => {
    const m = [];
    if (pickup?.length === 2) {
      m.push({
        id: 'pickup',
        lat: pickup[1],
        lng: pickup[0],
        label: 'P',
      });
    }
    if (delivery?.length === 2) {
      m.push({
        id: 'drop',
        lat: delivery[1],
        lng: delivery[0],
        label: 'D',
      });
    }
    if (workerPos) {
      m.push({
        id: 'worker',
        lat: workerPos.lat,
        lng: workerPos.lng,
        label: 'W',
      });
    }
    return m;
  }, [pickup, delivery, workerPos]);

  const steps = useMemo(
    () => [
      {
        key: 'posted',
        label: 'Posted',
        done: !!job?.timeline?.postedAt || !!job?.createdAt,
        at: job?.timeline?.postedAt || job?.createdAt,
        icon: Package,
      },
      {
        key: 'worker',
        label: 'Worker found',
        done: !!job?.timeline?.workerFoundAt,
        at: job?.timeline?.workerFoundAt,
        icon: UserIcon,
      },
      {
        key: 'pickup',
        label: 'Picked up',
        done: !!job?.timeline?.pickedUpAt,
        at: job?.timeline?.pickedUpAt,
        icon: Truck,
      },
      {
        key: 'delivered',
        label: 'Delivered',
        done: !!job?.timeline?.deliveredAt,
        at: job?.timeline?.deliveredAt,
        icon: CheckCircle2,
      },
    ],
    [job]
  );

  const workerUser = job?.worker && typeof job.worker === 'object' ? job.worker : null;

  const handleStatus = async (status) => {
    setActionBusy(true);
    try {
      const res = await updateJobStatus(jobId, status);
      if (res.success) {
        toast.success(status === 'picked-up' ? 'Marked picked up' : 'Delivery completed');
        setJob(res.data.job);
      } else {
        toast.error(res.message || 'Update failed');
      }
    } catch (e) {
      toast.error(e.userMessage || 'Update failed');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-page">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-page px-4">
        <p className="text-muted">Job not found or access denied.</p>
        <Link to="/" className="text-primary font-semibold">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link to={user?.role === 'worker' ? '/worker/dashboard' : '/customer/dashboard'} className="text-sm font-semibold text-primary">
          ← Back
        </Link>
        <span className="text-xs font-mono text-muted">{String(job._id).slice(-8).toUpperCase()}</span>
      </div>

      <div className="h-[60vh] min-h-[220px] w-full shrink-0 bg-gray-100">
        <MapView
          mapKey={jobId}
          center={center}
          zoom={12}
          height="100%"
          markers={markers}
          recenterMode={workerPos ? 'follow' : 'fit'}
          pickup={pickupPt}
          delivery={deliveryPt}
        />
      </div>

      <div className="flex min-h-[40vh] flex-col border-t border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">ETA</p>
              <p className="text-lg font-bold text-ink">
                ~{job.estimatedTime || '—'} min remaining
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
              {job.status?.replace('-', ' ')}
            </span>
          </div>
        </div>

        {workerUser ? (
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink">{workerUser.name}</p>
              <p className="text-sm text-muted">{workerUser.rating?.toFixed?.(1) || '—'}★ rating</p>
            </div>
            <a
              href={`tel:${workerUser.phone || ''}`}
              className="rounded-full border border-gray-200 p-2 text-primary hover:bg-gray-50"
              aria-label="Call worker"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>
        ) : (
          <div className="border-b border-gray-100 px-4 py-4 text-sm text-muted">
            Waiting for a worker to accept this job.
          </div>
        )}

        {isWorker && job.status === 'assigned' ? (
          <div className="px-4 py-3">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => handleStatus('picked-up')}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {actionBusy ? 'Updating…' : 'Mark picked up'}
            </button>
          </div>
        ) : null}
        {isWorker && job.status === 'in-progress' ? (
          <div className="px-4 py-3">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => handleStatus('delivered')}
              className="w-full rounded-xl bg-success py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {actionBusy ? 'Updating…' : 'Mark delivered'}
            </button>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-sm font-semibold text-ink">Status timeline</p>
          <ol className="mt-4 space-y-4">
            {steps.map((s) => (
              <li key={s.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      s.done ? 'bg-success/15 text-success' : 'bg-gray-100 text-muted'
                    }`}
                  >
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="mt-1 h-full w-px flex-1 bg-gray-200 last:hidden" />
                </div>
                <div className="pb-4">
                  <p className="font-medium text-ink">{s.label}</p>
                  <p className="text-xs text-muted">{s.at ? formatDate(s.at) : 'Pending'}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
