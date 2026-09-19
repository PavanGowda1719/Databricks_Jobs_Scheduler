import { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Send, CheckCircle2, AlertTriangle, Loader2, Link2, ExternalLink } from 'lucide-react';
import { api } from '../api/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    webhook_url: '',
    webhook_type: 'slack',
    enabled: false,
    notify_on_failure: true,
    notify_on_blocked: true,
    notify_on_success: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const loadSettings = async () => {
    try {
      const data = await api.getAlertConfig();
      if (data) setSettings((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load alert settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.saveAlertConfig(settings);
      setMessage({ type: 'success', text: 'Alert configuration saved successfully!' });
      if (res.settings) setSettings(res.settings);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async () => {
    if (!settings.webhook_url) {
      setTestResult({ type: 'error', text: 'Please enter a webhook URL first.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testAlertWebhook(settings.webhook_url);
      setTestResult({ type: 'success', text: res.message || 'Test notification delivered successfully!' });
    } catch (err) {
      setTestResult({ type: 'error', text: err.message || 'Failed to deliver test alert to webhook' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1 rounded-md bg-rose-100 text-rose-600">
            <Bell size={16} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Alerts & Integrations</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Notification Channels</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure real-time incident alerting to Slack, Microsoft Teams, or custom webhook endpoints
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Webhook Configuration Card */}
        <div className="bg-white rounded-2xl p-6 border border-rose-100/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-rose-50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Incident Webhook Delivery</h3>
              <p className="text-[11px] text-slate-400">Receive alerts automatically when jobs fail or get blocked</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700">
                {settings.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Channel Type
              </label>
              <select
                value={settings.webhook_type}
                onChange={(e) => setSettings({ ...settings, webhook_type: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50 cursor-pointer"
              >
                <option value="slack">Slack Incoming Webhook</option>
                <option value="teams">Microsoft Teams Connector</option>
                <option value="generic">Generic JSON Webhook</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Webhook Target URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={settings.webhook_url}
                  onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                  placeholder="https://hooks.slack.com/services/T00/B00/XXXX or Teams URL"
                  className="flex-1 font-mono text-xs p-2.5 rounded-xl border border-rose-100 bg-[#fffafa] text-slate-800 outline-none focus:ring-2 focus:ring-rose-400/50"
                />
                <button
                  type="button"
                  onClick={handleTestAlert}
                  disabled={testing || !settings.webhook_url}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100/70 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Send Ping
                </button>
              </div>
            </div>
          </div>

          {/* Test Alert Result Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                testResult.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              )}
              <span className="text-[11px]">{testResult.text}</span>
            </div>
          )}

          {/* Event Triggers Checklist */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Dispatch Alerts For:
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notify_on_failure}
                  onChange={(e) => setSettings({ ...settings, notify_on_failure: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Job Failures</span>
                <span className="text-slate-400 text-[11px]">(Triggers when a Databricks run ends with FAILED or ERROR)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notify_on_blocked}
                  onChange={(e) => setSettings({ ...settings, notify_on_blocked: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Blocked Dependencies</span>
                <span className="text-slate-400 text-[11px]">(Triggers when downstream pipeline is halted due to upstream failure)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notify_on_success}
                  onChange={(e) => setSettings({ ...settings, notify_on_success: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Successful Executions</span>
                <span className="text-slate-400 text-[11px]">(Send notification on every completed successful run)</span>
              </label>
            </div>
          </div>

          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-rose-50">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-rose-500/25 disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Informational Guidance */}
        <div className="bg-rose-50/60 border border-rose-100 p-5 rounded-2xl text-xs text-rose-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <ShieldCheck size={16} className="text-rose-600" />
            <span>Webhook Security & Privacy</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-900/80">
            Webhook URLs are kept entirely local to your server runtime storage (`store.json`). No external token or credential is ever exposed to third-party endpoints. Payloads include pipeline names, run durations, error summaries, and Databricks deep links.
          </p>
        </div>
      </form>
    </div>
  );
}

