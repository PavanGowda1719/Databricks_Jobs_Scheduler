import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Calendar, Sun, Zap, FileText, Bell, Server } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipelines', icon: GitBranch, label: 'Pipelines & DAGs' },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/holidays', icon: Sun, label: 'Indian Holidays' },
  { to: '/audit-logs', icon: FileText, label: 'System Audit Logs' },
  { to: '/settings', icon: Bell, label: 'Alerts & Settings' },
];

export default function Sidebar() {
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    return localStorage.getItem('activeWorkspace') || 'all';
  });

  const handleWorkspaceChange = (ws) => {
    setActiveWorkspace(ws);
    localStorage.setItem('activeWorkspace', ws);
    window.dispatchEvent(new CustomEvent('workspaceChanged', { detail: ws }));
  };

  return (
    <aside className="w-64 bg-[#18131e] text-slate-200 min-h-screen flex flex-col border-r border-rose-950/40 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-rose-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
            <Zap size={20} className="fill-current" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>DataFlow</span>
              <span className="text-[10px] font-semibold tracking-widest uppercase bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-rose-200/60 font-medium">Databricks Orchestrator</p>
          </div>
        </div>

        {/* Workspace Switcher Selector */}
        <div className="mt-4 pt-3 border-t border-rose-900/20">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-300/60 mb-1 flex items-center gap-1">
            <Server size={11} className="text-rose-400" />
            <span>Target Workspace</span>
          </label>
          <select
            value={activeWorkspace}
            onChange={(e) => handleWorkspaceChange(e.target.value)}
            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#221a2b] border border-rose-900/40 text-rose-200 outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer"
          >
            <option value="all">🌐 All Workspaces</option>
            <option value="dev">🟡 DEV (Development)</option>
            <option value="uat">🔵 UAT (Staging)</option>
            <option value="prod">🔴 PROD (Production)</option>
          </select>
        </div>

        {/* Data Engineering Tech Badges */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-rose-900/20">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-rose-950/60 text-rose-300/80 px-2 py-0.5 rounded border border-rose-800/30">
            🧱 Databricks
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-rose-950/60 text-rose-300/80 px-2 py-0.5 rounded border border-rose-800/30">
            ⚡ Spark
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-rose-950/60 text-rose-300/80 px-2 py-0.5 rounded border border-rose-800/30">
            🌊 Delta
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1.5">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300/40">
          Navigation
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                isActive
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-400 hover:bg-rose-950/30 hover:text-rose-200'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User / Workspace Footer */}
      <div className="p-3.5 border-t border-rose-900/20 bg-[#140f1a]/80">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            PG
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">Pavan Gowda</p>
            <p className="text-[10px] text-rose-300/70 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {activeWorkspace === 'all' ? 'Multi-Environment' : `${activeWorkspace.toUpperCase()} Active`}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
