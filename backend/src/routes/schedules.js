const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');

// GET /api/schedules — list all schedules
router.get('/', (req, res) => {
  const schedules = schedulerService.getSchedules();
  res.json({ schedules });
});

// GET /api/schedules/pipeline/:pipelineId — schedules for a pipeline
router.get('/pipeline/:pipelineId', (req, res) => {
  const schedules = schedulerService.getSchedulesByPipeline(req.params.pipelineId);
  res.json({ schedules });
});

// POST /api/schedules — create a new schedule
router.post('/', (req, res, next) => {
  try {
    const { pipelineId, scheduleType, cronExpression, businessDayNumber, timeOfDay, skipHolidays, runAt } = req.body;

    if (!pipelineId || !scheduleType) {
      return res.status(400).json({ error: 'pipelineId and scheduleType are required' });
    }

    if (scheduleType === 'cron' && !cronExpression) {
      return res.status(400).json({ error: 'cronExpression is required for cron schedules' });
    }

    if (scheduleType === 'nth_business_day' && !businessDayNumber) {
      return res.status(400).json({ error: 'businessDayNumber is required for nth_business_day schedules' });
    }

    const schedule = schedulerService.createSchedule({
      pipelineId,
      scheduleType,
      cronExpression,
      businessDayNumber,
      timeOfDay,
      skipHolidays,
      runAt,
    });

    res.status(201).json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
});

// PUT /api/schedules/:id — update a schedule
router.put('/:id', (req, res, next) => {
  try {
    const schedule = schedulerService.updateSchedule(Number(req.params.id), req.body);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/schedules/:id — delete a schedule
router.delete('/:id', (req, res, next) => {
  try {
    schedulerService.deleteSchedule(Number(req.params.id));
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

