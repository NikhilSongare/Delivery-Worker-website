import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardShell from '../../components/DashboardShell';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { listJobs } from '../../api/jobs';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';
import { Package, CheckCircle2, Wallet } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listJobs();
        if (!cancelled && res.success) {
          setJobs(res.data.jobs || []);
        }
      } catch (e) {
        if (!cancelled) toast.error(e.userMessage || 'Could not load jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const active = jobs.filter((j) =>
      ['open', 'assigned', 'in-progress'].includes(j.status)
    ).length;
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const spent = jobs
      .filter((j) => j.paymentStatus === 'paid')
      .reduce((s, j) => s + (Number(j.price) || 0), 0);
    return { active, completed, spent };
  }, [jobs]);

  return (
    <DashboardShell title="Customer">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">
          Hello {user?.name?.split(' ')[0] || 'there'}, ready to send something?
        </h1>
        <p className="mt-1 text-sm text-muted">Track deliveries and post new jobs in one place.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatsCard title="Active Jobs" value={loading ? '…' : stats.active} icon={Package} />
        <StatsCard title="Completed" value={loading ? '…' : stats.completed} icon={CheckCircle2} />
        <StatsCard
          title="Total Spent"
          value={loading ? '…' : `$${stats.spent.toFixed(2)}`}
          icon={Wallet}
        />
      </div>

      <div className="mt-8">
        <Link
          to="/customer/post-job"
          className="flex w-full items-center justify-center rounded-xl bg-accent py-4 text-center text-base font-semibold text-white shadow-lg shadow-accent/20 transition hover:opacity-95 sm:text-lg"
        >
          Post New Job
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Recent jobs</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No jobs yet. Post your first delivery.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Job ID</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">To</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pay</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.slice(0, 12).map((j) => (
                    <tr key={j._id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-mono text-xs text-ink">
                        {String(j._id).slice(-8).toUpperCase()}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-muted">
                        {j.pickupLocation?.address}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-muted">
                        {j.deliveryLocation?.address}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={j.paymentStatus} label={j.paymentStatus} />
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(j.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/customer/track/${j._id}`}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {j.paymentStatus === 'paid' ? 'Track' : 'View'}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
