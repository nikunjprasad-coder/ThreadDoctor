import { Handle, Position } from 'reactflow';
import type { Resource } from '@/types';
import { Lock, Unlock, Database, Utensils } from 'lucide-react';

const KIND_ICON = {
  mutex: Lock,
  semaphore: Lock,
  buffer: Database,
  fork: Utensils,
};

export function ResourceNode({ data }: { data: { resource: Resource; inCycle?: boolean } }) {
  const { resource, inCycle } = data;
  const Icon = resource.owner ? KIND_ICON[resource.kind] : Unlock;
  const owned = resource.owner !== null;

  return (
    <div
      className={`rounded-lg border-2 px-3 py-2.5 min-w-[120px] transition-all ${
        owned
          ? 'border-accent/50 bg-accent/10'
          : 'border-border-subtle bg-bg-raised'
      } ${inCycle ? 'border-danger shadow-lg shadow-danger/30 animate-pulse-ring' : ''}`}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Right} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />

      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${owned ? 'text-accent' : 'text-muted'}`} />
        <span className="font-mono text-sm font-medium text-slate-100">{resource.name}</span>
      </div>
      <div className="mt-1 text-[10px] text-muted font-mono">
        {owned ? `held by ${resource.owner}` : 'free'}
      </div>
      {resource.waitingQueue.length > 0 && (
        <div className="mt-0.5 text-[10px] text-warning font-mono">
          queue: {resource.waitingQueue.join(', ')}
        </div>
      )}
      {resource.kind === 'buffer' && resource.count !== undefined && (
        <div className="mt-1 text-[10px] text-muted font-mono">
          items: {resource.count}/{resource.capacity}
        </div>
      )}
    </div>
  );
}
