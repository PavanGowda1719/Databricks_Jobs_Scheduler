import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(true);

  // New holiday form
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [adding, setAdding] = useState(false);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.getHolidays(year);
      setHolidays(res.holidays || []);
    } catch (err) {
      console.error('Failed to load holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [year]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!name || !date) return;
    setAdding(true);
    try {
      await api.addHoliday({ name, date });
      setName('');
      setDate('');
      loadHolidays();
    } catch (err) {
      alert('Failed to add holiday');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this calendar holiday exception?')) return;
    try {
      await api.deleteHoliday(id);
      loadHolidays();
    } catch (err) {
      alert('Failed to delete holiday');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Indian Holiday Calendar</h2>
          <p className="text-sm text-slate-500">
            National and public holidays used to calculate valid business days for pipeline execution
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 self-start text-xs font-semibold">
          {[2025, 2026, 2027].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                year === y ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holidays Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-blue-600" />
              <h3 className="font-semibold text-sm text-slate-800">
                Official Holidays ({year}) — {holidays.length} Days
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Holiday Observance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {holidays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      {loading ? 'Loading holidays...' : 'No holidays recorded for this year.'}
                    </td>
                  </tr>
                ) : (
                  holidays.map((h) => {
                    const d = new Date(h.date + 'T00:00:00');
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">{h.date}</td>
                        <td className="py-3 px-4 text-slate-500">{dayName}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{h.name}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="text-slate-300 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
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

        {/* Add custom holiday form & Info */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">
              Add Custom Holiday
            </h3>
            <form onSubmit={handleAddHoliday} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Holiday Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karnataka Rajyotsava"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors shadow-xs"
              >
                {adding ? 'Saving...' : 'Add Exception'}
              </button>
            </form>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-800">
              <ShieldCheck size={16} />
              <span>Business Day Guarantee</span>
            </div>
            <p className="text-blue-800/80 leading-relaxed">
              When a pipeline is scheduled on the <strong>2nd business day</strong>, any date falling on a Saturday,
              Sunday, or any holiday in this list is skipped automatically. The execution is deferred to the next
              working business day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

