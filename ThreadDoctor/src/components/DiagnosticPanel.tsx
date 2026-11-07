import type { Diagnostic } from '@/types';
import { AlertTriangle, Info, Lightbulb, CheckCircle2 } from 'lucide-react';

const SEVERITY_CONFIG = {
  error: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  info: { icon: Info, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
};

export function DiagnosticPanel({ diagnostics }: { diagnostics: Diagnostic[] }) {
  if (diagnostics.length === 0) {
    return (
      <div className="card p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="text-sm text-muted-light">No diagnostics — run a simulation to see results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {diagnostics.map((d) => {
        const cfg = SEVERITY_CONFIG[d.severity];
        const Icon = cfg.icon;
        return (
          <div key={d.id} className={`card p-4 border ${cfg.border}`}>
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-100">{d.title}</h4>
                <p className="text-xs text-muted-light mt-1 leading-relaxed">{d.description}</p>
                {d.suggestion && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-bg-base/50 border border-border-subtle px-3 py-2">
                    <Lightbulb className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Suggested Fix</span>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{d.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
