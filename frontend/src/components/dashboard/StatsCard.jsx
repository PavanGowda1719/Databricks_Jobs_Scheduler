export default function StatsCard({ title, value, icon: Icon, color = 'rose', subtitle }) {
  const colorMap = {
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    pink: {
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    crimson: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
    },
  };

  const scheme = colorMap[color] || colorMap.rose;

  return (
    <div className="bg-white rounded-2xl p-5 border border-rose-100/90 shadow-xs hover:shadow-md hover:border-rose-200 transition-all flex items-center justify-between group">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</span>
          {subtitle && <span className="text-xs text-slate-400 font-medium">{subtitle}</span>}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border} group-hover:scale-105 transition-transform shadow-xs`}>
        <Icon size={22} />
      </div>
    </div>
  );
}
