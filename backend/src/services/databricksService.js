const pipelineConfig = require('../config/pipelines.json');

class DatabricksService {
  constructor() {
    this.workspaces = pipelineConfig.workspaces;
  }

  _getAuth(workspaceId) {
    const workspace = this.workspaces[workspaceId];
    if (!workspace) throw new Error(`Workspace "${workspaceId}" not found`);
    const token = process.env[workspace.tokenEnvVar];
    if (!token) throw new Error(`Token env var "${workspace.tokenEnvVar}" not set`);
    return { host: workspace.host, token };
  }

  async _fetch(workspaceId, endpoint, options = {}) {
    const { host, token } = this._getAuth(workspaceId);
    const url = `${host}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }
    return data;
  }

  // List all jobs in workspace
  async listJobs(workspaceId = 'dev') {
    const data = await this._fetch(workspaceId, '/api/2.1/jobs/list?limit=100');
    return data.jobs || [];
  }

  // Get a specific job
  async getJob(workspaceId, jobId) {
    const data = await this._fetch(workspaceId, `/api/2.1/jobs/get?job_id=${jobId}`);
    return data;
  }

  // Trigger a job run
  async triggerJob(workspaceId, jobId, params = {}) {
    const body = { job_id: Number(jobId) };
    if (Object.keys(params).length > 0) {
      body.notebook_params = params;
    }
    const data = await this._fetch(workspaceId, '/api/2.1/jobs/run-now', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data; // { run_id, number_in_job }
  }

  // Get run status
  async getRunStatus(workspaceId, runId) {
    const data = await this._fetch(workspaceId, `/api/2.1/jobs/runs/get?run_id=${runId}`);
    return {
      runId: data.run_id,
      jobId: data.job_id,
      state: data.state?.life_cycle_state || 'UNKNOWN',
      resultState: data.state?.result_state || null,
      stateMessage: data.state?.state_message || '',
      startTime: data.start_time ? new Date(data.start_time).toISOString() : null,
      endTime: data.end_time ? new Date(data.end_time).toISOString() : null,
      runDuration: data.run_duration ? Math.round(data.run_duration / 1000) : null,
      runPageUrl: data.run_page_url || null,
    };
  }

  // List recent runs for a job
  async listJobRuns(workspaceId, jobId, limit = 20) {
    const data = await this._fetch(
      workspaceId,
      `/api/2.1/jobs/runs/list?job_id=${jobId}&limit=${limit}`
    );
    return (data.runs || []).map(run => ({
      runId: run.run_id,
      jobId: run.job_id,
      state: run.state?.life_cycle_state || 'UNKNOWN',
      resultState: run.state?.result_state || null,
      stateMessage: run.state?.state_message || '',
      startTime: run.start_time ? new Date(run.start_time).toISOString() : null,
      endTime: run.end_time ? new Date(run.end_time).toISOString() : null,
      runDuration: run.run_duration ? Math.round(run.run_duration / 1000) : null,
      triggerType: run.trigger || 'UNKNOWN',
      runPageUrl: run.run_page_url || null,
    }));
  }

  // Cancel a run
  async cancelRun(workspaceId, runId) {
    const data = await this._fetch(workspaceId, '/api/2.1/jobs/runs/cancel', {
      method: 'POST',
      body: JSON.stringify({ run_id: Number(runId) }),
    });
    return data;
  }
}

module.exports = new DatabricksService();

