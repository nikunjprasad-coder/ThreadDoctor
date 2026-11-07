import type {
  SimulationEvent,
  LogLine,
  Thread,
  Resource,
  Diagnostic,
  GraphEdge,
  SimulationSnapshot,
  SimKind,
  SimulationStatus,
} from '@/types';

let eventCounter = 0;

function ev(
  step: number,
  time: number,
  partial: Omit<SimulationEvent, 'id' | 'step' | 'time'>,
): SimulationEvent {
  return { id: eventCounter++, step, time, ...partial };
}

// ---------- Snapshot builder ----------
export function buildSnapshot(
  step: number,
  threads: Thread[],
  resources: Resource[],
  events: SimulationEvent[],
  logs: LogLine[],
  status: SimulationStatus,
  deadlockCycle?: string[],
): SimulationSnapshot {
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
    for (const w of r.waitingQueue) {
      edges.push({
        id: `wait-${w}-${r.id}`,
        source: w,
        target: r.id,
        type: 'waiting',
        animated: true,
      });
    }
  }

  return { step, threads, resources, events, logs, edges, status, deadlockCycle };
}

// ---------- Race Condition (faulty) ----------
function raceConditionEvents(): SimulationEvent[] {
  eventCounter = 0;
  const events: SimulationEvent[] = [];
  let step = 0;
  let time = 0;

  events.push(ev(step++, time, {
    threadId: null, threadName: null, type: 'start',
    message: 'Simulation started: 2 threads, 1 shared counter', severity: 'info',
  }));

  // Simulate interleaved read-modify-write causing lost updates
  // Each thread reads counter, both compute, both write — last write wins
  for (let i = 0; i < 6; i++) {
    const t1Read = i * 3;
    const t2Read = i * 3;
    const counterBefore = t1Read;

    events.push(ev(step++, time, {
      threadId: 'T1', threadName: 'Thread 1', type: 'compute',
      message: `T1 reads counter = ${counterBefore}`, severity: 'info',
      resourceId: 'counter', resourceName: 'counter',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T2', threadName: 'Thread 2', type: 'compute',
      message: `T2 reads counter = ${counterBefore} (stale!)`, severity: 'warning',
      resourceId: 'counter', resourceName: 'counter',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T1', threadName: 'Thread 1', type: 'compute',
      message: `T1 writes counter = ${counterBefore + 1}`, severity: 'info',
      resourceId: 'counter', resourceName: 'counter',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T2', threadName: 'Thread 2', type: 'compute',
      message: `T2 writes counter = ${counterBefore + 1} (overwrites T1!)`, severity: 'error',
      resourceId: 'counter', resourceName: 'counter',
    }));
  }

  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'race',
    message: 'Race condition: 6 lost updates detected. Final counter = 6 instead of 12', severity: 'error',
  }));
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'end',
    message: 'Simulation finished', severity: 'info',
  }));
  return events;
}

function raceConditionLogs(events: SimulationEvent[]): LogLine[] {
  const logs: LogLine[] = [];
  for (const e of events) {
    if (e.type === 'end') logs.push({ stream: 'stdout', text: 'Expected: 20000', step: e.step });
    if (e.type === 'race') {
      logs.push({ stream: 'stdout', text: 'Actual:   11842', step: e.step });
      logs.push({ stream: 'stderr', text: 'WARNING: data race on counter', step: e.step });
    }
  }
  return logs;
}

function raceDiagnostics(events: SimulationEvent[]): Diagnostic[] {
  return [
    {
      id: 'race-1',
      title: 'Data race on shared counter',
      severity: 'error',
      category: 'race',
      description:
        'Two threads perform unsynchronized read-modify-write on the same counter. When both read the same stale value before writing, one increment is lost. Over 10,000 iterations this produces a final value significantly below 20,000.',
      suggestion:
        'Wrap the counter update in a std::lock_guard<std::mutex> so only one thread can enter the critical section at a time.',
    },
  ];
}

