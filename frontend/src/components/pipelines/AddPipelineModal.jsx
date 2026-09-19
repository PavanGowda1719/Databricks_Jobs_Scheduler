import { useState } from 'react';
import { X, Plus, Layers, Loader2, CheckCircle2, AlertTriangle, GitMerge, Server } from 'lucide-react';
import { api } from '../../api/client';

export default function AddPipelineModal({ existingPipelines = [], onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    databricksJobId: '',
    workspace: 'dev',
    category: 'ETL',
    tags: '',
    owner: 'data-team',
    upstreamDependencies: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!formData.name.trim() || !formData.databricksJobId) {
      setError('Pipeline name and Databricks Job ID are required.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        databricksJobId: Number(formData.databricksJobId),
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const res = await api.createPipeline(payload);
      setSuccess(`Pipeline "${res.pipeline.name}" registered successfully!`);
      if (onCreated) onCreated(res.pipeline);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create pipeline.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUpstream = (depId) => {
    if (formData.upstreamDependencies.includes(depId)) {
      setFormData({
        ...formData,
        upstreamDependencies: formData.upstreamDependencies.filter((id) => id !== depId),
      });
    } else {
      setFormData({
        ...formData,
        upstreamDependencies: [...formData.upstreamDependencies, depId],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-[#fff9fa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xs">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Add New Pipeline / Job</h3>
              <p className="text-xs text-slate-400 font-medium">Register a Databricks workflow to the scheduler catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name & Job ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pipeline Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Customer Churn Prediction"
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Databricks Job ID *
              </label>
              <input
                type="number"
                required
                value={formData.databricksJobId}
                onChange={(e) => setFormData({ ...formData, databricksJobId: e.target.value })}
                placeholder="e.g. 91034503054714"
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] font-mono text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
              />
              <p className="text-[10px] text-slate-400 mt-1">From Databricks Workflows &gt; Jobs</p>
            </div>
          </div>

          {/* Workspace & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Environment / Workspace
              </label>
              <select
                value={formData.workspace}
                onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50 cursor-pointer"
              >
                <option value="dev">🟡 DEV (Development)</option>
                <option value="uat">🔵 UAT (Staging)</option>
                <option value="prod">🔴 PROD (Production)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50 cursor-pointer"
              >
                <option value="ETL">ETL / Data Ingestion</option>
                <option value="BI & Analytics">BI & Analytics</option>
                <option value="Machine Learning">Machine Learning / AI</option>
                <option value="Data Quality">Data Quality & Validation</option>
                <option value="Maintenance">Maintenance & Vacuum</option>
              </select>
            </div>
          </div>

          {/* Upstream Dependencies Selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <GitMerge size={12} className="text-rose-500" />
              <span>Upstream Dependencies (Optional)</span>
            </label>
            <p className="text-[10px] text-slate-400 mb-2">
              Select jobs that must finish successfully before this job can execute:
            </p>
            {existingPipelines.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No existing pipelines to depend on.</p>
            ) : (
              <div className="space-y-1.5 max-h-28 overflow-y-auto p-2 bg-[#fffafa] rounded-xl border border-rose-100">
                {existingPipelines.map((p) => {
                  const isSelected = formData.upstreamDependencies.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-rose-100/70 text-rose-900 font-semibold' : 'hover:bg-rose-50/50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUpstream(p.id)}
                        className="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({p.id})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of business purpose and output tables..."
              className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
            />
          </div>

          {/* Tags & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="sales, daily, delta"
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Owner Team
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="data-team"
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
              />
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-rose-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-rose-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Registering...' : 'Register Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

