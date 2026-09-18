const API_BASE = '/api';

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
  triggerPipeline: (id, params = {}) =>
    request(`/pipelines/${id}/trigger`, { method: 'POST', body: JSON.stringify({ params }) }),
  getPipelineRuns: (id) => request(`/pipelines/${id}/runs`),
  getRunStatus: (pipelineId, runId) => request(`/pipelines/${pipelineId}/status/${runId}`),

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
};

