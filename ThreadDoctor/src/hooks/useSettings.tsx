import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Settings {
  theme: 'dark' | 'light';
  animations: boolean;
  defaultSpeed: number; // steps per second
}

const DEFAULTS: Settings = {
  theme: 'dark',
  animations: true,
  defaultSpeed: 2,
};

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>('threaddoctor:settings', DEFAULTS);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [settings.theme]);

  const update = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
}
