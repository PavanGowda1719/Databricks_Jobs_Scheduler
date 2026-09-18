import { useState, useEffect } from 'react';
import { RefreshCw, Search, ExternalLink, CalendarClock, Tag, Server } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/pipelines/StatusBadge';
import TriggerButton from '../components/pipelines/TriggerButton';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadPipelines = async () => {
    try {
      const res = await api.getPipelines();
      setPipelines(res.pipelines || []);
    } catch (err) {
      console.error('Failed to load pipelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelines();
    const interval = setInterval(loadPipelines, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = pipelines.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pipelines</h2>
          <p className="text-sm text-slate-500">
            Databricks workflows and ETL pipelines available for manual and automated runs
          </p>
        </div>
        <button
          onClick={loadPipelines}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-2xs self-start"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <Search size={16} className="text-slate-400 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter pipelines by name, tags, or description..."
          className="w-full text-sm outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Pipelines Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Pipeline / Job</th>
                <th className="py-3.5 px-4">Workspace</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Last Run</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {loading ? 'Loading pipelines...' : 'No pipelines found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.description}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {p.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700">
                        <Server size={12} />
                        {p.workspace?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600">
                      {p.schedules?.length > 0 ? (
                        <div className="flex items-center gap-1 text-slate-700">
                          <CalendarClock size={14} className="text-blue-600" />
                          <span>{p.schedules.length} active rule(s)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Manual only</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      {p.latestRun ? (
                        <div>
                          <div>{new Date(p.latestRun.started_at).toLocaleDateString()}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(p.latestRun.started_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <TriggerButton
                        pipelineId={p.id}
                        pipelineName={p.name}
                        onTriggered={loadPipelines}
                        variant="secondary"
                      />
                      <Link
                        to={`/pipelines/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        Details
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
