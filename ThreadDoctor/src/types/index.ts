// Core domain types for ThreadDoctor simulations

export type ThreadState = 'idle' | 'running' | 'waiting' | 'blocked' | 'completed';

export interface Thread {
  id: string;
  name: string;
  state: ThreadState;
  ownedResources: string[];
  waitingFor: string | null;
  color: string;
}

export type ResourceKind = 'mutex' | 'semaphore' | 'buffer' | 'fork';

export interface Resource {
  id: string;
  name: string;
  kind: ResourceKind;
  owner: string | null;
  waitingQueue: string[];
  capacity?: number;
  count?: number;
}

export type EventSeverity = 'info' | 'warning' | 'error' | 'success';

export interface SimulationEvent {
  id: number;
  step: number;
  time: number;
  threadId: string | null;
  threadName: string | null;
  type:
    | 'acquire'
    | 'release'
    | 'request'
    | 'wait'
    | 'wake'
    | 'produce'
    | 'consume'
    | 'compute'
    | 'start'
    | 'end'
    | 'deadlock'
    | 'race'
    | 'success';
  message: string;
  resourceId?: string;
  resourceName?: string;
  severity: EventSeverity;
}

export interface Diagnostic {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'error';
  category: 'race' | 'deadlock' | 'correct' | 'contention' | 'starvation';
  description: string;
  suggestion?: string;
}

export interface LogLine {
  stream: 'stdout' | 'stderr';
  text: string;
  step: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'ownership' | 'waiting' | 'request';
  animated?: boolean;
}

export interface SimulationSnapshot {
  step: number;
  threads: Thread[];
  resources: Resource[];
  events: SimulationEvent[];
  logs: LogLine[];
  edges: GraphEdge[];
  status: SimulationStatus;
  deadlockCycle?: string[];
}

export type SimulationStatus = 'ready' | 'running' | 'completed' | 'issue';

export interface SimulationResult {
  id: string;
  exampleId: string;
  exampleName: string;
  status: SimulationStatus;
  threadCount: number;
  resourceCount: number;
  issuesDetected: string[];
  durationMs: number;
  simulated: boolean;
  events: SimulationEvent[];
  logs: LogLine[];
  diagnostics: Diagnostic[];
  finalSnapshot: SimulationSnapshot;
  fixTested: boolean;
  createdAt: number;
}

export interface SimulationHistoryEntry {
  id: string;
  exampleId: string;
  exampleName: string;
  simulationType: string;
  result: 'success' | 'issue';
  issues: string[];
  fixTested: boolean;
  createdAt: number;
  durationMs: number;
  snapshot?: SimulationSnapshot;
}

export interface Example {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  fixedCode?: string;
  hasFix: boolean;
  threadCount: number;
  resourceCount: number;
  tags: string[];
}

export type SimKind =
  | 'race'
  | 'raceFixed'
  | 'deadlock'
  | 'deadlockFixed'
  | 'producerConsumer'
  | 'diningPhilosophers';

export interface SimScenario {
  exampleId: string;
  threads: Thread[];
  resources: Resource[];
  buildEvents: () => SimulationEvent[];
  buildLogs: (events: SimulationEvent[]) => LogLine[];
  diagnostics: (events: SimulationEvent[]) => Diagnostic[];
  expectedDurationMs: number;
  hasIssue: boolean;
}