function raceThreads(): Thread[] {
  return [
    { id: 'T1', name: 'Thread 1', state: 'idle', ownedResources: [], waitingFor: null, color: '#8B5CF6' },
    { id: 'T2', name: 'Thread 2', state: 'idle', ownedResources: [], waitingFor: null, color: '#34D399' },
  ];
}

function raceResources(): Resource[] {
  return [
    { id: 'counter', name: 'counter', kind: 'mutex', owner: null, waitingQueue: [] },
  ];
}

// ---------- Race Condition (fixed) ----------
function raceFixedEvents(): SimulationEvent[] {
  eventCounter = 0;
  const events: SimulationEvent[] = [];
  let step = 0;
  let time = 0;

  events.push(ev(step++, time, {
    threadId: null, threadName: null, type: 'start',
    message: 'Simulation started: mutex-protected counter', severity: 'info',
  }));

  for (let i = 0; i < 6; i++) {
    events.push(ev(step++, time, {
      threadId: 'T1', threadName: 'Thread 1', type: 'acquire',
      message: 'T1 locks mutex', severity: 'success', resourceId: 'mtx', resourceName: 'mtx',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T2', threadName: 'Thread 2', type: 'wait',
      message: 'T2 blocks on mutex (held by T1)', severity: 'warning', resourceId: 'mtx', resourceName: 'mtx',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T1', threadName: 'Thread 1', type: 'compute',
      message: `T1 reads counter = ${i}, writes counter = ${i + 1}`, severity: 'info',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T1', threadName: 'Thread 1', type: 'release',
      message: 'T1 unlocks mutex', severity: 'success', resourceId: 'mtx', resourceName: 'mtx',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T2', threadName: 'Thread 2', type: 'wake',
      message: 'T2 acquires mutex', severity: 'success', resourceId: 'mtx', resourceName: 'mtx',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T2', threadName: 'Thread 2', type: 'compute',
      message: `T2 reads counter = ${i + 1}, writes counter = ${i + 2}`, severity: 'info',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'T2', threadName: 'Thread 2', type: 'release',
      message: 'T2 unlocks mutex', severity: 'success', resourceId: 'mtx', resourceName: 'mtx',
    }));
  }

  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'success',
    message: 'No race detected. Final counter = 12 (correct)', severity: 'success',
  }));
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'end',
    message: 'Simulation finished', severity: 'info',
  }));
  return events;
}

function raceFixedLogs(): LogLine[] {
  return [
    { stream: 'stdout', text: 'Expected: 20000', step: 0 },
    { stream: 'stdout', text: 'Actual:   20000', step: 0 },
  ];
}

function raceFixedDiagnostics(): Diagnostic[] {
  return [
    {
      id: 'race-fixed-1',
      title: 'No race condition detected',
      severity: 'info',
      category: 'correct',
      description:
        'The mutex serializes access to the counter. Each thread completes its read-modify-write inside the critical section before the other enters, so no updates are lost and the final value equals the expected 20,000.',
    },
  ];
}

// ---------- Deadlock (faulty) ----------
function deadlockEvents(): SimulationEvent[] {
  eventCounter = 0;
  const events: SimulationEvent[] = [];
  let step = 0;
  let time = 0;

  events.push(ev(step++, time, {
    threadId: null, threadName: null, type: 'start',
    message: 'Simulation started: 2 threads, 2 mutexes (opposite order)', severity: 'info',
  }));

  events.push(ev(step++, time, {
    threadId: 'T1', threadName: 'Thread 1', type: 'acquire',
    message: 'T1 acquires Lock A', severity: 'success', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'acquire',
    message: 'T2 acquires Lock B', severity: 'success', resourceId: 'lockB', resourceName: 'Lock B',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T1', threadName: 'Thread 1', type: 'request',
    message: 'T1 requests Lock B (held by T2) → T1 waits', severity: 'warning', resourceId: 'lockB', resourceName: 'Lock B',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'request',
    message: 'T2 requests Lock A (held by T1) → T2 waits', severity: 'warning', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'deadlock',
    message: 'DEADLOCK detected: circular wait T1→B→T2→A→T1', severity: 'error',
  }));
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'end',
    message: 'Simulation halted (deadlock)', severity: 'info',
  }));
  return events;
}

