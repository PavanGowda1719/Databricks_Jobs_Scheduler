import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink, CalendarClock, Activity, Layers, Tag } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/pipelines/StatusBadge';
import TriggerButton from '../components/pipelines/TriggerButton';

export default function PipelineDetailPage() {
  const { id } = useParams();
  const [pipeline, setPipeline] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="text-sm text-slate-500 py-8">Loading pipeline specifications...</div>;
  }

  if (!pipeline) {
    return (
      <div className="space-y-4">
        <Link to="/pipelines" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
          <ArrowLeft size={14} /> Back to pipelines
        </Link>
        <p className="text-slate-600 text-sm">Pipeline with ID "{id}" was not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link & Header */}
      <div>
        <Link
          to="/pipelines"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors mb-2"
        >
          <ArrowLeft size={14} /> Back to all pipelines
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{pipeline.name}</h2>
              <StatusBadge status={pipeline.status} />
            </div>
            <p className="text-sm text-slate-500 mt-1">{pipeline.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDetails}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-2xs"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
            <TriggerButton
              pipelineId={pipeline.id}
              pipelineName={pipeline.name}
              onTriggered={loadDetails}
              variant="primary"
            />
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Specification</p>
          <div className="mt-2 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Databricks Job ID:</span>
              <span className="font-mono font-medium">{pipeline.databricksJobId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Workspace:</span>
              <span className="font-medium uppercase">{pipeline.workspace}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-medium">{pipeline.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Owner:</span>
              <span className="font-medium">{pipeline.owner}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Schedules & Automation</p>
          <div className="mt-2 text-xs text-slate-700">
            {pipeline.schedules?.length > 0 ? (
              <div className="space-y-2">
                {pipeline.schedules.map((s) => (
                  <div key={s.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center gap-2">
                    <CalendarClock size={15} className="text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-800">
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
              <p className="text-slate-400 italic">No automated schedule rules configured.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metadata & Tags</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pipeline.tags?.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                <Tag size={11} /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Execution History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-800">Execution History</h3>
          </div>
          <span className="text-xs text-slate-400">Showing recent executions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Triggered Via</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Databricks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No run logs found for this pipeline. Trigger a run to inspect execution.
                  </td>
                </tr>
              ) : (
                runs.map((r, idx) => (
                  <tr key={r.runId || r.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      #{r.runId || r.databricks_run_id || r.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.state || r.resultState || r.status} />
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600">
                      {r.triggerType || r.trigger_type || 'Manual'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.startTime || r.started_at
                        ? new Date(r.startTime || r.started_at).toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {r.runDuration || r.duration_seconds
                        ? `${r.runDuration || r.duration_seconds}s`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.runPageUrl ? (
                        <a
                          href={r.runPageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          View run <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
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
