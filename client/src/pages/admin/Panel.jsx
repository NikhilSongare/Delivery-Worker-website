import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  cancelAdminJob,
  fetchAdminDashboard,
  fetchAdminJobs,
  fetchAdminPayments,
  fetchAdminUsers,
  patchAdminUser,
} from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const PIE_COLORS = ['#6C63FF', '#FF6B35', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'payments', label: 'Payments' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

export default function AdminPanel() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [dash, setDash] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [jobStatus, setJobStatus] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminDashboard();
      if (res.success) setDash(res.data);
      else toast.error(res.message || 'Failed');
    } catch (e) {
      toast.error(e.userMessage || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers({
        search: userSearch || undefined,
        role: userRole || undefined,
      });
      if (res.success) setUsers(res.data.users || []);
      else toast.error(res.message || 'Failed');
    } catch (e) {
      toast.error(e.userMessage || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminJobs({ status: jobStatus || undefined });
      if (res.success) setJobs(res.data.jobs || []);
      else toast.error(res.message || 'Failed');
    } catch (e) {
      toast.error(e.userMessage || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminPayments();
      if (res.success) setPayments(res.data.payments || []);
      else toast.error(res.message || 'Failed');
    } catch (e) {
      toast.error(e.userMessage || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'users') loadUsers();
    if (tab === 'jobs') loadJobs();
    if (tab === 'payments') loadPayments();
  }, [tab]);

  const pieData = useMemo(
    () =>
      (dash?.jobStatusBreakdown || []).map((s) => ({
        name: s.status,
        value: s.count,
      })),
    [dash]
  );

  const lineData = useMemo(() => dash?.jobsOverTime || [], [dash]);

  const toggleUser = async (u) => {
    try {
      const res = await patchAdminUser(u._id, { isActive: !u.isActive });
      if (res.success) {
        toast.success(u.isActive ? 'User banned' : 'User activated');
        loadUsers();
      } else {
        toast.error(res.message || 'Failed');
      }
    } catch (e) {
      toast.error(e.userMessage || 'Failed');
    }
  };

  const cancelJob = async (id) => {
    try {
      const res = await cancelAdminJob(id);
      if (res.success) {
        toast.success('Job cancelled');
        loadJobs();
      } else {
        toast.error(res.message || 'Failed');
      }
    } catch (e) {
      toast.error(e.userMessage || 'Failed');
    }
  };

  return (
    <div className="min-h-dvh bg-page lg:flex">
      <aside className="border-b border-gray-200 bg-white lg:w-56 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <Link to="/" className="font-semibold text-primary">
            DW Admin
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="text-xs font-semibold text-muted hover:text-ink lg:mt-4 lg:block"
          >
            Log out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:px-3 lg:pb-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition lg:w-full ${
                tab === item.id ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
        {tab === 'dashboard' ? (
          <div>
            <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
            {loading ? (
              <div className="mt-10 flex justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Total users', value: dash?.kpis?.totalUsers ?? '—' },
                    { label: 'Jobs today', value: dash?.kpis?.jobsToday ?? '—' },
                    {
                      label: 'Revenue today',
                      value: `$${Number(dash?.kpis?.revenueToday || 0).toFixed(2)}`,
                    },
                    { label: 'Active workers', value: dash?.kpis?.activeWorkers ?? '—' },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-sm text-muted">{k.label}</p>
                      <p className="mt-2 text-2xl font-bold text-ink">{k.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-ink">Jobs over time (30d)</p>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineData}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="jobs" stroke="#6C63FF" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-ink">Job status breakdown</p>
                    <div className="mt-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {tab === 'users' ? (
          <div>
            <h1 className="text-2xl font-bold text-ink">Users</h1>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search name, email, phone"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="customer">Customer</option>
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={loadUsers}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Search
              </button>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td className="px-4 py-3 font-medium">{u.name}</td>
                          <td className="px-4 py-3 text-muted">{u.email}</td>
                          <td className="px-4 py-3 capitalize">{u.role}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={u.isActive ? 'completed' : 'cancelled'} label={u.isActive ? 'Active' : 'Banned'} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleUser(u)}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              {u.isActive ? 'Ban' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'jobs' ? (
          <div>
            <h1 className="text-2xl font-bold text-ink">Jobs</h1>
            <div className="mt-4 flex flex-wrap gap-3">
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={jobStatus}
                onChange={(e) => setJobStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                type="button"
                onClick={loadJobs}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-3">Job</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Pay</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {jobs.map((j) => (
                        <tr key={j._id}>
                          <td className="max-w-[180px] truncate px-4 py-3">{j.title}</td>
                          <td className="px-4 py-3 text-muted">{j.customer?.email}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={j.status} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={j.paymentStatus} label={j.paymentStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => cancelJob(j._id)}
                              className="text-xs font-semibold text-error hover:underline"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'payments' ? (
          <div>
            <h1 className="text-2xl font-bold text-ink">Payments</h1>
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Stripe intent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((p) => (
                        <tr key={p._id}>
                          <td className="px-4 py-3 font-semibold">
                            ${Number(p.amount).toFixed(2)} {p.currency?.toUpperCase()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-4 py-3 text-muted">{formatDate(p.createdAt)}</td>
                          <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-muted">
                            {p.stripePaymentIntentId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'reports' ? (
          <div>
            <h1 className="text-2xl font-bold text-ink">Reports</h1>
            <p className="mt-2 text-sm text-muted">
              Export and scheduled reports can plug into this view. For now, use the Dashboard charts
              for operational snapshots.
            </p>
          </div>
        ) : null}

        {tab === 'settings' ? (
          <div>
            <h1 className="text-2xl font-bold text-ink">Settings</h1>
            <p className="mt-2 text-sm text-muted">
              Configure platform fees, email templates, and integrations from this section in a future
              iteration.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
