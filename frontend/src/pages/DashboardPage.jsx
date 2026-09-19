import { useState, useEffect } from 'react';
import { Layers, CheckCircle, XCircle, RefreshCw, Clock, ArrowUpRight, Zap, GitMerge, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../api/client';
import StatsCard from '../components/dashboard/StatsCard';
import StatusBadge from '../components/pipelines/StatusBadge';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const [workspace, setWorkspace] = useState(() => localStorage.getItem('activeWorkspace') || 'all');

  useEffect(() => {
    const handleWs = (e) => setWorkspace(e.detail || 'all');
    window.addEventListener('workspaceChanged', handleWs);
    return () => window.removeEventListener('workspaceChanged', handleWs);
  }, []);

  const today = stats?.todayStats || { total: 0, succeeded: 0, failed: 0, running: 0, waiting: 0, blocked: 0 };
  const trendData = stats?.trend || [];
  const recentRuns = stats?.recentRuns || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-rose-100 text-rose-600">
              <Zap size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Operations Control</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {workspace === 'all' ? '🌐 All Environments' : `Environment: ${workspace.toUpperCase()}`}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Databricks Orchestration Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time DAG execution, smart business scheduling, and telemetry</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-rose-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-rose-50/50 hover:border-rose-200 transition-all shadow-2xs self-start"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-rose-500' : 'text-slate-400'} />
          Refresh Metrics
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pipelines"
          value={stats?.totalPipelines ?? 0}
          icon={Layers}
          color="rose"
          subtitle="Registered DAGs"
        />
        <StatsCard
          title="Succeeded Today"
          value={today.succeeded}
          icon={CheckCircle}
          color="emerald"
          subtitle={`${today.total} runs logged`}
        />
        <StatsCard
          title="Active Runs"
          value={today.running}
          icon={Clock}
          color="pink"
          subtitle={today.running > 0 ? 'Executing now' : 'Idle'}
        />
        <StatsCard
          title="Waiting / Blocked"
          value={(today.waiting || 0) + (today.blocked || 0)}
          icon={GitMerge}
          color="purple"
          subtitle={`${today.waiting || 0} waiting • ${today.blocked || 0} blocked`}
        />
      </div>

      {/* Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-100/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                7-Day Execution Activity
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pipeline execution throughput and success volume</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Total Runs
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Succeeded
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSucc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fff1f2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderRadius: '12px',
                      border: '1px solid #fda4af',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" name="Total Runs" />
                  <Area type="monotone" dataKey="succeeded" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSucc)" name="Succeeded" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No activity trend recorded yet. Trigger runs to populate metrics!
              </div>
            )}
          </div>
        </div>

        {/* Recent Runs List */}
        <div className="bg-white rounded-2xl border border-rose-100/90 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Executions</h3>
            <Link to="/pipelines" className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="flex-1 overflow-auto space-y-2.5">
            {recentRuns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent pipeline runs recorded</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="p-3 bg-[#fffafa] rounded-xl border border-rose-100/60 hover:border-rose-200 transition-all flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-800 truncate">{run.pipeline_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Via {run.triggered_by}
                    </p>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
