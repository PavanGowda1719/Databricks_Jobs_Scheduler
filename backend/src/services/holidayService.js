const db = require('../db/database');

// Indian Public Holidays 2025-2027
const INDIAN_HOLIDAYS = [
  // 2025
  { date: '2025-01-26', name: 'Republic Day', year: 2025 },
  { date: '2025-03-14', name: 'Holi', year: 2025 },
  { date: '2025-03-31', name: 'Eid ul-Fitr', year: 2025 },
  { date: '2025-04-06', name: 'Ram Navami', year: 2025 },
  { date: '2025-04-10', name: 'Mahavir Jayanti', year: 2025 },
  { date: '2025-04-14', name: 'Dr. Ambedkar Jayanti', year: 2025 },
  { date: '2025-04-18', name: 'Good Friday', year: 2025 },
  { date: '2025-05-01', name: 'May Day / Labour Day', year: 2025 },
  { date: '2025-05-12', name: 'Buddha Purnima', year: 2025 },
  { date: '2025-06-07', name: 'Eid ul-Adha', year: 2025 },
  { date: '2025-07-06', name: 'Muharram', year: 2025 },
  { date: '2025-08-15', name: 'Independence Day', year: 2025 },
  { date: '2025-08-16', name: 'Janmashtami', year: 2025 },
  { date: '2025-09-05', name: 'Milad-un-Nabi', year: 2025 },
  { date: '2025-10-02', name: 'Gandhi Jayanti / Dussehra', year: 2025 },
  { date: '2025-10-20', name: 'Diwali', year: 2025 },
  { date: '2025-10-21', name: 'Diwali (Day 2)', year: 2025 },
  { date: '2025-11-05', name: 'Guru Nanak Jayanti', year: 2025 },
  { date: '2025-12-25', name: 'Christmas', year: 2025 },
  // 2026
  { date: '2026-01-26', name: 'Republic Day', year: 2026 },
  { date: '2026-03-03', name: 'Holi', year: 2026 },
  { date: '2026-03-20', name: 'Eid ul-Fitr', year: 2026 },
  { date: '2026-03-26', name: 'Ram Navami', year: 2026 },
  { date: '2026-03-31', name: 'Mahavir Jayanti', year: 2026 },
  { date: '2026-04-03', name: 'Good Friday', year: 2026 },
  { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', year: 2026 },
  { date: '2026-05-01', name: 'May Day / Labour Day', year: 2026 },
  { date: '2026-05-27', name: 'Eid ul-Adha', year: 2026 },
  { date: '2026-05-31', name: 'Buddha Purnima', year: 2026 },
  { date: '2026-06-26', name: 'Muharram', year: 2026 },
  { date: '2026-08-06', name: 'Janmashtami', year: 2026 },
  { date: '2026-08-15', name: 'Independence Day', year: 2026 },
  { date: '2026-08-26', name: 'Milad-un-Nabi', year: 2026 },
  { date: '2026-10-02', name: 'Gandhi Jayanti', year: 2026 },
  { date: '2026-10-19', name: 'Dussehra', year: 2026 },
  { date: '2026-11-08', name: 'Diwali', year: 2026 },
  { date: '2026-11-09', name: 'Diwali (Day 2)', year: 2026 },
  { date: '2026-11-26', name: 'Guru Nanak Jayanti', year: 2026 },
  { date: '2026-12-25', name: 'Christmas', year: 2026 },
  // 2027
  { date: '2027-01-26', name: 'Republic Day', year: 2027 },
  { date: '2027-03-10', name: 'Eid ul-Fitr', year: 2027 },
  { date: '2027-03-22', name: 'Holi', year: 2027 },
  { date: '2027-03-26', name: 'Good Friday', year: 2027 },
  { date: '2027-04-14', name: 'Dr. Ambedkar Jayanti', year: 2027 },
  { date: '2027-04-15', name: 'Ram Navami', year: 2027 },
  { date: '2027-04-19', name: 'Mahavir Jayanti', year: 2027 },
  { date: '2027-05-01', name: 'May Day / Labour Day', year: 2027 },
  { date: '2027-05-17', name: 'Eid ul-Adha', year: 2027 },
  { date: '2027-05-20', name: 'Buddha Purnima', year: 2027 },
  { date: '2027-06-16', name: 'Muharram', year: 2027 },
  { date: '2027-08-15', name: 'Independence Day', year: 2027 },
  { date: '2027-08-25', name: 'Janmashtami', year: 2027 },
  { date: '2027-10-02', name: 'Gandhi Jayanti', year: 2027 },
  { date: '2027-10-08', name: 'Dussehra', year: 2027 },
  { date: '2027-10-29', name: 'Diwali', year: 2027 },
  { date: '2027-10-30', name: 'Diwali (Day 2)', year: 2027 },
  { date: '2027-11-15', name: 'Guru Nanak Jayanti', year: 2027 },
  { date: '2027-12-25', name: 'Christmas', year: 2027 },
];

class HolidayService {
  constructor() {
    this._seedHolidays();
  }

  _seedHolidays() {
    const existing = db.getAll('holidays');
    if (existing.length === 0) {
      for (const h of INDIAN_HOLIDAYS) {
        db.insert('holidays', { date: h.date, name: h.name, country: 'IN', year: h.year });
      }
      console.log(`📅 Seeded ${INDIAN_HOLIDAYS.length} Indian holidays`);
    } else {
      console.log(`📅 ${existing.length} holidays already loaded`);
    }
  }

  getHolidays(year = null) {
    if (year) {
      return db.getAll('holidays', { year });
    }
    return db.query('holidays', { sort: 'date' });
  }

  isHoliday(dateStr) {
    return !!db.findOne('holidays', { date: dateStr });
  }

  isBusinessDay(date) {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const dateStr = d.toISOString().split('T')[0];
    return !this.isHoliday(dateStr);
  }

  getNthBusinessDay(year, month, n) {
    let count = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      if (this.isBusinessDay(date)) {
        count++;
        if (count === n) return date;
      }
    }
    return null;
  }

  getNextNthBusinessDay(n, fromDate = new Date()) {
    const now = fromDate;
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    const thisMonth = this.getNthBusinessDay(year, month, n);
    if (thisMonth && thisMonth > now) return thisMonth;

    month++;
    if (month > 12) { month = 1; year++; }
    return this.getNthBusinessDay(year, month, n);
  }

  addHoliday(date, name, country = 'IN') {
    const year = new Date(date).getFullYear();
    if (db.findOne('holidays', { date })) return null; // duplicate
    return db.insert('holidays', { date, name, country, year });
  }

  deleteHoliday(id) {
    return db.delete('holidays', id);
  }
}

module.exports = new HolidayService();

