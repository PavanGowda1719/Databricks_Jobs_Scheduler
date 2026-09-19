const express = require('express');
const router = express.Router();
const schedulerService = require('../services/schedulerService');
const auditService = require('../services/auditService');

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
    const { pipelineId, scheduleType, cronExpression, businessDayNumber, timeOfDay, skipHolidays, runAt, user } = req.body;

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

    auditService.log({
      action: 'CREATE_SCHEDULE',
      entityType: 'SCHEDULE',
      entityId: schedule.id,
      user: user || 'Pavan Gowda',
      details: `Created ${scheduleType} schedule for pipeline "${pipelineId}" (Time: ${timeOfDay || '09:00'})`,
      status: 'SUCCESS',
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

    auditService.log({
      action: 'UPDATE_SCHEDULE',
      entityType: 'SCHEDULE',
      entityId: req.params.id,
      user: req.body.user || 'Pavan Gowda',
      details: `Updated schedule #${req.params.id} enabled=${schedule.enabled}`,
      status: 'SUCCESS',
    });

    res.json({ success: true, schedule });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/schedules/:id — delete a schedule
router.delete('/:id', (req, res, next) => {
  try {
    schedulerService.deleteSchedule(Number(req.params.id));

    auditService.log({
      action: 'DELETE_SCHEDULE',
      entityType: 'SCHEDULE',
      entityId: req.params.id,
      user: req.query.user || 'Pavan Gowda',
      details: `Deleted schedule #${req.params.id}`,
      status: 'SUCCESS',
    });

    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

