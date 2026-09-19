const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const databricksService = require('../services/databricksService');
const dependencyService = require('../services/dependencyService');
const auditService = require('../services/auditService');
const db = require('../db/database');
const pipelineConfig = require('../config/pipelines.json');

// POST /api/pipelines — register a new pipeline definition
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      description,
      databricksJobId,
      workspace = 'dev',
      category = 'ETL',
      tags = [],
      owner = 'data-team',
      slaMinutes = 60,
      defaultParams = {},
      upstreamDependencies = [],
      user = 'Pavan Gowda',
    } = req.body;

    if (!name || !databricksJobId) {
      return res.status(400).json({ error: 'Pipeline name and databricksJobId are required.' });
    }

    const configPath = path.join(__dirname, '..', 'config', 'pipelines.json');
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const rawId = req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let finalId = rawId;
    let counter = 1;
    while (currentConfig.pipelines.some(p => p.id === finalId)) {
      finalId = `${rawId}-${counter++}`;
    }

    const newPipeline = {
      id: finalId,
      name,
      description: description || `Databricks pipeline for ${name}`,
      databricksJobId: Number(databricksJobId),
      workspace,
      category,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      owner,
      slaMinutes: Number(slaMinutes) || 60,
      defaultParams: typeof defaultParams === 'object' ? defaultParams : {},
      upstreamDependencies: Array.isArray(upstreamDependencies) ? upstreamDependencies : [],
    };

    currentConfig.pipelines.push(newPipeline);
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf8');

    // Update in-memory reference
    pipelineConfig.pipelines = currentConfig.pipelines;

    auditService.log({
      action: 'CREATE_PIPELINE',
      entityType: 'PIPELINE',
      entityId: newPipeline.id,
      user,
      details: `Created new pipeline "${name}" (Job ID: ${databricksJobId}, Workspace: ${workspace})`,
      status: 'SUCCESS',
    });

    res.status(201).json({ success: true, pipeline: newPipeline });
  } catch (err) {
    next(err);
  }
});

// GET /api/pipelines/dependencies/graph
router.get('/dependencies/graph', (req, res) => {
  try {
    const graph = dependencyService.getDependencyGraph();
    res.json(graph);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

            if (resultState !== 'RUNNING' && resultState !== 'PENDING') {
              await dependencyService.processDependencyChain(p.id, resultState, databricksService);
            }
          }
        } catch (e) {}
      }

      const schedules = db.getAll('schedules', { pipeline_id: p.id }).filter(s => s.enabled);
      const dependencyCheck = dependencyService.checkUpstreamStatus(p.id);
      const downstreamPipelines = dependencyService.getDownstreamPipelines(p.id).map(d => ({
        id: d.id,
        name: d.name,
      }));

      return {
        ...p,
        latestRun: latest,
        schedules,
        status: latest?.status || 'NEVER_RUN',
        upstreamDependencies: p.upstreamDependencies || [],
        dependencyCheck,
        downstreamPipelines,
      };
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
    const dependencyCheck = dependencyService.checkUpstreamStatus(pipeline.id);
    const downstreamPipelines = dependencyService.getDownstreamPipelines(pipeline.id).map(d => ({
      id: d.id,
      name: d.name,
    }));

    let databricksJob = null;
    try { databricksJob = await databricksService.getJob(pipeline.workspace, pipeline.databricksJobId); } catch {}

    res.json({
      ...pipeline,
      runs,
      schedules,
      databricksJob,
      status: runs[0]?.status || 'NEVER_RUN',
      upstreamDependencies: pipeline.upstreamDependencies || [],
      dependencyCheck,
      downstreamPipelines,
    });
  } catch (err) { next(err); }
});

// POST /api/pipelines/:id/trigger
router.post('/:id/trigger', async (req, res, next) => {
  try {
    const pipeline = pipelineConfig.pipelines.find(p => p.id === req.params.id);
    if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });

    const params = req.body.params || pipeline.defaultParams || {};
    const force = req.body.force === true;

    // Optional Upstream Dependency Validation
    if (!force) {
      const depCheck = dependencyService.checkUpstreamStatus(pipeline.id);

      if (depCheck.hasDependencies) {
        if (depCheck.status === 'BLOCKED') {
          auditService.log({
            action: 'TRIGGER_PIPELINE_BLOCKED',
            entityType: 'PIPELINE',
            entityId: pipeline.id,
            user: req.body.triggeredBy || 'Pavan Gowda',
            details: `Trigger blocked by upstream failure: ${depCheck.message}`,
            status: 'BLOCKED',
          });
          return res.status(409).json({
            success: false,
            blocked: true,
            status: 'BLOCKED',
            message: `Execution blocked: ${depCheck.message}. Resolve upstream issues or run with Force Bypass.`,
            depCheck,
          });
        }

        if (depCheck.status === 'WAITING') {
          const historyRecord = db.insert('run_history', {
            pipeline_id: pipeline.id,
            databricks_run_id: null,
            status: 'WAITING_FOR_UPSTREAM',
            trigger_type: 'manual',
            started_at: new Date().toISOString(),
            completed_at: null,
            duration_seconds: null,
            error_message: depCheck.message,
            triggered_by: req.body.triggeredBy || 'user',
          });

          auditService.log({
            action: 'QUEUE_PIPELINE_WAITING',
            entityType: 'PIPELINE',
            entityId: pipeline.id,
            user: req.body.triggeredBy || 'Pavan Gowda',
            details: `Queued run #${historyRecord.id} waiting for upstream: ${depCheck.message}`,
            status: 'WAITING',
          });

          return res.json({
            success: true,
            waiting: true,
            status: 'WAITING_FOR_UPSTREAM',
            message: `Pipeline queued! Waiting for upstream (${depCheck.message}). It will automatically trigger upon upstream success.`,
            historyId: historyRecord.id,
            depCheck,
          });
        }
      }
    }

    // Upstream is CLEAR (or force bypassed)
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

    auditService.log({
      action: force ? 'FORCE_TRIGGER_PIPELINE' : 'MANUAL_TRIGGER_PIPELINE',
      entityType: 'PIPELINE',
      entityId: pipeline.id,
      user: req.body.triggeredBy || 'Pavan Gowda',
      details: `Triggered run #${runData.run_id} on workspace "${pipeline.workspace}" (Job ID: ${pipeline.databricksJobId}). Force bypass: ${force}`,
      status: 'SUCCESS',
    });

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

