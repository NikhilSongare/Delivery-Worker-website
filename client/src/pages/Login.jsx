import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login({ email: email.trim(), password });
      if (res.success) {
        toast.success('Welcome back!');
        const role = res.data.user.role;
        const dest =
          from ||
          (role === 'admin'
            ? '/admin/panel'
            : role === 'worker'
              ? '/worker/dashboard'
              : '/customer/dashboard');
        navigate(dest, { replace: true });
      } else {
        toast.error(res.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.userMessage || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page md:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-indigo-900 p-10 text-white md:flex lg:p-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white/70">Delivery Worker</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Ship smarter. Earn faster.</h1>
          <p className="mt-4 max-w-md text-white/80">
            Real-time tracking, verified couriers, and secure payments — built for modern cities.
          </p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
          <p className="text-sm text-white/90">
            “The cleanest delivery experience we have used for our retail partners.”
          </p>
          <p className="mt-3 text-xs text-white/60">— Operations lead, Metro Retail Co.</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 md:hidden">
            <p className="text-sm font-semibold text-primary">Delivery Worker</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Log in</h2>
          </div>
          <h2 className="hidden text-2xl font-bold text-ink md:block">Log in</h2>
          <p className="mt-2 text-sm text-muted">Access your dashboard to manage deliveries.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-ink">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => toast('Password reset is coming soon. Contact support for help.')}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            New here?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
