import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Workflow,
  Siren,
  GraduationCap,
  History,
  Settings as SettingsIcon,
  Presentation as PresentationIcon,
  CircleDot,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { useSettings } from '@/hooks/useSettings';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/playground', label: 'Playground', icon: FlaskConical },
  { to: '/visualizer', label: 'Live Visualizer', icon: Workflow },
  { to: '/deadlock', label: 'Deadlock Detector', icon: Siren },
  { to: '/learning', label: 'Learning Lab', icon: GraduationCap },
  { to: '/history', label: 'Run History', icon: History },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/presentation', label: 'Presentation', icon: PresentationIcon },
];

const APP_VERSION = '1.0.0';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { settings } = useSettings();
  const location = useLocation();

  return (
    <aside className="flex h-full w-64 flex-col bg-bg-panel border-r border-border-subtle">
      <div className="flex items-center justify-between px-4 h-16 border-b border-border-subtle shrink-0">
        <Logo />
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden btn-ghost p-1.5 -mr-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-accent/12 text-accent border border-accent/25'
                  : 'text-muted-light hover:bg-bg-hover hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-accent' : 'text-muted'}`} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle px-4 py-3 shrink-0 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <CircleDot className="w-3 h-3 text-success" />
          <span className="text-muted-light">Engine ready</span>
          <span className="ml-auto text-muted font-mono">v{APP_VERSION}</span>
        </div>
        <div className="text-[10px] text-muted">
          {settings.animations ? 'Animations on' : 'Animations off'} · {settings.defaultSpeed}x speed
        </div>
      </div>
    </aside>
  );
}
