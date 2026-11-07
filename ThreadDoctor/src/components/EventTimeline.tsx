import type { SimulationEvent } from '@/types';
import {
  Lock,
  Unlock,
  ArrowRight,
  Clock,
  Zap,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Package,
  ShoppingCart,
} from 'lucide-react';

const TYPE_ICON: Record<SimulationEvent['type'], typeof Lock> = {
  acquire: Lock,
  release: Unlock,
  request: ArrowRight,
  wait: Clock,
  wake: Zap,
  produce: Package,
  consume: ShoppingCart,
  compute: Play,
  start: Play,
  end: Square,
  deadlock: AlertTriangle,
  race: AlertTriangle,
  success: CheckCircle2,
};

const SEVERITY_COLOR: Record<SimulationEvent['severity'], string> = {
  info: 'text-muted-light border-border-subtle',
  success: 'text-success border-success/30 bg-success/5',
  warning: 'text-warning border-warning/30 bg-warning/5',
  error: 'text-danger border-danger/30 bg-danger/5',
};

interface EventTimelineProps {
  events: SimulationEvent[];
  currentStep: number;
  max?: number;
}

export function EventTimeline({ events, currentStep, max }: EventTimelineProps) {
  const shown = max ? events.slice(0, max) : events;

  return (
    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
      {shown.map((e) => {
        const Icon = TYPE_ICON[e.type] ?? Play;
        const isPast = e.step <= currentStep;
        return (
          <div
            key={e.id}
            className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs transition-opacity ${
              SEVERITY_COLOR[e.severity]
            } ${isPast ? 'opacity-100' : 'opacity-35'}`}
          >
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[10px] text-muted w-8 text-right">#{e.step}</span>
              <Icon className="w-3.5 h-3.5 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-slate-200">{e.message}</span>
              {e.threadName && (
                <span className="ml-1.5 font-mono text-[10px] text-muted">[{e.threadName}]</span>
              )}
            </div>
            <span className="font-mono text-[10px] text-muted shrink-0">{e.time}ms</span>
          </div>
        );
      })}
      {events.length === 0 && (
        <div className="text-center py-8 text-muted text-sm">No events yet. Run a simulation to see the timeline.</div>
      )}
    </div>
  );
}
