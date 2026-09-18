import { useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';

export default function TriggerButton({ pipelineId, pipelineName, onTriggered, variant = 'primary' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [params, setParams] = useState('');

  const handleTrigger = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

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
      const res = await api.triggerPipeline(pipelineId, parsedParams);
      setSuccess(`Job triggered! Run ID: ${res.runId}`);
      if (onTriggered) onTriggered(res);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        setParams('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to trigger pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all shadow-sm active:scale-95'
            : 'inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium px-3 py-1.5 rounded-md text-xs transition-colors'
        }
      >
        <Play size={variant === 'primary' ? 16 : 14} className="fill-current" />
        Run Now
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Play size={18} className="fill-current ml-0.5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Trigger Pipeline Run</h3>
                  <p className="text-xs text-slate-500">{pipelineName || pipelineId}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Parameters (Optional JSON)
                </label>
                <textarea
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  placeholder='{ "date": "2026-09-19", "env": "prod" }'
                  rows={3}
                  className="w-full font-mono text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs mb-4">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs mb-4">
                  <CheckCircle2 size={16} />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleTrigger}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Triggering...' : 'Confirm Run'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

