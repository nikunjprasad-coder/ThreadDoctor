import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Scissors,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lock,
  Workflow,
  Cpu,
  Layers,
  GitBranch,
  Terminal,
  GraduationCap,
  Siren,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Play,
  SkipForward,
  RotateCcw,
  Clock,
  Zap,
  Database,
  Wrench,
  Lightbulb,
  Home,
  Eye,
  FlaskConical,
} from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';
import { ResourceGraph } from '@/components/ResourceGraph';
import type { Thread, Resource, GraphEdge } from '@/types';

/* ---------- Slide deck data ---------- */

const RACE_CODE = `int counter = 0;

void increment(int n) {
    for (int i = 0; i < n; ++i) {
        counter = counter + 1;  // NOT atomic
    }
}

// Two threads call increment(10000)
// Expected: 20000
// Actual:   11842  (lost updates)`;

const RACE_FIXED_CODE = `std::mutex mtx;
int counter = 0;

void increment(int n) {
    for (int i = 0; i < n; ++i) {
        std::lock_guard<std::mutex> lock(mtx);
        counter = counter + 1;  // protected
    }
}

// Two threads call increment(10000)
// Result: 20000  (correct)`;

const DEADLOCK_CODE = `std::mutex lockA, lockB;

void thread1() {
    lockA.lock();    // T1 holds A
    lockB.lock();    // T1 wants B → waits
}
void thread2() {
    lockB.lock();    // T2 holds B
    lockA.lock();    // T2 wants A → waits
}
// T1 and T2 wait forever — DEADLOCK`;

const ARCH_LAYERS = [
  { icon: Cpu, label: 'React + TypeScript UI', desc: '7 pages, responsive dark-themed layout' },
  { icon: GitBranch, label: 'Deterministic Simulation Engine', desc: 'Fixed event sequences replayed step-by-step' },
  { icon: Workflow, label: 'Visualization Layer', desc: 'React Flow graphs + Recharts + custom highlighter' },
  { icon: Database, label: 'Local Persistence', desc: 'LocalStorage for history, settings, lesson progress' },
];

const COFFMAN = [
  { icon: Lock, title: 'Mutual Exclusion', desc: 'A resource cannot be shared' },
  { icon: Cpu, title: 'Hold and Wait', desc: 'Thread holds one resource, waits for another' },
  { icon: AlertTriangle, title: 'No Preemption', desc: 'Resources cannot be forcibly taken' },
  { icon: GitBranch, title: 'Circular Wait', desc: 'A cycle forms in the wait-for graph' },
];

const FEATURES = [
  { icon: Cpu, title: 'Playground', desc: 'Code editor + simulation + diagnostics' },
  { icon: Workflow, title: 'Live Visualizer', desc: 'Animated thread/resource graph' },
  { icon: Siren, title: 'Deadlock Detector', desc: 'Cycle detection + Coffman conditions' },
  { icon: GraduationCap, title: 'Learning Lab', desc: '8 lessons with quizzes and progress' },
  { icon: Clock, title: 'Run History', desc: 'Searchable, filterable, persisted' },
  { icon: Wrench, title: 'Fix Comparison', desc: 'Before/after code with results' },
];

/* ---------- Small animated deadlock graph for a slide ---------- */

