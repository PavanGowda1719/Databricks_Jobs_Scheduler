const express = require('express');
const router = express.Router();
const holidayService = require('../services/holidayService');
const auditService = require('../services/auditService');

// GET /api/holidays — list all holidays
router.get('/', (req, res) => {
  const year = req.query.year ? Number(req.query.year) : null;
  const holidays = holidayService.getHolidays(year);
  res.json({ holidays });
});

// GET /api/holidays/check/:date — check if a date is a holiday
router.get('/check/:date', (req, res) => {
  const isHoliday = holidayService.isHoliday(req.params.date);
  const isBusinessDay = holidayService.isBusinessDay(req.params.date);
  res.json({ date: req.params.date, isHoliday, isBusinessDay });
});

// GET /api/holidays/nth-business-day — get Nth business day of a month
router.get('/nth-business-day', (req, res) => {
  const { year, month, n } = req.query;
  if (!year || !month || !n) {
    return res.status(400).json({ error: 'year, month, and n are required' });
  }
  const date = holidayService.getNthBusinessDay(Number(year), Number(month), Number(n));
  res.json({
    year: Number(year),
    month: Number(month),
    nthBusinessDay: Number(n),
    date: date ? date.toISOString().split('T')[0] : null,
  });
});

// POST /api/holidays — add a custom holiday
router.post('/', (req, res, next) => {
  try {
    const { date, name, country, user } = req.body;
    if (!date || !name) {
      return res.status(400).json({ error: 'date and name are required' });
    }
    holidayService.addHoliday(date, name, country);

    auditService.log({
      action: 'ADD_HOLIDAY_EXCEPTION',
      entityType: 'HOLIDAY',
      entityId: date,
      user: user || 'Pavan Gowda',
      details: `Added holiday exception: "${name}" on ${date}`,
      status: 'SUCCESS',
    });

    res.status(201).json({ success: true, message: `Holiday "${name}" added` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/holidays/:id — delete a holiday
router.delete('/:id', (req, res, next) => {
  try {
    holidayService.deleteHoliday(Number(req.params.id));

    auditService.log({
      action: 'DELETE_HOLIDAY_EXCEPTION',
      entityType: 'HOLIDAY',
      entityId: req.params.id,
      user: req.query.user || 'Pavan Gowda',
      details: `Deleted holiday exception #${req.params.id}`,
      status: 'SUCCESS',
    });

    res.json({ success: true, message: 'Holiday deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