function deadlockLogs(): LogLine[] {
  return [
    { stream: 'stderr', text: 'ThreadSanitizer: deadlock detected', step: 5 },
    { stream: 'stderr', text: 'Cycle: T1 → Lock B → T2 → Lock A → T1', step: 5 },
  ];
}

function deadlockDiagnostics(): Diagnostic[] {
  return [
    {
      id: 'dl-1',
      title: 'Circular wait — deadlock',
      severity: 'error',
      category: 'deadlock',
      description:
        'T1 holds Lock A and waits for Lock B, while T2 holds Lock B and waits for Lock A. This forms a cycle in the resource allocation graph, satisfying all four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, and circular wait.',
      suggestion:
        'Enforce a global lock ordering — always acquire Lock A before Lock B in every thread. This breaks the circular wait condition.',
    },
  ];
}

function deadlockThreads(): Thread[] {
  return [
    { id: 'T1', name: 'Thread 1', state: 'idle', ownedResources: [], waitingFor: null, color: '#8B5CF6' },
    { id: 'T2', name: 'Thread 2', state: 'idle', ownedResources: [], waitingFor: null, color: '#34D399' },
  ];
}

function deadlockResources(): Resource[] {
  return [
    { id: 'lockA', name: 'Lock A', kind: 'mutex', owner: null, waitingQueue: [] },
    { id: 'lockB', name: 'Lock B', kind: 'mutex', owner: null, waitingQueue: [] },
  ];
}

// ---------- Deadlock (fixed) ----------
function deadlockFixedEvents(): SimulationEvent[] {
  eventCounter = 0;
  const events: SimulationEvent[] = [];
  let step = 0;
  let time = 0;

  events.push(ev(step++, time, {
    threadId: null, threadName: null, type: 'start',
    message: 'Simulation started: consistent lock ordering (A → B)', severity: 'info',
  }));

  events.push(ev(step++, time, {
    threadId: 'T1', threadName: 'Thread 1', type: 'acquire',
    message: 'T1 acquires Lock A', severity: 'success', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'wait',
    message: 'T2 waits for Lock A (held by T1)', severity: 'warning', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T1', threadName: 'Thread 1', type: 'acquire',
    message: 'T1 acquires Lock B', severity: 'success', resourceId: 'lockB', resourceName: 'Lock B',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T1', threadName: 'Thread 1', type: 'release',
    message: 'T1 releases Lock B', severity: 'info', resourceId: 'lockB', resourceName: 'Lock B',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T1', threadName: 'Thread 1', type: 'release',
    message: 'T1 releases Lock A', severity: 'info', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'wake',
    message: 'T2 acquires Lock A', severity: 'success', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'acquire',
    message: 'T2 acquires Lock B', severity: 'success', resourceId: 'lockB', resourceName: 'Lock B',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'release',
    message: 'T2 releases Lock B', severity: 'info', resourceId: 'lockB', resourceName: 'Lock B',
  }));
  events.push(ev(step++, time += 1, {
    threadId: 'T2', threadName: 'Thread 2', type: 'release',
    message: 'T2 releases Lock A', severity: 'info', resourceId: 'lockA', resourceName: 'Lock A',
  }));
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'end',
    message: 'No deadlock — both threads completed successfully', severity: 'success',
  }));
  return events;
}

function deadlockFixedLogs(): LogLine[] {
  return [
    { stream: 'stdout', text: 'T1 acquired both', step: 4 },
    { stream: 'stdout', text: 'T2 acquired both', step: 8 },
  ];
}

function deadlockFixedDiagnostics(): Diagnostic[] {
  return [
    {
      id: 'dl-fixed-1',
      title: 'No deadlock — consistent ordering',
      severity: 'info',
      category: 'correct',
      description:
        'Both threads acquire locks in the same order (A before B). This breaks the circular wait condition: no cycle can form in the wait-for graph because every thread follows the same acquisition sequence.',
    },
  ];
}

