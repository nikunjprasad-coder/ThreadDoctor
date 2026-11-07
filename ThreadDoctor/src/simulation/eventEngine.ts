import type {
  SimulationEvent,
  Thread,
  Resource,
  SimulationSnapshot,
  SimulationStatus,
  LogLine,
  GraphEdge,
} from '@/types';
import { detectCycle } from './scenarios';

function cloneThreads(threads: Thread[]): Thread[] {
  return threads.map((t) => ({ ...t, ownedResources: [...t.ownedResources] }));
}

function cloneResources(resources: Resource[]): Resource[] {
  return resources.map((r) => ({ ...r, waitingQueue: [...r.waitingQueue] }));
}

function buildEdges(threads: Thread[], resources: Resource[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  for (const r of resources) {
    if (r.owner) {
      edges.push({
        id: `own-${r.owner}-${r.id}`,
        source: r.owner,
        target: r.id,
        type: 'ownership',
      });
    }
  }
  for (const t of threads) {
    if (t.waitingFor) {
      edges.push({
        id: `wait-${t.id}-${t.waitingFor}`,
        source: t.id,
        target: t.waitingFor,
        type: 'waiting',
        animated: true,
      });
    }
  }
  return edges;
}

/**
 * Applies all events up to and including `currentStep` to produce a snapshot.
 */
export function applyEventsUpTo(
  events: SimulationEvent[],
  currentStep: number,
  baseThreads: Thread[],
  baseResources: Resource[],
  logs: LogLine[],
): SimulationSnapshot {
  let threads = cloneThreads(baseThreads);
  let resources = cloneResources(baseResources);
  let status: SimulationStatus = 'running';
  let deadlockCycle: string[] | undefined;

  const relevantLogs = logs.filter((l) => l.step <= currentStep);
  const appliedEvents = events.filter((e) => e.step <= currentStep);

  for (const e of appliedEvents) {
    const thread = threads.find((t) => t.id === e.threadId);
    const resource = e.resourceId ? resources.find((r) => r.id === e.resourceId) : undefined;

    switch (e.type) {
      case 'start':
        status = 'running';
        for (const t of threads) {
          if (t.state === 'idle') t.state = 'running';
        }
        break;

      case 'acquire':
        if (thread && resource) {
          resource.owner = thread.id;
          resource.waitingQueue = resource.waitingQueue.filter((id) => id !== thread.id);
          thread.ownedResources.push(resource.id);
          thread.waitingFor = null;
          thread.state = 'running';
        }
        break;

      case 'request':
      case 'wait':
        if (thread && resource) {
          thread.waitingFor = resource.id;
          thread.state = 'waiting';
          if (!resource.waitingQueue.includes(thread.id)) {
            resource.waitingQueue.push(thread.id);
          }
        }
        break;

      case 'release':
        if (thread && resource) {
          resource.owner = null;
          thread.ownedResources = thread.ownedResources.filter((id) => id !== resource.id);
          thread.state = 'running';
          // Wake next in queue
          const next = resource.waitingQueue[0];
          if (next) {
            const nextThread = threads.find((t) => t.id === next);
            if (nextThread) {
              nextThread.waitingFor = null;
              nextThread.state = 'running';
            }
          }
        }
        break;

      case 'wake':
        if (thread && resource) {
          resource.owner = thread.id;
          resource.waitingQueue = resource.waitingQueue.filter((id) => id !== thread.id);
          thread.ownedResources.push(resource.id);
          thread.waitingFor = null;
          thread.state = 'running';
        }
        break;

      case 'produce':
        if (resource && resource.count !== undefined) {
          resource.count = Math.min(resource.count + 1, resource.capacity ?? Infinity);
        }
        break;

      case 'consume':
        if (resource && resource.count !== undefined) {
          resource.count = Math.max(resource.count - 1, 0);
        }
        break;

      case 'compute':
        if (thread) thread.state = 'running';
        break;

      case 'deadlock':
        status = 'issue';
        // Mark waiting threads as blocked
        for (const t of threads) {
          if (t.state === 'waiting') t.state = 'blocked';
        }
        deadlockCycle = detectCycle(threads, resources) ?? undefined;
        break;

      case 'race':
        status = 'issue';
        break;

      case 'end':
        if (status !== 'issue') status = 'completed';
        for (const t of threads) {
          if (t.state === 'running' || t.state === 'waiting') t.state = 'completed';
        }
        break;
    }
  }

  const edges = buildEdges(threads, resources);

  return {
    step: currentStep,
    threads,
    resources,
    events: appliedEvents,
    logs: relevantLogs,
    edges,
    status,
    deadlockCycle,
  };
}

export function totalSteps(events: SimulationEvent[]): number {
  return events.length > 0 ? Math.max(...events.map((e) => e.step)) + 1 : 0;
}
