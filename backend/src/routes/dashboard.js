const express = require('express');
const router = express.Router();
const db = require('../db/database');
const pipelineConfig = require('../config/pipelines.json');

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const totalPipelines = pipelineConfig.pipelines.length;
  const today = new Date().toISOString().split('T')[0];

  const allRuns = db.getAll('run_history');
  const todayRuns = allRuns.filter(r => r.started_at && r.started_at.startsWith(today));

  const succeeded = todayRuns.filter(r => r.status === 'SUCCEEDED' || r.status === 'SUCCESS').length;
  const failed = todayRuns.filter(r => r.status === 'FAILED' || r.status === 'ERROR' || r.status === 'BLOCKED').length;
  const running = allRuns.filter(r => r.status === 'RUNNING' || r.status === 'PENDING').length;
  const waiting = allRuns.filter(r => r.status === 'WAITING_FOR_UPSTREAM').length;
  const blocked = allRuns.filter(r => r.status === 'BLOCKED').length;

  const recentRuns = db.query('run_history', { sort: 'started_at', order: 'desc', limit: 10 })
    .map(run => {
      const pipeline = pipelineConfig.pipelines.find(p => p.id === run.pipeline_id);
      return { ...run, pipeline_name: pipeline?.name || run.pipeline_id };
    });

  // Last 7 days trend
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRuns = allRuns.filter(r => r.started_at && r.started_at.startsWith(dateStr));
    trend.push({
      date: dateStr,
      total: dayRuns.length,
      succeeded: dayRuns.filter(r => r.status === 'SUCCEEDED' || r.status === 'SUCCESS').length,
      failed: dayRuns.filter(r => r.status === 'FAILED' || r.status === 'ERROR').length,
    });
  }

  // All-time stats
  const statusCounts = {};
  for (const run of allRuns) {
    statusCounts[run.status] = (statusCounts[run.status] || 0) + 1;
  }

  res.json({
    totalPipelines,
    todayStats: { total: todayRuns.length, succeeded, failed, running, waiting, blocked },
    recentRuns,
    trend,
    allTimeStats: statusCounts,
    totalRuns: allRuns.length,
  });
});

module.exports = router;

