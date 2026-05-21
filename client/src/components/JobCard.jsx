import StatusBadge from './StatusBadge';
import { formatRelativeTime } from '../utils/formatDate';

export default function JobCard({ job, onSelect, onAccept, showAccept, compact }) {
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(job)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect(job);
        }
      }}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink">{job.title}</h3>
          <p className="mt-1 text-sm text-muted">
            {job.pickupLocation?.address?.split(',')[0] || 'Pickup'} →{' '}
            {job.deliveryLocation?.address?.split(',')[0] || 'Drop'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-bold text-primary">${Number(job.price).toFixed(2)}</span>
          <StatusBadge status={job.status} />
        </div>
      </div>
      {!compact ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>{job.distance != null ? `${job.distance} km` : '—'}</span>
          <span>{formatRelativeTime(job.createdAt)}</span>
          <span className="capitalize">{job.packageSize}</span>
        </div>
      ) : null}
      {showAccept ? (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onAccept?.(job)}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
          >
            Accept Job
          </button>
        </div>
      ) : null}
    </div>
  );
}