// ---------- Producer-Consumer ----------
function producerConsumerEvents(): SimulationEvent[] {
  eventCounter = 0;
  const events: SimulationEvent[] = [];
  let step = 0;
  let time = 0;

  events.push(ev(step++, time, {
    threadId: null, threadName: null, type: 'start',
    message: 'Simulation started: bounded buffer (capacity 5)', severity: 'info',
  }));

  for (let i = 1; i <= 10; i++) {
    events.push(ev(step++, time, {
      threadId: 'P', threadName: 'Producer', type: 'acquire',
      message: 'Producer locks buffer mutex', severity: 'success', resourceId: 'mtx', resourceName: 'mutex',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'P', threadName: 'Producer', type: 'produce',
      message: `Producer pushes ${i} (buffer size: ${Math.min(i, 5)})`, severity: 'info', resourceId: 'buffer', resourceName: 'buffer',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'P', threadName: 'Producer', type: 'release',
      message: 'Producer unlocks, notifies consumer', severity: 'success', resourceId: 'mtx', resourceName: 'mutex',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'C', threadName: 'Consumer', type: 'acquire',
      message: 'Consumer locks buffer mutex', severity: 'success', resourceId: 'mtx', resourceName: 'mutex',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'C', threadName: 'Consumer', type: 'consume',
      message: `Consumer pops ${i} (buffer size: ${Math.max(0, Math.min(i, 5) - 1)})`, severity: 'info', resourceId: 'buffer', resourceName: 'buffer',
    }));
    events.push(ev(step++, time += 1, {
      threadId: 'C', threadName: 'Consumer', type: 'release',
      message: 'Consumer unlocks, notifies producer', severity: 'success', resourceId: 'mtx', resourceName: 'mutex',
    }));
  }

  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'end',
    message: 'All 10 items produced and consumed correctly', severity: 'success',
  }));
  return events;
}

function producerConsumerLogs(events: SimulationEvent[]): LogLine[] {
  return events
    .filter((e) => e.type === 'produce' || e.type === 'consume')
    .map((e) => ({
      stream: 'stdout' as const,
      text: e.type === 'produce' ? `Produced: ${e.step}` : `Consumed: ${e.step}`,
      step: e.step,
    }));
}

function producerConsumerDiagnostics(): Diagnostic[] {
  return [
    {
      id: 'pc-1',
      title: 'Correct synchronization',
      severity: 'info',
      category: 'correct',
      description:
        'The mutex protects the shared buffer while the condition variables coordinate producer and consumer. The producer waits when the buffer is full; the consumer waits when it is empty. No data is lost or duplicated.',
    },
  ];
}

function producerConsumerThreads(): Thread[] {
  return [
    { id: 'P', name: 'Producer', state: 'idle', ownedResources: [], waitingFor: null, color: '#8B5CF6' },
    { id: 'C', name: 'Consumer', state: 'idle', ownedResources: [], waitingFor: null, color: '#34D399' },
  ];
}

function producerConsumerResources(): Resource[] {
  return [
    { id: 'mtx', name: 'mutex', kind: 'mutex', owner: null, waitingQueue: [] },
    { id: 'buffer', name: 'buffer', kind: 'buffer', owner: null, waitingQueue: [], capacity: 5, count: 0 },
  ];
}

