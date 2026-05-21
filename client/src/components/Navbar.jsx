import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition ${isActive ? 'text-primary' : 'text-muted hover:text-ink'}`;

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            DW
          </span>
          <span className="text-lg font-semibold text-ink">Delivery Worker</span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
          <NavLink to="/maps" className={linkClass}>
            Maps
          </NavLink>
          <a href="#how" className="text-sm font-medium text-muted hover:text-ink">
            How it works
          </a>
          <a href="#features" className="text-sm font-medium text-muted hover:text-ink">
            Features
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to={
                  user.role === 'admin'
                    ? '/admin/panel'
                    : user.role === 'worker'
                      ? '/worker/dashboard'
                      : '/customer/dashboard'
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-ink transition hover:bg-gray-50 sm:px-4"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:px-4"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-gray-100 sm:px-4"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:px-4"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
