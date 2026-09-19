import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ShieldCheck, Plus, Trash2, Sun } from 'lucide-react';
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-rose-100 text-rose-600">
              <Sun size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Calendar Rules</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Indian Holiday Calendar</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            National and public holidays used to calculate valid business days for pipeline execution
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-100 shadow-2xs self-start text-xs font-semibold">
          {[2025, 2026, 2027].map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                year === y
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holidays Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-100/90 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-rose-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                Official Holidays ({year}) — {holidays.length} Days
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff9fa] text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-rose-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Holiday Observance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50 text-xs">
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
                      <tr key={h.id} className="hover:bg-[#fffbfc]">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">{h.date}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{dayName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 text-xs">{h.name}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50"
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
          <div className="bg-white p-5 rounded-2xl border border-rose-100/90 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Add Custom Holiday Exception
            </h3>
            <form onSubmit={handleAddHoliday} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Holiday Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karnataka Rajyotsava"
                  className="w-full p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-xs shadow-rose-500/20"
              >
                {adding ? 'Saving...' : 'Add Exception'}
              </button>
            </form>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <ShieldCheck size={16} />
              <span>Business Day Guarantee</span>
            </div>
            <p className="text-rose-900/80 leading-relaxed text-[11px]">
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