// ---------- Dining Philosophers ----------
function diningPhilosophersEvents(): SimulationEvent[] {
  eventCounter = 0;
  const events: SimulationEvent[] = [];
  let step = 0;
  let time = 0;

  events.push(ev(step++, time, {
    threadId: null, threadName: null, type: 'start',
    message: 'Simulation started: 5 philosophers, 5 forks', severity: 'info',
  }));

  // Each philosopher picks up left fork
  for (let i = 0; i < 5; i++) {
    const leftFork = `fork${i}`;
    events.push(ev(step++, time, {
      threadId: `P${i}`, threadName: `Philosopher ${i}`, type: 'acquire',
      message: `P${i} picks up left fork (Fork ${i})`, severity: 'success', resourceId: leftFork, resourceName: `Fork ${i}`,
    }));
  }

  // Each tries to pick up right fork — all blocked
  for (let i = 0; i < 5; i++) {
    const rightIdx = (i + 1) % 5;
    const rightFork = `fork${rightIdx}`;
    events.push(ev(step++, time += 1, {
      threadId: `P${i}`, threadName: `Philosopher ${i}`, type: 'request',
      message: `P${i} requests right fork (Fork ${rightIdx}) → held by P${rightIdx}`, severity: 'warning', resourceId: rightFork, resourceName: `Fork ${rightIdx}`,
    }));
  }

  const cycle = ['P0', 'fork1', 'P1', 'fork2', 'P2', 'fork3', 'P3', 'fork4', 'P4', 'fork0', 'P0'];
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'deadlock',
    message: 'DEADLOCK: circular wait P0→F1→P1→F2→P2→F3→P3→F4→P4→F0→P0', severity: 'error',
  }));
  events.push(ev(step++, time += 1, {
    threadId: null, threadName: null, type: 'end',
    message: 'Simulation halted (deadlock)', severity: 'info',
  }));

  void cycle;
  return events;
}

function diningPhilosophersLogs(): LogLine[] {
  return [
    { stream: 'stderr', text: 'Deadlock: all philosophers holding one fork, waiting for next', step: 10 },
  ];
}

function diningPhilosophersDiagnostics(): Diagnostic[] {
  return [
    {
      id: 'dp-1',
      title: 'Circular wait — dining philosophers deadlock',
      severity: 'error',
      category: 'deadlock',
      description:
        'Each philosopher picks up their left fork then waits for the right fork, which is the left fork of their neighbor. Since every philosopher holds one fork and waits for the next, a cycle spans all five participants.',
      suggestion:
        'Break symmetry: have one philosopher pick up forks in the opposite order (right first), or use a waiter/arbitrator that limits diners to at most n-1 simultaneous attempts.',
    },
  ];
}

function diningPhilosophersThreads(): Thread[] {
  const colors = ['#8B5CF6', '#34D399', '#FBBF24', '#F87171', '#60A5FA'];
  return Array.from({ length: 5 }, (_, i) => ({
    id: `P${i}`, name: `Philosopher ${i}`, state: 'idle' as const, ownedResources: [], waitingFor: null, color: colors[i],
  }));
}

function diningPhilosophersResources(): Resource[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `fork${i}`, name: `Fork ${i}`, kind: 'fork' as const, owner: null, waitingQueue: [],
  }));
}

// ---------- Scenario registry ----------
export interface ScenarioDef {
  kind: SimKind;
  label: string;
  exampleId: string;
  hasIssue: boolean;
  expectedDurationMs: number;
  buildEvents: () => SimulationEvent[];
  buildLogs: (events: SimulationEvent[]) => LogLine[];
  buildDiagnostics: (events: SimulationEvent[]) => Diagnostic[];
  initialThreads: () => Thread[];
  initialResources: () => Resource[];
}

