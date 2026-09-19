import { X, GitCompare, ExternalLink, ArrowRight, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function RunComparisonModal({ runA, runB, pipelineName, onClose }) {
  if (!runA || !runB) return null;

  const durationA = runA.runDuration ?? runA.duration_seconds ?? 0;
  const durationB = runB.runDuration ?? runB.duration_seconds ?? 0;
  const durationDiff = durationB - durationA;

  const statusA = runA.state || runA.resultState || runA.status || 'UNKNOWN';
  const statusB = runB.state || runB.resultState || runB.status || 'UNKNOWN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-[#fff9fa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xs">
              <GitCompare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Run Comparison Inspector</h3>
              <p className="text-xs text-slate-400 font-medium">{pipelineName} • Side-by-Side Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Comparison Cards Header */}
          <div className="grid grid-cols-2 gap-4">
            {/* Run A Summary */}
            <div className="p-4 rounded-xl border border-rose-100 bg-[#fffafa]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Run A (Base)</span>
                <StatusBadge status={statusA} />
              </div>
              <p className="text-lg font-black font-mono text-slate-800">
                #{runA.runId || runA.databricks_run_id || runA.id}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {runA.startTime || runA.started_at ? new Date(runA.startTime || runA.started_at).toLocaleString() : '—'}
              </p>
            </div>

            {/* Run B Summary */}
            <div className="p-4 rounded-xl border border-rose-100 bg-[#fffafa]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Run B (Target)</span>
                <StatusBadge status={statusB} />
              </div>
              <p className="text-lg font-black font-mono text-slate-800">
                #{runB.runId || runB.databricks_run_id || runB.id}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {runB.startTime || runB.started_at ? new Date(runB.startTime || runB.started_at).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {/* Performance Delta Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Clock size={15} className="text-rose-500" />
              <span>Execution Duration Delta:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-800">Run A: {durationA}s</span>
              <ArrowRight size={13} className="text-slate-400" />
              <span className="font-mono font-bold text-slate-800">Run B: {durationB}s</span>
              <span
                className={`ml-2 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  durationDiff < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : durationDiff > 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {durationDiff === 0
                  ? 'Same speed'
                  : durationDiff < 0
                  ? `${Math.abs(durationDiff)}s faster (${Math.round((Math.abs(durationDiff) / (durationA || 1)) * 100)}%)`
                  : `+${durationDiff}s slower (+${Math.round((durationDiff / (durationA || 1)) * 100)}%)`}
              </span>
            </div>
          </div>

          {/* Detailed Metric Table */}
          <div className="rounded-xl border border-rose-100 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#fff9fa] text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-rose-100">
                <tr>
                  <th className="py-2.5 px-4">Metric</th>
                  <th className="py-2.5 px-4">Run A</th>
                  <th className="py-2.5 px-4">Run B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 text-[11px]">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-600">Trigger Type</td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-800">
                    {runA.triggerType || runA.trigger_type || 'Manual'}
                  </td>
                  <td className="py-3 px-4 capitalize font-medium text-slate-800">
                    {runB.triggerType || runB.trigger_type || 'Manual'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-600">Completed At</td>
                  <td className="py-3 px-4 text-slate-700">
                    {runA.endTime || runA.completed_at ? new Date(runA.endTime || runA.completed_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {runB.endTime || runB.completed_at ? new Date(runB.endTime || runB.completed_at).toLocaleString() : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-600">Error / State Message</td>
                  <td className="py-3 px-4 text-slate-700">
                    {runA.errorMessage || runA.error_message || runA.stateMessage || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {runB.errorMessage || runB.error_message || runB.stateMessage || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-600">Databricks Console</td>
                  <td className="py-3 px-4">
                    {runA.runPageUrl ? (
                      <a
                        href={runA.runPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Inspect Run A <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {runB.runPageUrl ? (
                      <a
                        href={runB.runPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold"
                      >
                        Inspect Run B <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-rose-100 flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-2xs"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}

