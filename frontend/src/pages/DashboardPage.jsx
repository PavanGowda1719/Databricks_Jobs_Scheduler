import { useState, useEffect } from 'react';
import { Layers, CheckCircle, XCircle, RefreshCw, Clock, ArrowUpRight } from 'lucide-react';
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

  const today = stats?.todayStats || { total: 0, succeeded: 0, failed: 0, running: 0 };
  const trendData = stats?.trend || [];
  const recentRuns = stats?.recentRuns || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pipeline Operations Dashboard</h2>
          <p className="text-sm text-slate-500">Live operational status and execution metrics</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-2xs self-start"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Pipelines"
          value={stats?.totalPipelines ?? 0}
          icon={Layers}
          color="blue"
          subtitle="Registered"
        />
        <StatsCard
          title="Succeeded Today"
          value={today.succeeded}
          icon={CheckCircle}
          color="emerald"
          subtitle={`${today.total} runs total`}
        />
        <StatsCard
          title="Failed Today"
          value={today.failed}
          icon={XCircle}
          color="rose"
          subtitle={today.failed > 0 ? 'Requires attention' : 'All clear'}
        />
        <StatsCard
          title="Active Runs"
          value={today.running}
          icon={Clock}
          color="amber"
          subtitle="In progress"
        />
      </div>

      {/* Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              7-Day Execution Activity
            </h3>
            <p className="text-xs text-slate-500">Total pipeline runs over the past week</p>
          </div>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSucc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Runs" />
                  <Area type="monotone" dataKey="succeeded" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSucc)" name="Succeeded" />
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
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Recent Executions</h3>
            <Link to="/pipelines" className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="flex-1 overflow-auto space-y-3">
            {recentRuns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent pipeline runs recorded</p>
            ) : (
              recentRuns.map((run) => (
                <div key={run.id} className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-medium text-slate-800 truncate">{run.pipeline_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • By {run.triggered_by}
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

