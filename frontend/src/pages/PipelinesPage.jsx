import { useState, useEffect } from 'react';
import { RefreshCw, Search, ExternalLink, CalendarClock, Tag, Server, GitMerge, CheckCircle, Clock, AlertTriangle, ArrowRight, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import StatusBadge from '../components/pipelines/StatusBadge';
import TriggerButton from '../components/pipelines/TriggerButton';
import AddPipelineModal from '../components/pipelines/AddPipelineModal';

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [graphData, setGraphData] = useState(null);

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

  const loadGraph = async () => {
    try {
      const res = await api.getDependencyGraph();
      setGraphData(res);
      setShowGraphModal(true);
    } catch (err) {
      console.error('Failed to load dependency graph:', err);
    }
  };

  const [workspace, setWorkspace] = useState(() => localStorage.getItem('activeWorkspace') || 'all');

  useEffect(() => {
    loadPipelines();
    const interval = setInterval(loadPipelines, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleWs = (e) => setWorkspace(e.detail || 'all');
    window.addEventListener('workspaceChanged', handleWs);
    return () => window.removeEventListener('workspaceChanged', handleWs);
  }, []);

  const filtered = pipelines.filter((p) => {
    const matchesWs = workspace === 'all' || (p.workspace && p.workspace.toLowerCase() === workspace.toLowerCase());
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())));
    return matchesWs && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-rose-100 text-rose-600">
              <GitMerge size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Pipelines & DAG</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Workflows & Job Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Databricks ETL jobs, Spark pipelines, and automated upstream-downstream dependency execution
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-rose-500/25 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            Add Pipeline
          </button>
          <button
            onClick={loadGraph}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl hover:bg-rose-100/60 transition-all shadow-2xs cursor-pointer"
          >
            <GitMerge size={14} />
            View DAG Graph
          </button>
          <button
            onClick={loadPipelines}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-rose-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-rose-50/50 hover:border-rose-200 transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-rose-500' : 'text-slate-400'} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-rose-100 shadow-xs">
        <Search size={16} className="text-rose-400 ml-1.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter pipelines by name, tags, or description..."
          className="w-full text-xs font-medium outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Pipelines Table */}
      <div className="bg-white rounded-2xl border border-rose-100/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fff9fa] border-b border-rose-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Pipeline / Workflow</th>
                <th className="py-3.5 px-4">Workspace</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Upstream Deps</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Last Run</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    {loading ? 'Loading pipelines from Databricks...' : 'No pipelines found matching your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const deps = p.upstreamDependencies || [];
                  const depCheck = p.dependencyCheck || { status: 'CLEAR' };

                  return (
                    <tr key={p.id} className="hover:bg-[#fffbfc] transition-colors">
                      {/* Name & description */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.description}</div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                            {p.category}
                          </span>
                          {p.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 font-medium border border-slate-100"
                            >
                              <Tag size={9} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Workspace */}
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-100 text-[11px]">
                          <Server size={11} />
                          {p.workspace?.toUpperCase()}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {p.schedules?.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
                            <CalendarClock size={13} className="text-rose-500 shrink-0" />
                            <span>{p.schedules.length} active rule(s)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Manual trigger</span>
                        )}
                      </td>

                      {/* Upstream Dependencies */}
                      <td className="py-4 px-4 text-xs">
                        {deps.length > 0 ? (
                          <div className="space-y-1">
                            {deps.map((depId) => (
                              <div
                                key={depId}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  depCheck.status === 'CLEAR'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : depCheck.status === 'BLOCKED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                <GitMerge size={10} />
                                <span>{depId}</span>
                                {depCheck.status === 'CLEAR' && <CheckCircle size={10} className="text-emerald-500" />}
                                {depCheck.status === 'WAITING' && <Clock size={10} className="text-purple-500" />}
                                {depCheck.status === 'BLOCKED' && <AlertTriangle size={10} className="text-rose-500" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[11px]">None (Root)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* Last run */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {p.latestRun ? (
                          <div>
                            <div className="font-medium text-slate-700 text-[11px]">
                              {new Date(p.latestRun.started_at).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(p.latestRun.started_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-1.5">
                        <TriggerButton
                          pipelineId={p.id}
                          pipelineName={p.name}
                          upstreamDependencies={deps}
                          dependencyStatus={depCheck.status}
                          onTriggered={loadPipelines}
                          variant="secondary"
                        />
                        <Link
                          to={`/pipelines/${p.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          Inspect
                          <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DAG Visualizer Modal */}
      {showGraphModal && graphData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <GitMerge size={18} className="text-rose-500" />
                <h3 className="text-base font-bold text-slate-800">Pipeline Dependency Graph (DAG)</h3>
              </div>
              <button
                onClick={() => setShowGraphModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-6 space-y-6">
              <p className="text-xs text-slate-500">
                Visual relationship flow showing upstream triggers and downstream consumers:
              </p>

              <div className="space-y-4">
                {graphData.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-4 rounded-xl border border-rose-100 bg-[#fffafa] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800">{node.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({node.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Category: {node.category}</span>
                        <span>•</span>
                        <span>Workspace: {node.workspace}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={node.status} />
                    </div>
                  </div>
                ))}

                {/* Edge summary */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-rose-900">
                  <span className="font-bold">Active Execution Flows:</span>
                  <div className="mt-2 space-y-1 font-mono text-[11px]">
                    {graphData.edges.length === 0 ? (
                      <span className="text-slate-400">No active dependency edges configured.</span>
                    ) : (
                      graphData.edges.map((edge) => (
                        <div key={edge.id} className="flex items-center gap-2 text-rose-700">
                          <span className="font-semibold">{edge.source}</span>
                          <ArrowRight size={12} className="text-rose-400" />
                          <span className="font-semibold">{edge.target}</span>
                          <span className="text-[10px] font-sans text-rose-500/80">
                            (Auto-triggers upon success)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGraphModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Close DAG Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pipeline Modal */}
      {isAddModalOpen && (
        <AddPipelineModal
          existingPipelines={pipelines}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={() => {
            loadPipelines();
          }}
        />
      )}
    </div>
  );
}
