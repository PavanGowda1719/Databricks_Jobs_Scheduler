const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Pipelines
  getPipelines: () => request('/pipelines'),
  getPipeline: (id) => request(`/pipelines/${id}`),
  createPipeline: (data) =>
    request('/pipelines', { method: 'POST', body: JSON.stringify(data) }),
  triggerPipeline: (id, params = {}, force = false) =>
    request(`/pipelines/${id}/trigger`, { method: 'POST', body: JSON.stringify({ params, force }) }),
  getPipelineRuns: (id) => request(`/pipelines/${id}/runs`),
  getRunStatus: (pipelineId, runId) => request(`/pipelines/${pipelineId}/status/${runId}`),
  getDependencyGraph: () => request('/pipelines/dependencies/graph'),

  // Schedules
  getSchedules: () => request('/schedules'),
  createSchedule: (data) =>
    request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) =>
    request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id) =>
    request(`/schedules/${id}`, { method: 'DELETE' }),

  // Holidays
  getHolidays: (year) => request(`/holidays${year ? `?year=${year}` : ''}`),
  addHoliday: (data) =>
    request('/holidays', { method: 'POST', body: JSON.stringify(data) }),
  deleteHoliday: (id) =>
    request(`/holidays/${id}`, { method: 'DELETE' }),
  getNthBusinessDay: (year, month, n) =>
    request(`/holidays/nth-business-day?year=${year}&month=${month}&n=${n}`),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/audit-logs${q ? `?${q}` : ''}`);
  },

  // Alert Settings & Webhooks
  getAlertConfig: () => request('/alerts/config'),
  saveAlertConfig: (data) =>
    request('/alerts/config', { method: 'POST', body: JSON.stringify(data) }),
  testAlertWebhook: (url) =>
    request('/alerts/test', { method: 'POST', body: JSON.stringify({ url }) }),
};

