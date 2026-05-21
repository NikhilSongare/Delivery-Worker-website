import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = location.state?.defaultRole === 'worker' ? 'worker' : 'customer';

  const [role, setRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('bike');
  const [terms, setTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!terms) {
      toast.error('Please accept the terms to continue');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        vehicleType: role === 'worker' ? vehicleType : undefined,
      };
      const res = await signup(payload);
      if (res.success) {
        toast.success('Account created!');
        const r = res.data.user.role;
        navigate(
          r === 'worker' ? '/worker/dashboard' : '/customer/dashboard',
          { replace: true }
        );
      } else {
        toast.error(res.message || 'Signup failed');
      }
    } catch (err) {
      toast.error(err.userMessage || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-page md:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-accent via-orange-500 to-rose-600 p-10 text-white md:flex lg:p-14">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">Join the network</p>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Start in minutes</h1>
          <p className="mt-4 max-w-md text-white/90">
            Whether you are sending parcels or completing routes, we keep every trip transparent and
            secure.
          </p>
        </div>
        <div className="rounded-2xl border border-white/25 bg-black/10 p-6 backdrop-blur">
          <p className="text-3xl font-bold">4.8★</p>
          <p className="mt-1 text-sm text-white/80">Average satisfaction across metro deliveries</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          <h2 className="text-2xl font-bold text-ink md:mt-0">Create your account</h2>
          <p className="mt-2 text-sm text-muted">Choose how you want to use Delivery Worker.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`rounded-xl border-2 p-4 text-left transition ${
                role === 'customer'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-ink">Customer</p>
              <p className="mt-1 text-xs text-muted">Send packages & track deliveries</p>
            </button>
            <button
              type="button"
              onClick={() => setRole('worker')}
              className={`rounded-xl border-2 p-4 text-left transition ${
                role === 'worker'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-ink">Worker</p>
              <p className="mt-1 text-xs text-muted">Accept nearby jobs & earn</p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Phone</label>
              <input
                type="tel"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            {role === 'worker' ? (
              <div>
                <label className="text-sm font-medium text-ink">Vehicle type</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="bike">Bicycle / e-bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                </select>
                <p className="mt-1 text-xs text-muted">
                  ID proof upload can be added from your profile later.
                </p>
              </div>
            ) : null}
            <div>
              <label className="text-sm font-medium text-ink">Password</label>
              <input
                type="password"
                minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