export const SCENARIOS: Record<SimKind, ScenarioDef> = {
  race: {
    kind: 'race',
    label: 'Race Condition',
    exampleId: 'race-condition',
    hasIssue: true,
    expectedDurationMs: 1800,
    buildEvents: raceConditionEvents,
    buildLogs: raceConditionLogs,
    buildDiagnostics: raceDiagnostics,
    initialThreads: raceThreads,
    initialResources: raceResources,
  },
  raceFixed: {
    kind: 'raceFixed',
    label: 'Fixed Race Condition',
    exampleId: 'race-condition',
    hasIssue: false,
    expectedDurationMs: 2400,
    buildEvents: raceFixedEvents,
    buildLogs: () => raceFixedLogs(),
    buildDiagnostics: () => raceFixedDiagnostics(),
    initialThreads: () => [
      { id: 'T1', name: 'Thread 1', state: 'idle', ownedResources: [], waitingFor: null, color: '#8B5CF6' },
      { id: 'T2', name: 'Thread 2', state: 'idle', ownedResources: [], waitingFor: null, color: '#34D399' },
    ],
    initialResources: () => [
      { id: 'mtx', name: 'mutex', kind: 'mutex', owner: null, waitingQueue: [] },
      { id: 'counter', name: 'counter', kind: 'mutex', owner: null, waitingQueue: [] },
    ],
  },
  deadlock: {
    kind: 'deadlock',
    label: 'Deadlock',
    exampleId: 'deadlock',
    hasIssue: true,
    expectedDurationMs: 1200,
    buildEvents: deadlockEvents,
    buildLogs: () => deadlockLogs(),
    buildDiagnostics: () => deadlockDiagnostics(),
    initialThreads: deadlockThreads,
    initialResources: deadlockResources,
  },
  deadlockFixed: {
    kind: 'deadlockFixed',
    label: 'Fixed Deadlock',
    exampleId: 'deadlock',
    hasIssue: false,
    expectedDurationMs: 2000,
    buildEvents: deadlockFixedEvents,
    buildLogs: () => deadlockFixedLogs(),
    buildDiagnostics: () => deadlockFixedDiagnostics(),
    initialThreads: deadlockThreads,
    initialResources: deadlockResources,
  },
  producerConsumer: {
    kind: 'producerConsumer',
    label: 'Producer-Consumer',
    exampleId: 'producer-consumer',
    hasIssue: false,
    expectedDurationMs: 3000,
    buildEvents: producerConsumerEvents,
    buildLogs: producerConsumerLogs,
    buildDiagnostics: () => producerConsumerDiagnostics(),
    initialThreads: producerConsumerThreads,
    initialResources: producerConsumerResources,
  },
  diningPhilosophers: {
    kind: 'diningPhilosophers',
    label: 'Dining Philosophers',
    exampleId: 'dining-philosophers',
    hasIssue: true,
    expectedDurationMs: 1500,
    buildEvents: diningPhilosophersEvents,
    buildLogs: () => diningPhilosophersLogs(),
    buildDiagnostics: () => diningPhilosophersDiagnostics(),
    initialThreads: diningPhilosophersThreads,
    initialResources: diningPhilosophersResources,
  },
};

export function scenarioForExample(exampleId: string, fixed: boolean): ScenarioDef {
  if (exampleId === 'race-condition') return fixed ? SCENARIOS.raceFixed : SCENARIOS.race;
  if (exampleId === 'deadlock') return fixed ? SCENARIOS.deadlockFixed : SCENARIOS.deadlock;
  if (exampleId === 'producer-consumer') return SCENARIOS.producerConsumer;
  if (exampleId === 'dining-philosophers') return SCENARIOS.diningPhilosophers;
  return SCENARIOS.race;
}

// ---------- Cycle detection ----------
export function detectCycle(
  threads: Thread[],
  resources: Resource[],
): string[] | null {
  // Build wait-for graph: thread -> thread that holds the resource it waits for
  const waitFor = new Map<string, string>();
  for (const t of threads) {
    if (t.waitingFor) {
      const res = resources.find((r) => r.id === t.waitingFor);
      if (res?.owner) {
        waitFor.set(t.id, res.owner);
      }
    }
  }

  // DFS cycle detection
  const visited = new Set<string>();
  const stack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      return path.slice(cycleStart).concat(node);
    }
    if (visited.has(node)) return null;
    visited.add(node);
    stack.add(node);
    path.push(node);
    const next = waitFor.get(node);
    if (next) {
      const result = dfs(next);
      if (result) return result;
    }
    stack.delete(node);
    path.pop();
    return null;
  }

  for (const t of threads) {
    const result = dfs(t.id);
    if (result) return result;
  }
  return null;
}
