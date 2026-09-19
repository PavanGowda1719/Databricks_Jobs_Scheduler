import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink, CalendarClock, Activity, Layers, Tag, GitMerge, CheckCircle, Clock, AlertTriangle, ArrowDown, GitCompare } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/pipelines/StatusBadge';
import TriggerButton from '../components/pipelines/TriggerButton';
import RunComparisonModal from '../components/pipelines/RunComparisonModal';

export default function PipelineDetailPage() {
  const { id } = useParams();
  const [pipeline, setPipeline] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRuns, setSelectedRuns] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const loadDetails = async () => {
    try {
      const data = await api.getPipeline(id);
      setPipeline(data);
      const runsData = await api.getPipelineRuns(id);
      setRuns(runsData.databricksRuns?.length ? runsData.databricksRuns : runsData.localRuns || []);
    } catch (err) {
      console.error('Failed to load pipeline details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    const interval = setInterval(loadDetails, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !pipeline) {
    return <div className="text-xs font-semibold text-slate-400 py-12 text-center">Loading pipeline specifications...</div>;
  }

  if (!pipeline) {
    return (
      <div className="space-y-4">
        <Link to="/pipelines" className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
          <ArrowLeft size={14} /> Back to all pipelines
        </Link>
        <p className="text-slate-600 text-xs">Pipeline with ID "{id}" was not found.</p>
      </div>
    );
  }

  const upstreams = pipeline.upstreamDependencies || [];
  const downstreams = pipeline.downstreamPipelines || [];
  const depCheck = pipeline.dependencyCheck || { status: 'CLEAR' };

  return (
    <div className="space-y-6">
      {/* Back link & Header */}
      <div>
        <Link
          to="/pipelines"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 font-semibold transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to all pipelines
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{pipeline.name}</h2>
              <StatusBadge status={pipeline.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{pipeline.description}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadDetails}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-rose-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-rose-50/50 hover:border-rose-200 transition-all shadow-2xs"
            >
              <RefreshCw size={13} className="text-slate-400" />
              Refresh
            </button>
            <TriggerButton
              pipelineId={pipeline.id}
              pipelineName={pipeline.name}
              upstreamDependencies={upstreams}
              dependencyStatus={depCheck.status}
              onTriggered={loadDetails}
              variant="primary"
            />
          </div>
        </div>
      </div>

      {/* Dependency Status Banner (if waiting or blocked) */}
      {depCheck.hasDependencies && depCheck.status !== 'CLEAR' && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
            depCheck.status === 'BLOCKED'
              ? 'bg-rose-50/80 border-rose-200 text-rose-800'
              : 'bg-purple-50/80 border-purple-200 text-purple-800'
          }`}
        >
          {depCheck.status === 'BLOCKED' ? (
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Clock size={18} className="text-purple-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold">
              {depCheck.status === 'BLOCKED' ? 'Upstream Execution Blocked' : 'Upstream Execution In Progress'}
            </span>
            <p className="text-[11px] mt-0.5 opacity-90">{depCheck.message}</p>
          </div>
        </div>
      )}

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Job Spec */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Job Specification</p>
          <div className="mt-3 space-y-2 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Databricks Job ID:</span>
              <span className="font-mono font-bold text-slate-800">{pipeline.databricksJobId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Workspace:</span>
              <span className="font-bold text-rose-600 uppercase">{pipeline.workspace}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="font-semibold text-slate-800">{pipeline.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Owner Team:</span>
              <span className="font-semibold text-slate-800">{pipeline.owner}</span>
            </div>
          </div>
        </div>

        {/* Upstream / Downstream Dependencies Card */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DAG Dependencies</p>
            <GitMerge size={14} className="text-rose-400" />
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Upstream (Requires):</span>
              {upstreams.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {upstreams.map((up) => (
                    <div key={up} className="p-2 rounded-lg bg-rose-50/60 border border-rose-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-rose-900">{up}</span>
                      <span className="text-[10px] font-bold uppercase text-rose-600">
                        {depCheck.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] mt-0.5">None (Root Workflow)</p>
              )}
            </div>

            <div className="pt-2 border-t border-rose-50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Downstream (Triggers):</span>
              {downstreams.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {downstreams.map((d) => (
                    <div key={d.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700">
                      <ArrowDown size={11} className="text-rose-500" />
                      <span className="font-semibold">{d.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] mt-0.5">No downstream consumers registered.</p>
              )}
            </div>
          </div>
        </div>

        {/* Schedules & Tags Card */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Schedules & Tags</p>
          <div className="mt-3 text-xs space-y-3">
            {pipeline.schedules?.length > 0 ? (
              <div className="space-y-1.5">
                {pipeline.schedules.map((s) => (
                  <div key={s.id} className="p-2 bg-rose-50/40 rounded-xl border border-rose-100 flex items-center gap-2">
                    <CalendarClock size={14} className="text-rose-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 text-[11px]">
                        {s.schedule_type === 'nth_business_day'
                          ? `${s.business_day_number}nd Business Day Monthly`
                          : s.cron_expression}
                      </p>
                      <p className="text-[10px] text-slate-400">At {s.time_of_day || '09:00'} IST</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-[11px] italic">No automated schedule rules configured.</p>
            )}

            <div className="pt-2 border-t border-rose-50 flex flex-wrap gap-1.5">
              {pipeline.tags?.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 font-medium border border-slate-100">
                  <Tag size={9} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-white rounded-2xl border border-rose-100/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-rose-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Execution History</h3>
            <span className="text-[11px] text-slate-400 font-medium">({runs.length} logged runs)</span>
          </div>

          <div className="flex items-center gap-2.5">
            {selectedRuns.length === 2 ? (
              <button
                onClick={() => setShowComparison(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-xs shadow-purple-500/25 animate-pulse"
              >
                <GitCompare size={14} />
                Compare 2 Selected Runs
              </button>
            ) : (
              <span className="text-[10px] text-slate-400">
                Select 2 runs to compare side-by-side ({selectedRuns.length}/2)
              </span>
            )}
            {selectedRuns.length > 0 && (
              <button
                onClick={() => setSelectedRuns([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fff9fa] text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-rose-100">
              <tr>
                <th className="py-3 px-3 w-10 text-center">Compare</th>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Triggered Via</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Databricks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 text-xs">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No run logs found for this pipeline. Trigger a run to inspect execution.
                  </td>
                </tr>
              ) : (
                runs.map((r, idx) => {
                  const runKey = String(r.runId || r.databricks_run_id || r.id || idx);
                  const isSelected = selectedRuns.some(
                    (s) => String(s.runId || s.databricks_run_id || s.id) === runKey
                  );

                  const toggleSelect = () => {
                    if (isSelected) {
                      setSelectedRuns(selectedRuns.filter((s) => String(s.runId || s.databricks_run_id || s.id) !== runKey));
                    } else {
                      if (selectedRuns.length >= 2) {
                        setSelectedRuns([selectedRuns[1], r]);
                      } else {
                        setSelectedRuns([...selectedRuns, r]);
                      }
                    }
                  };

                  return (
                    <tr
                      key={runKey}
                      onClick={toggleSelect}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-50/50' : 'hover:bg-[#fffbfc]'
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={toggleSelect}
                          className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                        #{r.runId || r.databricks_run_id || r.id}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.state || r.resultState || r.status} />
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600 text-xs font-medium">
                        {r.triggerType || r.trigger_type || 'Manual'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {r.startTime || r.started_at
                          ? new Date(r.startTime || r.started_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                        {r.runDuration || r.duration_seconds
                          ? `${r.runDuration || r.duration_seconds}s`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {r.runPageUrl ? (
                          <a
                            href={r.runPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold hover:underline text-xs"
                          >
                            View run <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Comparison Modal */}
      {showComparison && selectedRuns.length === 2 && (
        <RunComparisonModal
          runA={selectedRuns[0]}
          runB={selectedRuns[1]}
          pipelineName={pipeline.name}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
