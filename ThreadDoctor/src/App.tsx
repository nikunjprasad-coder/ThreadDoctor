import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SettingsProvider } from '@/hooks/useSettings';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Overview } from '@/pages/Overview';
import { Playground } from '@/pages/Playground';
import { Visualizer } from '@/pages/Visualizer';
import { DeadlockDetector } from '@/pages/DeadlockDetector';
import { LearningLab } from '@/pages/LearningLab';
import { RunHistory } from '@/pages/RunHistory';
import { Settings } from '@/pages/Settings';
import { Presentation } from '@/pages/Presentation';

function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 animate-slide-in">
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-16 border-b border-border-subtle bg-bg-panel shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="btn-ghost p-2 -ml-2"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-100 text-sm">ThreadDoctor</span>
        </div>

        {/* Scroll area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/visualizer" element={<Visualizer />} />
              <Route path="/deadlock" element={<DeadlockDetector />} />
              <Route path="/learning" element={<LearningLab />} />
              <Route path="/history" element={<RunHistory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/presentation" element={<Presentation />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
