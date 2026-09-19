const db = require('../db/database');

class AuditService {
  log({ action, entityType, entityId, user = 'Pavan Gowda', details = '', status = 'SUCCESS' }) {
    try {
      const record = db.insert('audit_logs', {
        action,
        entity_type: entityType,
        entity_id: String(entityId || ''),
        user,
        details,
        status,
        timestamp: new Date().toISOString(),
      });
      return record;
    } catch (err) {
      console.error('Failed to write audit log:', err.message);
      return null;
    }
  }

  getLogs({ entityType, action, limit = 100 } = {}) {
    let filter = null;
    if (entityType) filter = { entity_type: entityType };
    if (action) filter = { ...filter, action };

    const logs = db.query('audit_logs', {
      filter,
      sort: 'timestamp',
      order: 'desc',
      limit,
    });
    return logs;
  }
}

module.exports = new AuditService();

