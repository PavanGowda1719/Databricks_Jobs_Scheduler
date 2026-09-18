import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, CalendarCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New schedule form state
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [scheduleType, setScheduleType] = useState('nth_business_day');
  const [businessDayNumber, setBusinessDayNumber] = useState(2);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [cronExpr, setCronExpr] = useState('0 9 * * 1-5');
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    try {
      const [schedRes, pipeRes] = await Promise.all([
        api.getSchedules(),
        api.getPipelines(),
      ]);
      setSchedules(schedRes.schedules || []);
      setPipelines(pipeRes.pipelines || []);
      if (pipeRes.pipelines?.length > 0 && !selectedPipeline) {
        setSelectedPipeline(pipeRes.pipelines[0].id);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      await api.createSchedule({
        pipelineId: selectedPipeline,
        scheduleType,
        businessDayNumber: scheduleType === 'nth_business_day' ? Number(businessDayNumber) : null,
        cronExpression: scheduleType === 'cron' ? cronExpr : null,
        timeOfDay,
        skipHolidays,
      });

      setMessage({ type: 'success', text: 'Schedule configured successfully!' });
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage(null);
        loadData();
      }, 1200);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create schedule' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automated schedule?')) return;
    try {
      await api.deleteSchedule(id);
      loadData();
    } catch (err) {
      alert('Failed to delete schedule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Automation Schedules</h2>
          <p className="text-sm text-slate-500">
            Configure calendar rules, business day schedules, and holiday skip policies
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start"
        >
          <Plus size={15} />
          Add Schedule
        </button>
      </div>

      {/* Schedules List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Target Pipeline</th>
                <th className="py-3.5 px-4">Schedule Pattern</th>
                <th className="py-3.5 px-4">Execution Time</th>
                <th className="py-3.5 px-4">Holiday Awareness</th>
                <th className="py-3.5 px-4">Next Target Run</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No automated schedules active. Create a new schedule to run your pipelines.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  const pipe = pipelines.find((p) => p.id === s.pipeline_id);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900">{pipe?.name || s.pipeline_id}</div>
                        <div className="text-[11px] text-slate-400">ID: {s.pipeline_id}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        {s.schedule_type === 'nth_business_day' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <CalendarCheck size={13} />
                            {s.business_day_number}nd Business Day of Month
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono">
                            <Clock size={13} />
                            {s.cron_expression}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono">
                        {s.time_of_day || '09:00'} IST
                      </td>
                      <td className="py-4 px-4">
                        {s.skip_holidays ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px]">
                            ✓ Skip Indian Holidays
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Calendar only</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono">
                        {s.next_run_at ? new Date(s.next_run_at).toLocaleString() : 'Calculated on trigger'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Delete schedule"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Configure Pipeline Automation</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Pipeline</label>
                <select
                  value={selectedPipeline}
                  onChange={(e) => setSelectedPipeline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Schedule Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleType('nth_business_day')}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                      scheduleType === 'nth_business_day'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold">Nth Business Day</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">e.g. 2nd business day of the month</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleType('cron')}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
                      scheduleType === 'cron'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold">Cron Expression</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Custom interval or time pattern</div>
                  </button>
                </div>
              </div>

              {scheduleType === 'nth_business_day' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Business Day (1-28)</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={businessDayNumber}
                      onChange={(e) => setBusinessDayNumber(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Run Time (IST)</label>
                    <input
                      type="time"
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cron Expression</label>
                  <input
                    type="text"
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    placeholder="0 9 * * 1-5"
                    className="w-full font-mono text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: 0 9 * * 1-5 (Mon-Fri at 9:00 AM)</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="skipHolidays"
                  checked={skipHolidays}
                  onChange={(e) => setSkipHolidays(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="skipHolidays" className="text-xs text-slate-700 font-medium">
                  Skip official Indian public holidays (automatically moves to next valid business day)
                </label>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}
                >
                  {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
