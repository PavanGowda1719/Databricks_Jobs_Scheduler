import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Search, Shield, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({ limit: 150 });
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
      (log.user && log.user.toLowerCase().includes(search.toLowerCase())) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(search.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['ALL', ...new Set(logs.map((l) => l.action).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-rose-100 text-rose-600">
              <Shield size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Compliance & Governance</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all user actions, pipeline executions, schedule modifications, and system triggers
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-rose-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-rose-50/50 hover:border-rose-200 transition-all shadow-2xs self-start"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-rose-500' : 'text-slate-400'} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-white p-3 rounded-2xl border border-rose-100 shadow-xs w-full">
          <Search size={16} className="text-rose-400 ml-1.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by user, pipeline, entity, or details..."
            className="w-full text-xs font-medium outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Action Dropdown */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-white border border-rose-100 text-slate-700 text-xs font-semibold px-4 py-3 rounded-2xl shadow-xs outline-none focus:ring-2 focus:ring-rose-400/50 cursor-pointer"
        >
          {uniqueActions.map((act) => (
            <option key={act} value={act}>
              {act === 'ALL' ? 'All Operations' : act}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-rose-100/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fff9fa] text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-rose-100">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? 'Loading audit records...' : 'No audit events recorded matching your query.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isFail = log.status === 'FAILED' || log.status === 'BLOCKED';
                  return (
                    <tr key={log.id} className="hover:bg-[#fffbfc] transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        <div className="font-mono text-slate-700 font-medium">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                          <User size={13} className="text-rose-400 shrink-0" />
                          <span>{log.user}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-rose-700 text-[11px]">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                            ({log.entity_id})
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isFail
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : log.status === 'WAITING'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-5 text-slate-600 text-[11px] max-w-md truncate">
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

