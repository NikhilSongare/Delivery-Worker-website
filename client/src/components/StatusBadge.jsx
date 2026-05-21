const styles = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-amber-100 text-amber-800 border-amber-200',
  'in-progress': 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-gray-100 text-gray-700 border-gray-200',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function StatusBadge({ status, label }) {
  const key = status?.toLowerCase?.() || '';
  const cls = styles[key] || 'bg-gray-100 text-gray-700 border-gray-200';
  const text = label || status || '—';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}
    >
      {text.replace(/-/g, ' ')}
    </span>
  );
}
