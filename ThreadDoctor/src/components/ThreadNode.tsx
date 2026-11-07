import { Handle, Position } from 'reactflow';
import type { Thread } from '@/types';
import { Activity, Clock, AlertTriangle, CheckCircle2, Pause } from 'lucide-react';

const STATE_STYLES: Record<Thread['state'], { ring: string; bg: string; text: string; icon: typeof Activity }> = {
  idle: { ring: 'border-border-subtle', bg: 'bg-bg-raised', text: 'text-muted', icon: Pause },
  running: { ring: 'border-success/50', bg: 'bg-success/10', text: 'text-success', icon: Activity },
  waiting: { ring: 'border-warning/50', bg: 'bg-warning/10', text: 'text-warning', icon: Clock },
  blocked: { ring: 'border-danger/50', bg: 'bg-danger/10', text: 'text-danger', icon: AlertTriangle },
  completed: { ring: 'border-success/40', bg: 'bg-success/5', text: 'text-success/80', icon: CheckCircle2 },
};

export function ThreadNode({ data }: { data: { thread: Thread; inCycle?: boolean } }) {
  const { thread, inCycle } = data;
  const style = STATE_STYLES[thread.state];
  const Icon = style.icon;

  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 min-w-[140px] ${style.bg} ${style.ring} ${
        inCycle ? 'border-danger shadow-lg shadow-danger/30 animate-pulse-ring' : ''
      }`}
    >
      <Handle type="source" position={Position.Top} />
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Bottom} />

      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: thread.color }} />
        <span className="font-mono text-sm font-semibold text-slate-100">{thread.name}</span>
      </div>
      <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${style.text}`}>
        <Icon className="w-3 h-3" />
        <span className="capitalize">{thread.state}</span>
      </div>
      {thread.ownedResources.length > 0 && (
        <div className="mt-1.5 text-[10px] text-muted font-mono">
          holds: {thread.ownedResources.join(', ')}
        </div>
      )}
      {thread.waitingFor && (
        <div className="mt-0.5 text-[10px] text-warning font-mono">
          waits: {thread.waitingFor}
        </div>
      )}
    </div>
  );
}
