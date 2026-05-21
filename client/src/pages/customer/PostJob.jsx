import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import DashboardShell from '../../components/DashboardShell';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import MapView from '../../components/MapView';
import { createJob, estimateJob } from '../../api/jobs';
import { createPaymentIntent } from '../../api/payments';

const stripePk =
  import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const stripePromise = stripePk ? loadStripe(stripePk) : null;

function StepIndicator({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-muted'
              }`}
            >
              {s}
            </div>
            <p className="mt-2 hidden text-xs text-muted sm:block">
              {s === 1 ? 'Details' : s === 2 ? 'Locations' : 'Pay'}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
      </div>
    </div>
  );
}

function PayStep({ onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) {
      toast.error('Stripe is still loading');
      return;
    }
    setBusy(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful');
        onPaid?.();
      }
    } catch (e) {
      toast.error(e.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
      >
        {busy ? 'Processing…' : 'Proceed to Pay'}
      </button>
    </div>
  );
}

export default function PostJob() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packageSize, setPackageSize] = useState('medium');

  const [pickupText, setPickupText] = useState('');
  const [pickup, setPickup] = useState(null);
  const [deliveryText, setDeliveryText] = useState('');
  const [delivery, setDelivery] = useState(null);

  const [estimate, setEstimate] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [done, setDone] = useState(false);

  const mapCenter = useMemo(() => {
    if (pickup && delivery) {
      return {
        lat: (pickup.lat + delivery.lat) / 2,
        lng: (pickup.lng + delivery.lng) / 2,
      };
    }
    if (pickup) return { lat: pickup.lat, lng: pickup.lng };
    if (delivery) return { lat: delivery.lat, lng: delivery.lng };
    return null;
  }, [pickup, delivery]);

  const reverseGeocode = async ({ lat, lng }) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          // Nominatim asks for a valid UA/referrer; browser sets UA, we keep it minimal here.
          'Accept-Language': 'en',
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.display_name || null;
    } catch {
      return null;
    }
  };

  const handleMapPick = async (point) => {
    // 1st click = pickup, 2nd click = drop, 3rd click resets (new pickup)
    if (!pickup) {
      const addr = await reverseGeocode(point);
      setPickup({ ...point, address: addr || `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})` });
      setPickupText(addr || `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`);
      return;
    }
    if (!delivery) {
      const addr = await reverseGeocode(point);
      setDelivery({ ...point, address: addr || `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})` });
      setDeliveryText(addr || `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`);
      return;
    }
    setPickup(null);
    setDelivery(null);
    const addr = await reverseGeocode(point);
    setPickup({ ...point, address: addr || `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})` });
    setPickupText(addr || `(${point.lat.toFixed(5)}, ${point.lng.toFixed(5)})`);
    setDeliveryText('');
  };

  const markers = useMemo(() => {
    const m = [];
    if (pickup) m.push({ id: 'p', lat: pickup.lat, lng: pickup.lng, label: 'P' });
    if (delivery) m.push({ id: 'd', lat: delivery.lat, lng: delivery.lng, label: 'D' });
    return m;
  }, [pickup, delivery]);

  const nextFromStep1 = () => {
    if (!title.trim()) {
      toast.error('Please enter a job title');
      return;
    }
    setStep(2);
  };

  const nextFromStep2 = async () => {
    if (!pickup?.lat || !delivery?.lat) {
      toast.error('Set pickup and delivery: pick from address suggestions or click the map');
      return;
    }
    setSubmitting(true);
    try {
      const est = await estimateJob({
        pickup: { lat: pickup.lat, lng: pickup.lng },
        delivery: { lat: delivery.lat, lng: delivery.lng },
      });
      if (!est.success) {
        toast.error(est.message || 'Estimate failed');
        return;
      }
      setEstimate(est.data);

      const jobRes = await createJob({
        title: title.trim(),
        description: description.trim(),
        packageSize,
        pickupAddress: pickup.address || pickupText,
        pickupLng: pickup.lng,
        pickupLat: pickup.lat,
        deliveryAddress: delivery.address || deliveryText,
        deliveryLng: delivery.lng,
        deliveryLat: delivery.lat,
        price: est.data.price,
        distanceKm: est.data.distanceKm,
        estimatedTimeMin: est.data.estimatedTimeMin,
      });
      if (!jobRes.success) {
        toast.error(jobRes.message || 'Could not create job');
        return;
      }
      const id = jobRes.data.job._id;
      setJobId(id);

      if (!stripePromise) {
        toast.error('Add REACT_APP_STRIPE_PUBLIC_KEY to enable checkout');
        setSubmitting(false);
        return;
      }

      const payRes = await createPaymentIntent(id);
      if (!payRes.success || !payRes.data?.clientSecret) {
        toast.error(payRes.message || 'Could not start payment');
        return;
      }
      setClientSecret(payRes.data.clientSecret);
      setStep(3);
    } catch (e) {
      toast.error(e.userMessage || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (done && jobId) {
    return (
      <DashboardShell title="Confirmation">
        <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-success">Payment successful</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Your job is live</h1>
          <p className="mt-2 text-sm text-muted">
            Job ID: <span className="font-mono font-semibold text-ink">{String(jobId).slice(-8).toUpperCase()}</span>
          </p>
          {estimate ? (
            <ul className="mt-4 space-y-1 text-left text-sm text-muted">
              <li>Distance: {estimate.distanceKm} km</li>
              <li>Est. time: {estimate.estimatedTimeMin} min</li>
              <li>Price paid: ${Number(estimate.price).toFixed(2)}</li>
            </ul>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={`/customer/track/${jobId}`}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Track job
            </Link>
            <Link
              to="/customer/dashboard"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Post a job">
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <StepIndicator step={step} />

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deliver documents to downtown"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Description</label>
              <textarea
                className="mt-1 min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fragile, gate code, etc."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Package size</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <div className="flex justify-between gap-3 pt-4">
              <Link
                to="/customer/dashboard"
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-ink"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={nextFromStep1}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Pickup address</label>
              <div className="mt-1">
                <AddressAutocomplete
                  value={pickupText}
                  onChangeText={setPickupText}
                  placeholder="Search pickup address"
                  onPlaceSelected={(p) => {
                    setPickupText(p.address);
                    setPickup(p);
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Delivery address</label>
              <div className="mt-1">
                <AddressAutocomplete
                  value={deliveryText}
                  onChangeText={setDeliveryText}
                  placeholder="Search delivery address"
                  onPlaceSelected={(p) => {
                    setDeliveryText(p.address);
                    setDelivery(p);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted">
                Tip: click on the map to set <span className="font-semibold">Pickup</span> then{' '}
                <span className="font-semibold">Delivery</span>. Third click starts over.
              </p>
              <MapView
                center={mapCenter}
                markers={markers}
                zoom={11}
                height="260px"
                onMapClick={handleMapPick}
                pickup={pickup}
                delivery={delivery}
              />
            </div>
            <div className="flex justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-ink"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={nextFromStep2}
                className="flex min-w-[120px] items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && clientSecret && stripePromise ? (
          <div className="space-y-4">
            {estimate ? (
              <div className="rounded-lg border border-gray-200 bg-page p-4 text-sm">
                <p className="font-semibold text-ink">Estimated price</p>
                <p className="mt-1 text-2xl font-bold text-primary">${Number(estimate.price).toFixed(2)}</p>
                <p className="mt-2 text-muted">
                  {estimate.distanceKm} km · ~{estimate.estimatedTimeMin} min
                </p>
              </div>
            ) : null}
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PayStep onPaid={() => setDone(true)} />
            </Elements>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm font-medium text-muted hover:text-ink"
            >
              Back
            </button>
          </div>
        ) : null}

        {step === 3 && !clientSecret ? (
          <p className="text-sm text-muted">Preparing secure checkout…</p>
        ) : null}
      </div>
    </DashboardShell>
  );
}