function MiniDeadlockGraph() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 5) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step]);

  function reset() {
    setStep(0);
  }

  const threads: Thread[] = [
    { id: 'T1', name: 'Thread 1', state: step >= 4 ? 'blocked' : step >= 2 ? 'waiting' : step >= 1 ? 'running' : 'idle', ownedResources: step >= 1 ? ['lockA'] : [], waitingFor: step >= 3 ? 'lockB' : null, color: '#8B5CF6' },
    { id: 'T2', name: 'Thread 2', state: step >= 4 ? 'blocked' : step >= 3 ? 'waiting' : step >= 2 ? 'running' : 'idle', ownedResources: step >= 2 ? ['lockB'] : [], waitingFor: step >= 3 ? 'lockA' : null, color: '#34D399' },
  ];

  const resources: Resource[] = [
    { id: 'lockA', name: 'Lock A', kind: 'mutex', owner: step >= 1 ? 'T1' : null, waitingQueue: step >= 3 ? ['T2'] : [] },
    { id: 'lockB', name: 'Lock B', kind: 'mutex', owner: step >= 2 ? 'T2' : null, waitingQueue: step >= 3 ? ['T1'] : [] },
  ];

  const edges: GraphEdge[] = [];
  for (const r of resources) {
    if (r.owner) edges.push({ id: `own-${r.owner}-${r.id}`, source: r.owner, target: r.id, type: 'ownership' });
    for (const w of r.waitingQueue) edges.push({ id: `wait-${w}-${r.id}`, source: w, target: r.id, type: 'waiting', animated: true });
  }

  const steps = [
    'Both threads start idle',
    'T1 acquires Lock A',
    'T2 acquires Lock B',
    'T1 wants Lock B, T2 wants Lock A',
    'Deadlock — circular wait detected',
  ];

  return (
    <div className="space-y-3">
      <ResourceGraph threads={threads} resources={resources} edges={edges} deadlockCycle={step >= 4 ? ['T1', 'lockB', 'T2', 'lockA', 'T1'] : undefined} height={300} />
      <div className="flex items-center gap-2">
        <button onClick={() => setStep((s) => Math.min(s + 1, 5))} className="btn-secondary px-2 py-1 text-xs"><SkipForward className="w-3.5 h-3.5" />Step</button>
        <button onClick={reset} className="btn-secondary px-2 py-1 text-xs"><RotateCcw className="w-3.5 h-3.5" />Reset</button>
        <span className="text-xs text-muted font-mono ml-auto">Step {step}/5</span>
      </div>
      <div className="text-xs text-muted-light min-h-[20px]">
        {steps[step] || 'Simulation complete'}
      </div>
    </div>
  );
}

/* ---------- Race condition animated diagram ---------- */

function RaceAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 4) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step]);

  const labels = [
    'T1 reads counter = 5',
    'T2 reads counter = 5 (stale!)',
    'T1 writes counter = 6',
    'T2 writes counter = 6 (overwrites T1)',
    'Result: 1 increment lost',
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 justify-center py-4">
        <div className="text-center">
          <div className="text-xs text-muted mb-2">Thread 1</div>
          <div className={`font-mono text-sm rounded-lg border px-4 py-2 transition-all ${step >= 1 ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border-subtle text-muted'}`}>
            read: 5
          </div>
          <div className={`font-mono text-sm rounded-lg border px-4 py-2 mt-2 transition-all ${step >= 3 ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border-subtle text-muted'}`}>
            write: 6
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted" />
        <div className="text-center">
          <div className="text-xs text-muted mb-2">counter</div>
          <div className="font-mono text-2xl font-bold rounded-lg border-2 border-border-strong px-6 py-3 bg-bg-base text-slate-100">
            {step >= 4 ? 6 : step >= 3 ? 6 : step >= 1 ? 5 : 0}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted" />
        <div className="text-center">
          <div className="text-xs text-muted mb-2">Thread 2</div>
          <div className={`font-mono text-sm rounded-lg border px-4 py-2 transition-all ${step >= 2 ? 'border-success/50 bg-success/10 text-success' : 'border-border-subtle text-muted'}`}>
            read: 5
          </div>
          <div className={`font-mono text-sm rounded-lg border px-4 py-2 mt-2 transition-all ${step >= 4 ? 'border-success/50 bg-success/10 text-success' : 'border-border-subtle text-muted'}`}>
            write: 6
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-center">
        <button onClick={() => setStep((s) => Math.min(s + 1, 4))} className="btn-secondary px-2 py-1 text-xs"><SkipForward className="w-3.5 h-3.5" />Step</button>
        <button onClick={() => setStep(0)} className="btn-secondary px-2 py-1 text-xs"><RotateCcw className="w-3.5 h-3.5" />Reset</button>
        <span className="text-xs text-muted-light ml-2">{labels[step] || 'Done'}</span>
      </div>
    </div>
  );
}

