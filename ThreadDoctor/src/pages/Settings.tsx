import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import {
  Sun,
  Moon,
  Zap,
  Gauge,
  Trash2,
  Info,
  Activity,
  Scissors,
  CheckCircle2,
} from 'lucide-react';

const APP_VERSION = '1.0.0';

export function Settings() {
  const { settings, update } = useSettings();
  const { history, clearHistory } = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  function handleClear() {
    clearHistory();
    setConfirmClear(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
        <p className="text-sm text-muted mt-1">
          Customize ThreadDoctor's appearance and simulation behavior. All preferences are stored locally.
        </p>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Appearance</h3>

        <div className="space-y-4">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Theme</div>
                <div className="text-xs text-muted">Switch between dark and light mode</div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-bg-raised border border-border-subtle rounded-lg p-1">
              <button
                onClick={() => update({ theme: 'dark' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  settings.theme === 'dark' ? 'bg-accent text-white' : 'text-muted-light hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
              <button
                onClick={() => update({ theme: 'light' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  settings.theme === 'light' ? 'bg-accent text-white' : 'text-muted-light hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
            </div>
          </div>

          {/* Animations toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Animations</div>
                <div className="text-xs text-muted">Enable smooth transitions and graph animations</div>
              </div>
            </div>
            <button
              onClick={() => update({ animations: !settings.animations })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.animations ? 'bg-accent' : 'bg-bg-hover border border-border-subtle'
              }`}
              role="switch"
              aria-checked={settings.animations}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.animations ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Simulation */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Simulation</h3>

        <div className="space-y-4">
          {/* Default speed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">Default Simulation Speed</div>
                <div className="text-xs text-muted">Playback speed for new simulations</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[0.5, 1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => update({ defaultSpeed: s })}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
                    settings.defaultSpeed === s
                      ? 'bg-accent text-white'
                      : 'bg-bg-raised text-muted-light hover:bg-bg-hover border border-border-subtle'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Data Management</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-danger/10 text-danger">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-200">Clear Local History</div>
              <div className="text-xs text-muted">
                {history.length} simulation record{history.length !== 1 ? 's' : ''} stored in your browser
              </div>
            </div>
          </div>
          {cleared ? (
            <span className="label-badge bg-success/10 text-success border border-success/30">
              <CheckCircle2 className="w-3 h-3" />
              Cleared
            </span>
          ) : confirmClear ? (
            <div className="flex items-center gap-2">
              <button onClick={handleClear} className="btn-danger text-xs px-3 py-1.5">
                Confirm
              </button>
              <button onClick={() => setConfirmClear(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={history.length === 0}
              className="btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">About ThreadDoctor</h3>
        <div className="flex items-start gap-4">
          <div className="relative flex items-center justify-center rounded-xl bg-accent/15 border border-accent/30 w-12 h-12 shrink-0">
            <Activity className="text-accent w-6 h-6" />
            <Scissors className="absolute text-accent/70 w-4 h-4 bottom-1 right-1" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-100">ThreadDoctor</h4>
              <span className="text-xs text-muted font-mono">v{APP_VERSION}</span>
            </div>
            <p className="text-sm text-muted-light leading-relaxed">
              An interactive concurrency debugging platform that helps students and developers understand
              race conditions, deadlocks, and synchronization through deterministic browser-based simulations.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="label-badge bg-bg-raised border border-border-subtle text-muted-light">
                <Info className="w-3 h-3" />
                Deterministic simulation engine
              </span>
              <span className="label-badge bg-bg-raised border border-border-subtle text-muted-light">
                No backend required
              </span>
              <span className="label-badge bg-bg-raised border border-border-subtle text-muted-light">
                Built for learning
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
