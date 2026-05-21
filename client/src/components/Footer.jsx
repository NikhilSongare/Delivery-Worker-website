import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold text-ink">Delivery Worker</p>
            <p className="mt-2 text-sm text-muted">
              Fast, reliable local deliveries powered by verified workers near you.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href="#features" className="hover:text-primary">
                  Features
                </a>
              </li>
              <li>
                <Link to="/signup" className="hover:text-primary">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a href="#how" className="hover:text-primary">
                  How it works
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary">
                  Login
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Social</p>
            <div className="mt-3 flex gap-3 text-muted">
              <a href="https://twitter.com" className="hover:text-primary" aria-label="Twitter">
                𝕏
              </a>
              <a href="https://linkedin.com" className="hover:text-primary" aria-label="LinkedIn">
                in
              </a>
              <a href="https://instagram.com" className="hover:text-primary" aria-label="Instagram">
                ◎
              </a>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-muted">
          © {new Date().getFullYear()} Delivery Worker. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
