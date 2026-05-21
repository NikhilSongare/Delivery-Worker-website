import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MapView from '../components/MapView';
import { MapPin, Shield, Zap, Calendar, Star, Headphones } from 'lucide-react';

const DEMO_PICKUP = { lat: 28.6139, lng: 77.209 };
const DEMO_DELIVERY = { lat: 28.7041, lng: 77.1025 };

const features = [
  { title: 'Real-time Tracking', desc: 'Watch your delivery move live from pickup to drop-off.', icon: MapPin },
  { title: 'Verified Workers', desc: 'Every courier is vetted so your packages stay safe.', icon: Shield },
  { title: 'Instant Pay', desc: 'Secure checkout with instant confirmation for peace of mind.', icon: Zap },
  { title: 'Easy Booking', desc: 'Post a job in minutes with a guided, mobile-first flow.', icon: Calendar },
  { title: 'Review System', desc: 'Rate every trip and build trust across the network.', icon: Star },
  { title: '24/7 Support', desc: 'Our team is here around the clock when you need help.', icon: Headphones },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Small business owner',
    text: 'Delivery Worker cut our local dispatch time in half. The live map is a game changer.',
    stars: 5,
  },
  {
    name: 'Marcus Lee',
    role: 'Customer',
    text: 'Super smooth experience. I booked from my phone and tracked the rider all the way.',
    stars: 5,
  },
  {
    name: 'Elena Rossi',
    role: 'Restaurant partner',
    text: 'Reliable couriers, transparent pricing, and great support when we needed it.',
    stars: 5,
  },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-page">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              On-demand delivery
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
              Deliver Anything, Earn Anytime
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Book trusted couriers for same-day delivery, or join as a worker and earn on your
              schedule — all in one beautiful, real-time platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:opacity-95"
              >
                Post a Job
              </Link>
              <Link
                to="/signup"
                state={{ defaultRole: 'worker' }}
                className="inline-flex items-center justify-center rounded-xl border-2 border-primary bg-white px-6 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Become a Worker
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
              <div className="absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
              <div className="relative rounded-3xl border border-gray-200 bg-white p-4 shadow-xl">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-indigo-800 p-6 text-white">
                  <p className="text-sm opacity-90">Live route</p>
                  <p className="mt-2 text-2xl font-bold">12 min ETA</p>
                  <div className="mt-6 h-40 overflow-hidden rounded-xl ring-1 ring-white/20">
                    <MapView
                      mapKey="landing-demo"
                      height="100%"
                      zoom={11}
                      center={{
                        lat: (DEMO_PICKUP.lat + DEMO_DELIVERY.lat) / 2,
                        lng: (DEMO_PICKUP.lng + DEMO_DELIVERY.lng) / 2,
                      }}
                      pickup={DEMO_PICKUP}
                      delivery={DEMO_DELIVERY}
                      markers={[
                        { id: 'p', ...DEMO_PICKUP, label: 'P' },
                        { id: 'd', ...DEMO_DELIVERY, label: 'D' },
                      ]}
                      mapContainerClassName="border-0 rounded-xl"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-page px-4 py-3">
                  <div>
                    <p className="text-xs text-muted">Courier</p>
                    <p className="font-semibold text-ink">Alex · 4.9★</p>
                  </div>
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                    On the way
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-gray-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted">
            Three simple steps from booking to doorstep.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { step: '1', title: 'Post Job', desc: 'Describe your package and pickup / drop locations.' },
              { step: '2', title: 'Worker Accepts', desc: 'A nearby verified courier claims your delivery.' },
              { step: '3', title: 'Delivered', desc: 'Track live and confirm when it arrives safely.' },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-xl border border-gray-200 bg-page p-6 text-center"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">Built for speed & trust</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { label: '10,000+', sub: 'Deliveries' },
            { label: '5,000+', sub: 'Workers' },
            { label: '50+', sub: 'Cities' },
            { label: '4.8★', sub: 'Rating' },
          ].map((s) => (
            <div key={s.sub} className="text-center">
              <p className="text-2xl font-bold text-primary sm:text-3xl">{s.label}</p>
              <p className="text-sm text-muted">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">Loved by customers</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-muted">{t.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex text-warning">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
