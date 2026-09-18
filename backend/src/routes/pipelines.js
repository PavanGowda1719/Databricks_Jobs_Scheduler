const express = require('express');
const router = express.Router();
const databricksService = require('../services/databricksService');
const db = require('../db/database');
const pipelineConfig = require('../config/pipelines.json');

// GET /api/pipelines
router.get('/', async (req, res, next) => {
  try {
    const pipelines = await Promise.all(pipelineConfig.pipelines.map(async p => {
      let runs = db.query('run_history', {
        filter: { pipeline_id: p.id }, sort: 'started_at', order: 'desc', limit: 1,
      });

      let latest = runs[0] || null;

      // If status is RUNNING/PENDING, check Databricks directly
      if (latest && (latest.status === 'RUNNING' || latest.status === 'PENDING') && latest.databricks_run_id) {
        try {
          const status = await databricksService.getRunStatus(p.workspace, latest.databricks_run_id);
          const resultState = status.resultState || status.state;
          if (resultState && resultState !== latest.status) {
            latest = db.update('run_history', latest.id, {
              status: resultState,
              completed_at: status.endTime,
              duration_seconds: status.runDuration,
            });
          }
        } catch (e) {}
      }

      const schedules = db.getAll('schedules', { pipeline_id: p.id }).filter(s => s.enabled);
      return { ...p, latestRun: latest, schedules, status: latest?.status || 'NEVER_RUN' };
    }));

    res.json({ pipelines });
  } catch (err) { next(err); }
});

// GET /api/pipelines/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pipeline = pipelineConfig.pipelines.find(p => p.id === req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    const runs = db.query('run_history', {
      filter: { pipeline_id: pipeline.id }, sort: 'started_at', order: 'desc', limit: 50,
    });
    const schedules = db.getAll('schedules', { pipeline_id: pipeline.id });

    let databricksJob = null;
    try { databricksJob = await databricksService.getJob(pipeline.workspace, pipeline.databricksJobId); } catch {}

    res.json({ ...pipeline, runs, schedules, databricksJob, status: runs[0]?.status || 'NEVER_RUN' });
  } catch (err) { next(err); }
});

// POST /api/pipelines/:id/trigger
router.post('/:id/trigger', async (req, res, next) => {
  try {
    const pipeline = pipelineConfig.pipelines.find(p => p.id === req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    const params = req.body.params || pipeline.defaultParams || {};

    const historyRecord = db.insert('run_history', {
      pipeline_id: pipeline.id,
      databricks_run_id: null,
      status: 'PENDING',
      trigger_type: 'manual',
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_seconds: null,
      error_message: null,
      triggered_by: req.body.triggeredBy || 'user',
    });

    const runData = await databricksService.triggerJob(pipeline.workspace, pipeline.databricksJobId, params);

    db.update('run_history', historyRecord.id, { databricks_run_id: runData.run_id, status: 'RUNNING' });

    res.json({
      success: true,
      message: `Pipeline "${pipeline.name}" triggered successfully`,
      runId: runData.run_id,
      historyId: historyRecord.id,
    });
  } catch (err) { next(err); }
});

// GET /api/pipelines/:id/runs
router.get('/:id/runs', async (req, res, next) => {
  try {
    const pipeline = pipelineConfig.pipelines.find(p => p.id === req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    let databricksRuns = [];
    try {
      databricksRuns = await databricksService.listJobRuns(pipeline.workspace, pipeline.databricksJobId, 20);
    } catch {}

    const localRuns = db.query('run_history', {
      filter: { pipeline_id: pipeline.id }, sort: 'started_at', order: 'desc', limit: 50,
    });

    res.json({ databricksRuns, localRuns });
  } catch (err) { next(err); }
});

// GET /api/pipelines/:id/status/:runId
router.get('/:id/status/:runId', async (req, res, next) => {
  try {
    const pipeline = pipelineConfig.pipelines.find(p => p.id === req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    const status = await databricksService.getRunStatus(pipeline.workspace, req.params.runId);
    const resultState = status.resultState || status.state;

    // Update local record
    const localRun = db.findOne('run_history', { databricks_run_id: Number(req.params.runId) });
    if (localRun) {
      db.update('run_history', localRun.id, {
        status: resultState,
        completed_at: status.endTime,
        duration_seconds: status.runDuration,
      });
    }

    res.json(status);
  } catch (err) { next(err); }
});

module.exports = router;

