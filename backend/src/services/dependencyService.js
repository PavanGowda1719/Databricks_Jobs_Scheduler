const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const PIPELINES_CONFIG_PATH = path.join(__dirname, '..', 'config', 'pipelines.json');

class DependencyService {
  constructor() {
    this._loadConfig();
  }

  _loadConfig() {
    try {
      this.config = JSON.parse(fs.readFileSync(PIPELINES_CONFIG_PATH, 'utf8'));
    } catch (err) {
      this.config = { workspaces: {}, pipelines: [] };
    }
  }

  getPipelines() {
    this._loadConfig();
    return this.config.pipelines || [];
  }

  getPipeline(pipelineId) {
    return this.getPipelines().find(p => p.id === pipelineId) || null;
  }

  getUpstreamDependencies(pipelineId) {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline || !Array.isArray(pipeline.upstreamDependencies)) {
      return [];
    }
    return pipeline.upstreamDependencies;
  }

  getDownstreamPipelines(pipelineId) {
    return this.getPipelines().filter(p => {
      const deps = p.upstreamDependencies || [];
      return deps.includes(pipelineId);
    });
  }

  /**
   * Evaluates upstream status for a given pipeline.
   * If no dependencies are set, returns status: 'CLEAR'.
   * If dependencies exist:
   *   - Returns 'WAITING' if any upstream is running or pending or has not run.
   *   - Returns 'BLOCKED' if any upstream has failed/cancelled.
   *   - Returns 'CLEAR' if ALL upstreams completed with SUCCESS/SUCCEEDED.
   */
  checkUpstreamStatus(pipelineId) {
    const upstreamIds = this.getUpstreamDependencies(pipelineId);

    // If no dependencies configured, immediately CLEAR
    if (!upstreamIds || upstreamIds.length === 0) {
      return {
        status: 'CLEAR',
        hasDependencies: false,
        upstreamCount: 0,
        upstreams: [],
        message: 'No upstream dependencies configured.'
      };
    }

    const upstreamsInfo = [];
    let hasBlocked = false;
    let hasWaiting = false;
    const blockedReasons = [];
    const waitingReasons = [];

    for (const upId of upstreamIds) {
      const upPipeline = this.getPipeline(upId);
      const upName = upPipeline?.name || upId;

      // Fetch latest run for this upstream
      const latestRuns = db.query('run_history', {
        filter: { pipeline_id: upId },
        sort: 'started_at',
        order: 'desc',
        limit: 1
      });
      const latest = latestRuns[0] || null;
      const latestStatus = latest?.status ? latest.status.toUpperCase() : 'NEVER_RUN';

      const info = {
        id: upId,
        name: upName,
        latestRunId: latest?.databricks_run_id || latest?.id || null,
        latestStatus: latestStatus,
        startedAt: latest?.started_at || null,
        completedAt: latest?.completed_at || null
      };

      if (latestStatus === 'SUCCESS' || latestStatus === 'SUCCEEDED') {
        info.state = 'SUCCESS';
      } else if (latestStatus === 'FAILED' || latestStatus === 'ERROR' || latestStatus === 'CANCELLED') {
        info.state = 'BLOCKED';
        hasBlocked = true;
        blockedReasons.push(`Upstream "${upName}" ended with ${latestStatus}`);
      } else if (latestStatus === 'RUNNING' || latestStatus === 'PENDING') {
        info.state = 'WAITING';
        hasWaiting = true;
        waitingReasons.push(`Upstream "${upName}" is currently ${latestStatus}`);
      } else {
        // NEVER_RUN or unknown
        info.state = 'WAITING';
        hasWaiting = true;
        waitingReasons.push(`Upstream "${upName}" has not run yet`);
      }

      upstreamsInfo.push(info);
    }

    if (hasBlocked) {
      return {
        status: 'BLOCKED',
        hasDependencies: true,
        upstreamCount: upstreamIds.length,
        upstreams: upstreamsInfo,
        reasons: blockedReasons,
        message: blockedReasons.join('; ')
      };
    }

    if (hasWaiting) {
      return {
        status: 'WAITING',
        hasDependencies: true,
        upstreamCount: upstreamIds.length,
        upstreams: upstreamsInfo,
        reasons: waitingReasons,
        message: waitingReasons.join('; ')
      };
    }

    return {
      status: 'CLEAR',
      hasDependencies: true,
      upstreamCount: upstreamIds.length,
      upstreams: upstreamsInfo,
      reasons: [],
      message: 'All upstream dependencies completed successfully.'
    };
  }

  /**
   * Called when an upstream pipeline finishes running.
   * Auto-triggers or unblocks/blocks downstream pipelines that were queued or waiting.
   */
  async processDependencyChain(completedPipelineId, resultState, databricksService) {
    const downstreams = this.getDownstreamPipelines(completedPipelineId);
    if (!downstreams || downstreams.length === 0) return;

    console.log(`🔗 Checking dependency chain: Upstream "${completedPipelineId}" finished with ${resultState}`);

    const isSuccess = (resultState === 'SUCCESS' || resultState === 'SUCCEEDED');
    const isFailed = (resultState === 'FAILED' || resultState === 'ERROR' || resultState === 'CANCELLED');

    for (const downstream of downstreams) {
      // Look for any waiting runs in database
      const waitingRuns = db.getAll('run_history').filter(
        r => r.pipeline_id === downstream.id && r.status === 'WAITING_FOR_UPSTREAM'
      );

      if (isFailed) {
        // Mark all waiting runs for downstream as BLOCKED
        for (const run of waitingRuns) {
          db.update('run_history', run.id, {
            status: 'BLOCKED',
            completed_at: new Date().toISOString(),
            error_message: `Blocked: Upstream pipeline "${completedPipelineId}" failed with ${resultState}`
          });
          console.log(`🚫 Blocked downstream run #${run.id} for "${downstream.name}" due to upstream failure`);
        }
      } else if (isSuccess) {
        // Check if ALL upstream dependencies for this downstream are now clear
        const check = this.checkUpstreamStatus(downstream.id);
        if (check.status === 'CLEAR') {
          // If there were waiting runs, trigger the first one
          if (waitingRuns.length > 0 && databricksService) {
            const targetRun = waitingRuns[0];
            try {
              console.log(`🚀 All upstreams clear! Auto-triggering waiting run for downstream "${downstream.name}"...`);
              const runData = await databricksService.triggerJob(
                downstream.workspace,
                downstream.databricksJobId,
                downstream.defaultParams || {}
              );

              db.update('run_history', targetRun.id, {
                databricks_run_id: runData.run_id,
                status: 'RUNNING',
                started_at: new Date().toISOString(),
                error_message: null
              });
              console.log(`✅ Downstream "${downstream.name}" triggered as run #${runData.run_id}`);
            } catch (err) {
              console.error(`❌ Failed to auto-trigger downstream "${downstream.name}":`, err.message);
              db.update('run_history', targetRun.id, {
                status: 'FAILED',
                completed_at: new Date().toISOString(),
                error_message: `Auto-trigger failed: ${err.message}`
              });
            }
          }
        }
      }
    }
  }

  /**
   * Generates a complete Dependency DAG graph structure for visualization.
   */
  getDependencyGraph() {
    const pipelines = this.getPipelines();
    const nodes = [];
    const edges = [];

    for (const p of pipelines) {
      const upstreams = p.upstreamDependencies || [];
      const downstreams = this.getDownstreamPipelines(p.id).map(d => d.id);
      const depCheck = this.checkUpstreamStatus(p.id);

      // Latest status
      const latest = db.query('run_history', {
        filter: { pipeline_id: p.id },
        sort: 'started_at',
        order: 'desc',
        limit: 1
      })[0] || null;

      nodes.push({
        id: p.id,
        name: p.name,
        category: p.category,
        workspace: p.workspace,
        status: latest?.status || 'NEVER_RUN',
        dependencyStatus: depCheck.status,
        upstreamDependencies: upstreams,
        downstreamCount: downstreams.length,
        hasDependencies: upstreams.length > 0
      });

      for (const upId of upstreams) {
        edges.push({
          id: `${upId}->${p.id}`,
          source: upId,
          target: p.id
        });
      }
    }

    return { nodes, edges };
  }
}

module.exports = new DependencyService();

