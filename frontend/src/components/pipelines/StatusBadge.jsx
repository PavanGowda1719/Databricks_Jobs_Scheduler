export default function StatusBadge({ status }) {
  const normalized = (status || 'NEVER_RUN').toUpperCase();

  const configs = {
    SUCCESS: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs shadow-emerald-500/10',
      dot: 'bg-emerald-500',
      label: 'Succeeded',
    },
    SUCCEEDED: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs shadow-emerald-500/10',
      dot: 'bg-emerald-500',
      label: 'Succeeded',
    },
    RUNNING: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs shadow-rose-500/20',
      dot: 'bg-rose-500',
      label: 'Running',
    },
    PENDING: {
      bg: 'bg-pink-50 text-pink-700 border-pink-200 shadow-xs',
      dot: 'bg-pink-400',
      label: 'Pending',
    },
    WAITING_FOR_UPSTREAM: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs shadow-purple-500/20',
      dot: 'bg-purple-500',
      label: 'Waiting on Upstream',
    },
    BLOCKED: {
      bg: 'bg-red-50 text-red-700 border-red-300 shadow-xs shadow-red-500/15',
      dot: 'bg-red-600',
      label: 'Blocked',
    },
    FAILED: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs',
      dot: 'bg-rose-600',
      label: 'Failed',
    },
    ERROR: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs',
      dot: 'bg-rose-600',
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
      bg: 'bg-slate-50 text-slate-500 border-slate-200',
      dot: 'bg-slate-300',
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
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        )}
        {normalized === 'WAITING_FOR_UPSTREAM' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}></span>
      </span>
      {current.label}
    </span>
  );
}
