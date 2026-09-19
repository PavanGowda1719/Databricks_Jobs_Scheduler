const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const auditService = require('../services/auditService');

// GET /api/alerts/config
router.get('/config', (req, res) => {
  const config = alertService.getSettings();
  res.json(config);
});

// POST /api/alerts/config
router.post('/config', (req, res, next) => {
  try {
    const updated = alertService.saveSettings(req.body);
    auditService.log({
      action: 'UPDATE_ALERT_CONFIG',
      entityType: 'SETTINGS',
      entityId: 'ALERT',
      user: req.body.user || 'Pavan Gowda',
      details: `Alert settings updated: enabled=${updated.enabled}, webhook_type=${updated.webhook_type}`,
      status: 'SUCCESS',
    });
    res.json({ success: true, settings: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/test
router.post('/test', async (req, res, next) => {
  try {
    const { url } = req.body;
    const result = await alertService.testAlert(url);
    auditService.log({
      action: 'TEST_WEBHOOK_ALERT',
      entityType: 'SETTINGS',
      entityId: 'ALERT',
      user: req.body.user || 'Pavan Gowda',
      details: `Dispatched test alert to webhook`,
      status: 'SUCCESS',
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

