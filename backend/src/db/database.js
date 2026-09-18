const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default store shape
const DEFAULT_STORE = {
  schedules: [],
  run_history: [],
  holidays: [],
  _nextId: { schedules: 1, run_history: 1, holidays: 1 },
};

class JsonStore {
  constructor() {
    if (fs.existsSync(DB_FILE)) {
      try {
        this._data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        // ensure all keys exist
        for (const key of Object.keys(DEFAULT_STORE)) {
          if (!(key in this._data)) this._data[key] = DEFAULT_STORE[key];
        }
      } catch {
        this._data = { ...DEFAULT_STORE };
      }
    } else {
      this._data = { ...DEFAULT_STORE };
    }
    this._save();
  }

  _save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this._data, null, 2), 'utf8');
  }

  _nextId(table) {
    const id = this._data._nextId[table] || 1;
    this._data._nextId[table] = id + 1;
    return id;
  }

  // --- Generic CRUD ---
  getAll(table, filter = null) {
    let rows = this._data[table] || [];
    if (filter) {
      rows = rows.filter(row => {
        for (const [k, v] of Object.entries(filter)) {
          if (row[k] !== v) return false;
        }
        return true;
      });
    }
    return rows;
  }

  getById(table, id) {
    return (this._data[table] || []).find(r => r.id === id) || null;
  }

  insert(table, record) {
    const id = this._nextId(table);
    const row = { id, ...record };
    this._data[table].push(row);
    this._save();
    return row;
  }

  update(table, id, updates) {
    const idx = (this._data[table] || []).findIndex(r => r.id === id);
    if (idx === -1) return null;
    this._data[table][idx] = { ...this._data[table][idx], ...updates };
    this._save();
    return this._data[table][idx];
  }

  delete(table, id) {
    const before = (this._data[table] || []).length;
    this._data[table] = (this._data[table] || []).filter(r => r.id !== id);
    this._save();
    return (this._data[table] || []).length < before;
  }

  // Find first matching record
  findOne(table, filter) {
    return (this._data[table] || []).find(row => {
      for (const [k, v] of Object.entries(filter)) {
        if (row[k] !== v) return false;
      }
      return true;
    }) || null;
  }

  // Query with sort and limit
  query(table, { filter, sort, limit, order } = {}) {
    let rows = this.getAll(table, filter);
    if (sort) {
      rows.sort((a, b) => {
        const valA = a[sort] || '';
        const valB = b[sort] || '';
        if (order === 'desc') return valB > valA ? 1 : valB < valA ? -1 : 0;
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      });
    }
    if (limit) rows = rows.slice(0, limit);
    return rows;
  }

  // Count records with optional filter
  count(table, filter = null) {
    return this.getAll(table, filter).length;
  }
}

module.exports = new JsonStore();

