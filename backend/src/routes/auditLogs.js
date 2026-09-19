const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');

// GET /api/audit-logs
router.get('/', (req, res, next) => {
  try {
    const { entityType, action, limit } = req.query;
    const logs = auditService.getLogs({
      entityType,
      action,
      limit: limit ? Number(limit) : 100,
    });
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

