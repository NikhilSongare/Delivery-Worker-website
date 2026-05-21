import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function DashboardShell({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="text-sm font-semibold text-primary">
            Delivery Worker
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {title ? (
              <span className="hidden text-sm font-medium text-muted sm:inline">{title}</span>
            ) : null}
            <button
              type="button"
              className="rounded-lg p-2 text-muted hover:bg-gray-100"
              aria-label="Notifications"
              onClick={() => toast('No new notifications')}
            >
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="h-4 w-4" />
              </span>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink sm:block">
                {user?.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
                toast.success('Logged out');
              }}
              className="rounded-lg p-2 text-muted hover:bg-gray-100"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
