import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Calendar, Sun } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pipelines', icon: GitBranch, label: 'Pipelines' },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/holidays', icon: Sun, label: 'Holidays' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span>Pipeline Hub</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Databricks Job Manager</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">P</div>
          <div>
            <p className="text-sm font-medium">Pavan Gowda</p>
            <p className="text-xs text-slate-400">Dev Workspace</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

