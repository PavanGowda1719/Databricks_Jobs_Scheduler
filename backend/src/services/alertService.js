const db = require('../db/database');

const DEFAULT_SETTINGS = {
  webhook_url: '',
  webhook_type: 'generic',
  enabled: false,
  notify_on_failure: true,
  notify_on_blocked: true,
  notify_on_success: false,
};

class AlertService {
  getSettings() {
    const existing = db.getAll('settings')[0];
    if (!existing) {
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...existing };
  }

  saveSettings(data) {
    const existing = db.getAll('settings')[0];
    if (existing) {
      return db.update('settings', existing.id, data);
    } else {
      return db.insert('settings', { ...DEFAULT_SETTINGS, ...data });
    }
  }

  /**
   * Dispatches a structured alert notification to the configured webhook.
   */
  async sendAlert({ pipelineName, runId, status, errorMessage, duration, workspace, url }) {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.webhook_url) {
      return { sent: false, reason: 'Alerts disabled or webhook URL not set' };
    }

    // Filter by event type
    const isFail = status === 'FAILED' || status === 'ERROR';
    const isBlock = status === 'BLOCKED';
    const isSucc = status === 'SUCCESS' || status === 'SUCCEEDED';

    if (isFail && !settings.notify_on_failure) return { sent: false };
    if (isBlock && !settings.notify_on_blocked) return { sent: false };
    if (isSucc && !settings.notify_on_success) return { sent: false };

    const payload = this._buildPayload(settings, {
      pipelineName,
      runId,
      status,
      errorMessage,
      duration,
      workspace: workspace || 'DEV',
      url,
    });

    try {
      const response = await fetch(settings.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log(`📣 Alert dispatched for "${pipelineName}" (${status}) -> HTTP ${response.status}`);
      return { sent: true, status: response.status };
    } catch (err) {
      console.error(`❌ Failed to dispatch webhook alert:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  /**
   * Sends a test alert to verify webhook connectivity.
   */
  async testAlert(targetUrl = null) {
    const settings = this.getSettings();
    const url = targetUrl || settings.webhook_url;

    if (!url) {
      throw new Error('No webhook URL provided for test.');
    }

    const payload = this._buildPayload(
      { webhook_type: settings.webhook_type },
      {
        pipelineName: 'Test Pipeline Diagnostic',
        runId: 999999,
        status: 'TEST_ALERT',
        errorMessage: 'Diagnostic ping from Databricks Orchestrator',
        duration: 5,
        workspace: 'DEV',
        url: 'http://localhost:5173',
      }
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook endpoint responded with HTTP ${response.status}`);
    }

    return { success: true, message: 'Test alert delivered successfully!' };
  }

  _buildPayload(settings, data) {
    const isSlack =
      settings.webhook_type === 'slack' || (settings.webhook_url && settings.webhook_url.includes('slack.com'));
    const isTeams =
      settings.webhook_type === 'teams' || (settings.webhook_url && settings.webhook_url.includes('office.com'));

    const emoji =
      data.status === 'SUCCESS' || data.status === 'SUCCEEDED'
        ? '✅'
        : data.status === 'BLOCKED'
        ? '🚫'
        : data.status === 'TEST_ALERT'
        ? '🧪'
        : '🚨';

    if (isSlack) {
      return {
        text: `${emoji} *[Databricks Alert]* Pipeline: *${data.pipelineName}* Status: *${data.status}*`,
        attachments: [
          {
            color: data.status === 'SUCCESS' ? '#10b981' : data.status === 'BLOCKED' ? '#8b5cf6' : '#f43f5e',
            fields: [
              { title: 'Pipeline', value: data.pipelineName, short: true },
              { title: 'Workspace', value: data.workspace, short: true },
              { title: 'Run ID', value: `#${data.runId}`, short: true },
              { title: 'Status', value: data.status, short: true },
              ...(data.errorMessage ? [{ title: 'Error / Reason', value: data.errorMessage, short: false }] : []),
            ],
            footer: 'Databricks Job Scheduler',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };
    }

    if (isTeams) {
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: data.status === 'SUCCESS' ? '10b981' : 'f43f5e',
        summary: `Databricks Alert: ${data.pipelineName} is ${data.status}`,
        sections: [
          {
            activityTitle: `${emoji} Pipeline Alert: **${data.pipelineName}**`,
            activitySubtitle: `Workspace: ${data.workspace} | Status: **${data.status}**`,
            facts: [
              { name: 'Run ID', value: `#${data.runId}` },
              { name: 'Duration', value: data.duration ? `${data.duration}s` : 'N/A' },
              ...(data.errorMessage ? [{ name: 'Details', value: data.errorMessage }] : []),
            ],
            markdown: true,
          },
        ],
      };
    }

    // Generic JSON payload
    return {
      event: 'PIPELINE_EXECUTION_STATUS',
      timestamp: new Date().toISOString(),
      pipeline: data.pipelineName,
      runId: data.runId,
      status: data.status,
      workspace: data.workspace,
      durationSeconds: data.duration,
      errorMessage: data.errorMessage || null,
      url: data.url || null,
    };
  }
}

module.exports = new AlertService();

