import { useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertTriangle, ShieldAlert, GitMerge, Clock } from 'lucide-react';
import { api } from '../../api/client';

export default function TriggerButton({
  pipelineId,
  pipelineName,
  upstreamDependencies = [],
  dependencyStatus,
  onTriggered,
  variant = 'primary',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);
  const [params, setParams] = useState('');
  const [forceBypass, setForceBypass] = useState(false);

  const hasDeps = upstreamDependencies && upstreamDependencies.length > 0;

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setWarning(null);

    let parsedParams = {};
    if (params.trim()) {
      try {
        parsedParams = JSON.parse(params);
      } catch (err) {
        setError('Invalid JSON parameters format');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.triggerPipeline(pipelineId, parsedParams, forceBypass);

      if (res.waiting) {
        setWarning(res.message);
        if (onTriggered) onTriggered(res);
        setTimeout(() => {
          setIsOpen(false);
          setWarning(null);
          setParams('');
        }, 3000);
      } else {
        setSuccess(`Job triggered on Databricks! Run ID: #${res.runId}`);
        if (onTriggered) onTriggered(res);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
          setParams('');
        }, 2200);
      }
    } catch (err) {
      setError(err.message || 'Failed to trigger pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(null);
          setWarning(null);
          setForceBypass(false);
        }}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-sm shadow-rose-500/20 active:scale-95'
            : 'inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-semibold px-2.5 py-1 rounded-lg text-xs transition-colors'
        }
      >
        <Play size={variant === 'primary' ? 14 : 12} className="fill-current" />
        Run Now
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-sm shadow-rose-500/30">
                  <Play size={18} className="fill-current ml-0.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Trigger Pipeline Run</h3>
                  <p className="text-xs text-slate-400 font-medium">{pipelineName || pipelineId}</p>
                </div>
              </div>

              {/* Upstream Dependency Notice */}
              {hasDeps && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-rose-700 mb-1">
                    <GitMerge size={14} />
                    <span>Upstream Dependencies Configured</span>
                  </div>
                  <p className="text-rose-800/80 text-[11px] leading-relaxed">
                    This pipeline depends on: <strong>{upstreamDependencies.join(', ')}</strong>.
                    By default, it will wait for upstream success before executing.
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-rose-200/50 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="forceBypass"
                      checked={forceBypass}
                      onChange={(e) => setForceBypass(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                    />
                    <label htmlFor="forceBypass" className="text-[11px] font-medium text-rose-900 cursor-pointer">
                      Force Bypass (run immediately without checking upstream)
                    </label>
                  </div>
                </div>
              )}

              {/* Parameters Input */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Parameters (Optional JSON)
                </label>
                <textarea
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  placeholder='{ "date": "2026-09-19", "batch": "01" }'
                  rows={3}
                  className="w-full font-mono text-xs p-3 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400/50 bg-[#fffafa] text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs mb-4">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {warning && (
                <div className="flex items-start gap-2 text-purple-800 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs mb-4">
                  <Clock size={15} className="mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs mb-4">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                    setSuccess(null);
                    setWarning(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTrigger}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-sm shadow-rose-500/30 disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? 'Submitting...' : 'Confirm Run'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