/* ---------- Slide definitions ---------- */

interface Slide {
  id: number;
  title: string;
  render: () => ReactNode;
}

const SLIDES: Slide[] = [
  // 1 — Title
  {
    id: 1,
    title: 'ThreadDoctor',
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="relative flex items-center justify-center rounded-2xl bg-accent/15 border-2 border-accent/30 w-20 h-20 mb-8 animate-pulse-ring">
          <Activity className="text-accent w-10 h-10" />
          <Scissors className="absolute text-accent/70 w-6 h-6 bottom-1 right-1" />
        </div>
        <h1 className="text-5xl font-bold text-slate-100 tracking-tight">ThreadDoctor</h1>
        <p className="text-xl text-accent mt-4 font-medium">Understand concurrency. Debug with confidence.</p>
        <p className="text-muted-light mt-6 max-w-2xl leading-relaxed">
          An interactive concurrency debugging platform that helps students and developers
          explore race conditions, deadlocks, and synchronization — right in the browser.
        </p>
        <div className="flex flex-wrap gap-2 mt-8 justify-center">
          {['React + TypeScript', 'Deterministic Sim Engine', 'React Flow', 'No backend required'].map((t) => (
            <span key={t} className="label-badge bg-bg-raised border border-border-subtle text-muted-light">{t}</span>
          ))}
        </div>
      </div>
    ),
  },

  // 2 — The Problem
  {
    id: 2,
    title: 'The Problem',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={AlertTriangle} title="Concurrency bugs are notoriously hard to learn" accent="danger" />
        <div className="grid md:grid-cols-2 gap-5">
          <ProblemCard
            icon={AlertTriangle}
            title="Non-deterministic by nature"
            desc="Race conditions depend on thread timing. The bug may appear once in a thousand runs — or never on your machine but constantly in production."
          />
          <ProblemCard
            icon={XCircle}
            title="Deadlocks are silent"
            desc="A program can hang forever with no error message. The cause — a circular wait — is invisible without a graph of who holds what."
          />
          <ProblemCard
            icon={Cpu}
            title="Hard to reproduce"
            desc="Students can't easily experiment with multithreaded C++ without setting up a build environment, dealing with timing, and hoping the bug shows."
          />
          <ProblemCard
            icon={GraduationCap}
            title="Abstract concepts"
            desc="Mutexes, semaphores, condition variables, the Coffman conditions — these are abstract and hard to grasp from textbook diagrams alone."
          />
        </div>
        <div className="card p-5 border-danger/30 bg-danger/5">
          <p className="text-sm text-muted-light leading-relaxed">
            <strong className="text-danger">The core challenge:</strong> How do you let someone
            <em> see</em> a race condition happen, <em>watch</em> a deadlock form, and
            <em> experiment</em> with fixes — without a compiler, without unpredictable timing, and without a complex setup?
          </p>
        </div>
      </div>
    ),
  },

  // 3 — The Solution
  {
    id: 3,
    title: 'The Solution',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={Lightbulb} title="ThreadDoctor: Deterministic browser-based simulations" accent="warning" />
        <div className="card p-6">
          <p className="text-base text-slate-200 leading-relaxed">
            ThreadDoctor replaces unpredictable real-thread timing with
            <strong className="text-accent"> deterministic event sequences</strong> — the same scenario
            always produces the same result. This makes concurrency bugs
            <em> reproducible, observable, and teachable</em>.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <SolutionCard icon={Play} title="Reproducible" desc="Every simulation runs a fixed event sequence. A race condition happens every time, not randomly." />
          <SolutionCard icon={Eye} title="Visual" desc="Threads, locks, and waiting edges animate on an interactive graph. You see the deadlock form." />
          <SolutionCard icon={Wrench} title="Interactive" desc="Apply fixes, compare before/after, run cycle detection, take quizzes — all in the browser." />
        </div>
        <div className="card p-5 border-accent/20 bg-accent/5">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-muted-light">
              No compiler, no API keys, no backend. The entire simulation engine runs client-side.
              A future version can connect to a real C++ engine, but the learning value is available now.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // 4 — How it works: Engine
  {
    id: 4,
    title: 'How It Works: Simulation Engine',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={Cpu} title="Deterministic event replay engine" accent="default" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <StepRow num={1} title="Generate events" desc="Each scenario defines a fixed sequence of SimulationEvents: acquire, release, wait, deadlock, etc." />
            <StepRow num={2} title="Replay step-by-step" desc="The eventEngine applies events one at a time, updating thread states and resource ownership." />
            <StepRow num={3} title="Build the graph" desc="After each step, ownership edges and waiting edges are derived from current thread/resource state." />
            <StepRow num={4} title="Detect cycles" desc="A DFS cycle check on the wait-for graph identifies deadlocks in real time." />
            <StepRow num={5} title="Produce diagnostics" desc="Each scenario ships with explanatory diagnostics and suggested fixes." />
          </div>
          <div className="card p-4">
            <div className="text-xs font-mono text-muted uppercase tracking-wider mb-3">Engine flow</div>
            <div className="space-y-2 font-mono text-xs">
              <FlowBox label="ScenarioDef.buildEvents()" color="accent" />
              <FlowArrow />
              <FlowBox label="eventEngine.applyEventsUpTo(step)" color="warning" />
              <FlowArrow />
              <FlowBox label="Snapshot { threads, resources, edges }" color="success" />
              <FlowArrow />
              <FlowBox label="detectCycle(threads, resources)" color="danger" />
              <FlowArrow />
              <FlowBox label="Diagnostics + Suggested Fix" color="accent" />
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 5 — Race condition demo
  {
    id: 5,
    title: 'Race Condition: Visualized',
    render: () => (
      <div className="space-y-5">
        <SlideHeader icon={AlertTriangle} title="Race condition — lost updates" accent="danger" />
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <p className="text-sm text-muted-light leading-relaxed">
              Two threads read the same counter value, both increment, and both write back.
              The second write overwrites the first — an increment is silently lost.
            </p>
            <RaceAnimation />
            <div className="card p-3 border-danger/30 bg-danger/5">
              <p className="text-xs text-danger font-medium">Result: counter = 6 instead of 7</p>
              <p className="text-xs text-muted mt-1">Over 10,000 iterations, this produces 11,842 instead of 20,000.</p>
            </div>
          </div>
          <div className="h-[320px]">
            <CodeEditor code={RACE_CODE} />
          </div>
        </div>
      </div>
    ),
  },

  // 6 — Race fix
  {
    id: 6,
    title: 'Race Condition: Fixed',
    render: () => (
      <div className="space-y-5">
        <SlideHeader icon={CheckCircle2} title="Mutex fix — serialized access" accent="success" />
        <div className="grid md:grid-cols-2 gap-5">
          <div className="h-[320px]">
            <CodeEditor code={RACE_FIXED_CODE} />
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-slate-100 mb-2">How the fix works</h4>
              <ul className="text-sm text-muted-light space-y-2 list-disc list-inside">
                <li><code className="text-accent font-mono text-xs">std::lock_guard</code> acquires the mutex on construction</li>
                <li>Only one thread enters the critical section at a time</li>
                <li>The second thread blocks until the first releases</li>
                <li>Read-modify-write becomes atomic — no lost updates</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 border-danger/30 bg-danger/5 text-center">
                <div className="text-xs text-muted uppercase">Before</div>
                <div className="text-2xl font-bold text-danger mt-1">11,842</div>
                <div className="text-[10px] text-muted">expected 20,000</div>
              </div>
              <div className="card p-4 border-success/30 bg-success/5 text-center">
                <div className="text-xs text-muted uppercase">After</div>
                <div className="text-2xl font-bold text-success mt-1">20,000</div>
                <div className="text-[10px] text-muted">correct</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 7 — Deadlock demo
  {
    id: 7,
    title: 'Deadlock: Visualized',
    render: () => (
      <div className="space-y-5">
        <SlideHeader icon={Siren} title="Deadlock — circular wait" accent="danger" />
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <p className="text-sm text-muted-light leading-relaxed">
              Watch the deadlock form step by step. T1 grabs Lock A, T2 grabs Lock B.
              Each then waits for the lock the other holds — a cycle forms and both block forever.
            </p>
            <MiniDeadlockGraph />
          </div>
          <div className="space-y-3">
            <div className="h-[280px]">
              <CodeEditor code={DEADLOCK_CODE} />
            </div>
            <div className="card p-4 border-danger/30 bg-danger/5">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-danger" />
                <span className="text-xs font-semibold text-danger uppercase tracking-wider">Cycle Detected</span>
              </div>
              <div className="font-mono text-xs text-slate-200">
                T1 → Lock B → T2 → Lock A → T1
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 8 — Coffman conditions
  {
    id: 8,
    title: 'Deadlock Detection: Coffman Conditions',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={Layers} title="The four necessary conditions for deadlock" accent="default" />
        <p className="text-sm text-muted-light">All four must hold simultaneously for a deadlock to occur. Breaking any one prevents it.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {COFFMAN.map((c, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted">CONDITION {i + 1}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 mt-0.5">{c.title}</h4>
                  <p className="text-xs text-muted-light mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card p-4 border-success/20 bg-success/5">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <p className="text-sm text-muted-light">
              <strong className="text-success">Prevention strategy:</strong> ThreadDoctor's fix enforces a
              <em> global lock ordering</em> (always A before B). This breaks the circular wait condition —
              no cycle can form because every thread follows the same acquisition sequence.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // 9 — Architecture
  {
    id: 9,
    title: 'Architecture',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={Layers} title="Layered architecture" accent="default" />
        <div className="space-y-3">
          {ARCH_LAYERS.map((layer, i) => (
            <div key={i} className="card p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 text-accent shrink-0">
                <layer.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-100">{layer.label}</h4>
                <p className="text-xs text-muted-light mt-0.5">{layer.desc}</p>
              </div>
              {i < ARCH_LAYERS.length - 1 && <ArrowRight className="w-5 h-5 text-muted rotate-90" />}
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Project Structure</h4>
            <div className="font-mono text-[11px] text-muted-light space-y-0.5">
              <div>src/components/ — 10 reusable UI components</div>
              <div>src/pages/ — 7 route-level pages</div>
              <div>src/simulation/ — engine + scenarios</div>
              <div>src/hooks/ — useSimulation, useLocalStorage</div>
              <div>src/types/ — Thread, Resource, Event, Diagnostic</div>
              <div>src/data/ — example definitions</div>
            </div>
          </div>
          <div className="card p-4">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Flow', 'Recharts', 'React Router', 'Lucide Icons'].map((t) => (
                <span key={t} className="label-badge bg-bg-raised border border-border-subtle text-muted-light text-[11px]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },

  // 10 — Features
  {
    id: 10,
    title: 'Key Features',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={CheckCircle2} title="Six core features, all functional" accent="success" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="card p-5 hover:border-accent/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent w-fit mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100">{f.title}</h4>
              <p className="text-xs text-muted-light mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="card p-4 border-accent/20 bg-accent/5">
          <p className="text-sm text-muted-light text-center">
            Every button, dropdown, tab, and control has a meaningful behavior.
            No placeholders, no dead links — all 7 routes are fully wired.
          </p>
        </div>
      </div>
    ),
  },

  // 11 — Examples
  {
    id: 11,
    title: 'Predefined Examples',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={FlaskConical} title="Six classic concurrency scenarios" accent="default" />
        <div className="grid md:grid-cols-2 gap-4">
          <ExampleRow name="Race Condition" desc="Two threads increment a shared counter without a mutex" hasFix />
          <ExampleRow name="Deadlock" desc="Two threads acquire two mutexes in opposite orders" hasFix />
          <ExampleRow name="Producer-Consumer" desc="Bounded buffer with mutex and condition variables" />
          <ExampleRow name="Dining Philosophers" desc="Five philosophers competing for five forks" />
        </div>
        <div className="card p-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Each example includes</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <FeatureChip icon={Terminal} label="C++ code" />
            <FeatureChip icon={Play} label="Deterministic simulation" />
            <FeatureChip icon={AlertTriangle} label="Issue diagnosis" />
            <FeatureChip icon={Wrench} label="Suggested fix" />
          </div>
        </div>
      </div>
    ),
  },

  // 12 — Results & Impact
  {
    id: 12,
    title: 'Results & Impact',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={CheckCircle2} title="What learners gain" accent="success" />
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard value="6" label="Concurrency scenarios" sub="with before/after fixes" />
          <StatCard value="8" label="Interactive lessons" sub="with quizzes & progress tracking" />
          <StatCard value="0" label="External dependencies" sub="no API keys, no backend" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-slate-100 mb-3">For Students</h4>
            <ul className="text-sm text-muted-light space-y-2 list-disc list-inside">
              <li>See race conditions and deadlocks happen, not just read about them</li>
              <li>Experiment with fixes and immediately see the corrected result</li>
              <li>Learn at their own pace with interactive lessons and quizzes</li>
              <li>No environment setup — just open and learn</li>
            </ul>
          </div>
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-slate-100 mb-3">For Educators</h4>
            <ul className="text-sm text-muted-light space-y-2 list-disc list-inside">
              <li>Demonstrate concurrency bugs live in a lecture</li>
              <li>Reproducible — same result every time, no flaky demos</li>
              <li>Students can explore independently and track their progress</li>
              <li>Extensible — new scenarios are just a new event sequence</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  // 13 — Future & Thanks
  {
    id: 13,
    title: 'Future Roadmap',
    render: () => (
      <div className="space-y-6">
        <SlideHeader icon={ArrowRight} title="What's next" accent="default" />
        <div className="space-y-3">
          <FutureRow icon={Cpu} title="Real C++ execution engine" desc="Connect a Python FastAPI backend to compile and run actual multithreaded C++ programs." />
          <FutureRow icon={Terminal} title="Custom code input" desc="Let users paste their own C++ code and simulate arbitrary concurrency patterns." />
          <FutureRow icon={Database} title="Banker's Algorithm" desc="Extend deadlock detection to multi-instance resource systems." />
          <FutureRow icon={AlertTriangle} title="ThreadSanitizer-style reports" desc="Format diagnostics like real-world sanitizer output for familiar tooling." />
        </div>
        <div className="card p-8 text-center mt-8">
          <div className="relative flex items-center justify-center rounded-2xl bg-accent/15 border-2 border-accent/30 w-16 h-16 mx-auto mb-4">
            <Activity className="text-accent w-8 h-8" />
            <Scissors className="absolute text-accent/70 w-5 h-5 bottom-0.5 right-0.5" />
          </div>
          <h3 className="text-2xl font-bold text-slate-100">Thank You</h3>
          <p className="text-muted-light mt-3">ThreadDoctor — making concurrency debugging visible, reproducible, and learnable.</p>
          <div className="flex gap-2 justify-center mt-6">
            <button onClick={() => window.open('/', '_self')} className="btn-primary">
              <Home className="w-4 h-4" />
              Open ThreadDoctor
            </button>
          </div>
        </div>
      </div>
    ),
  },
];

/* ---------- Small helper components ---------- */

function SlideHeader({ icon: Icon, title, accent }: { icon: typeof Activity; title: string; accent: 'default' | 'danger' | 'success' | 'warning' }) {
  const colors = {
    default: 'text-accent bg-accent/10',
    danger: 'text-danger bg-danger/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${colors[accent]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
    </div>
  );
}

function ProblemCard({ icon: Icon, title, desc }: { icon: typeof AlertTriangle; title: string; desc: string }) {
  return (
    <div className="card p-5 border-danger/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-danger/10 text-danger shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
          <p className="text-xs text-muted-light mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function SolutionCard({ icon: Icon, title, desc }: { icon: typeof Play; title: string; desc: string }) {
  return (
    <div className="card p-5">
      <div className="p-2.5 rounded-xl bg-success/10 text-success w-fit mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      <p className="text-xs text-muted-light mt-1">{desc}</p>
    </div>
  );
}

function StepRow({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/15 text-accent text-xs font-mono font-bold shrink-0">{num}</span>
      <div>
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
        <p className="text-xs text-muted-light mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FlowBox({ label, color }: { label: string; color: 'accent' | 'warning' | 'success' | 'danger' }) {
  const colors = {
    accent: 'border-accent/30 bg-accent/5 text-accent',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    success: 'border-success/30 bg-success/5 text-success',
    danger: 'border-danger/30 bg-danger/5 text-danger',
  };
  return <div className={`rounded-lg border px-3 py-2 ${colors[color]}`}>{label}</div>;
}

function FlowArrow() {
  return <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-muted rotate-90" /></div>;
}

function ExampleRow({ name, desc, hasFix }: { name: string; desc: string; hasFix?: boolean }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <FlaskConical className="w-5 h-5 text-accent shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-100">{name}</h4>
          {hasFix && <span className="label-badge bg-success/10 text-success border border-success/30 text-[10px]">has fix</span>}
        </div>
        <p className="text-xs text-muted-light mt-1">{desc}</p>
      </div>
    </div>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: typeof Terminal; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-bg-raised border border-border-subtle px-3 py-2">
      <Icon className="w-3.5 h-3.5 text-accent" />
      <span className="text-muted-light">{label}</span>
    </div>
  );
}

function StatCard({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-3xl font-bold text-accent">{value}</div>
      <div className="text-sm text-slate-200 mt-1">{label}</div>
      <div className="text-xs text-muted mt-0.5">{sub}</div>
    </div>
  );
}

function FutureRow({ icon: Icon, title, desc }: { icon: typeof Cpu; title: string; desc: string }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
        <p className="text-xs text-muted-light mt-1">{desc}</p>
      </div>
    </div>
  );
}

/* ---------- Main Presentation component ---------- */

export function Presentation() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[current];

  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total]);
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);
  const goFirst = useCallback(() => setCurrent(0), []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goFirst();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, goFirst, navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-bg-base flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 h-14 border-b border-border-subtle bg-bg-panel shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center rounded-lg bg-accent/15 border border-accent/30 w-8 h-8">
            <Activity className="text-accent w-4 h-4" />
            <Scissors className="absolute text-accent/70 w-2.5 h-2.5 bottom-0.5 right-0.5" />
          </div>
          <span className="font-semibold text-slate-100 text-sm">ThreadDoctor — Presentation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-mono">{current + 1} / {total}</span>
          <button onClick={() => navigate('/')} className="btn-ghost px-2 py-1 text-xs">
            <Home className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12 min-h-full flex flex-col">
          <div className="flex-1 animate-fade-in" key={slide.id}>
            <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">
              Slide {slide.id} — {slide.title}
            </div>
            {slide.render()}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 h-14 border-t border-border-subtle bg-bg-panel shrink-0">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'w-6 bg-accent' : 'w-2 bg-border-subtle hover:bg-border-strong'
              }`}
              title={`Slide ${i + 1}: ${s.title}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={current === total - 1}
          className="btn-secondary px-3 py-1.5 text-sm"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


