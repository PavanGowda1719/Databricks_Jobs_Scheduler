export default function StatusBadge({ status }) {
  const normalized = (status || 'NEVER_RUN').toUpperCase();

  const configs = {
    SUCCESS: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Succeeded',
    },
    SUCCEEDED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Succeeded',
    },
    RUNNING: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 animate-ping',
      label: 'Running',
    },
    PENDING: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-400',
      label: 'Pending',
    },
    FAILED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Failed',
    },
    ERROR: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Failed',
    },
    CANCELLED: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Cancelled',
    },
    TERMINATED: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Terminated',
    },
    NEVER_RUN: {
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Never Run',
    },
  };

  const current = configs[normalized] || configs.NEVER_RUN;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      <span className="relative flex h-2 w-2">
        {normalized === 'RUNNING' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}></span>
      </span>
      {current.label}
    </span>
  );
}

