import { useState, useMemo } from 'react';
import { ResourceGraph } from '@/components/ResourceGraph';
import { EventTimeline } from '@/components/EventTimeline';
import { detectCycle, scenarioForExample } from '@/simulation/scenarios';
import { applyEventsUpTo } from '@/simulation/eventEngine';
import {
  Siren,
  Play,
  RotateCcw,
  Lock,
  Hand,
  Ban,
  CircleSlash,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import type { Thread, Resource, SimulationEvent, LogLine } from '@/types';

const COFFMAN = [
  {
    icon: Lock,
    title: 'Mutual Exclusion',
    desc: 'At least one resource is held in a non-shareable mode — only one thread can use it at a time.',
  },
  {
    icon: Hand,
    title: 'Hold and Wait',
    desc: 'A thread holding at least one resource waits to acquire additional resources held by others.',
  },
  {
    icon: Ban,
    title: 'No Preemption',
    desc: 'Resources cannot be forcibly taken from threads — they must be released voluntarily.',
  },
  {
    icon: CircleSlash,
    title: 'Circular Wait',
    desc: 'A chain of threads exists where each holds a resource the next one needs, forming a cycle.',
  },
];

export function DeadlockDetector() {
  const [analyzed, setAnalyzed] = useState(false);
  const [step, setStep] = useState(0);

  const scenario = useMemo(() => scenarioForExample('deadlock', false), []);
  const events = useMemo(() => scenario.buildEvents(), [scenario]);
  const logs: LogLine[] = useMemo(() => scenario.buildLogs(events), [scenario, events]);
  const baseThreads = useMemo(() => scenario.initialThreads(), [scenario]);
  const baseResources = useMemo(() => scenario.initialResources(), [scenario]);

  // Build snapshot at the current step
  const snapshot = useMemo(
    () => applyEventsUpTo(events, step, baseThreads, baseResources, logs),
    [events, step, baseThreads, baseResources, logs],
  );

  // Run analysis: step through to the end and detect cycle
  const analysisResult = useMemo(() => {
    if (!analyzed) return null;
    // Step through entire event sequence to find deadlock state
    const finalSnapshot = applyEventsUpTo(events, events.length - 1, baseThreads, baseResources, logs);
    const cycle = detectCycle(finalSnapshot.threads, finalSnapshot.resources);

    const deadlockedThreads = finalSnapshot.threads.filter((t) => t.state === 'blocked' || (t.state === 'waiting' && t.waitingFor));
    const involvedResources = new Set<string>();
    for (const t of deadlockedThreads) {
      if (t.waitingFor) involvedResources.add(t.waitingFor);
      for (const r of t.ownedResources) involvedResources.add(r);
    }

    return {
      hasDeadlock: cycle !== null,
      cycle: cycle,
      threads: deadlockedThreads.map((t) => t.name),
      resources: Array.from(involvedResources).map((id) => baseResources.find((r) => r.id === id)?.name ?? id),
      snapshot: finalSnapshot,
    };
  }, [analyzed, events, baseThreads, baseResources, logs]);

  function runAnalysis() {
    setStep(events.length - 1);
    setAnalyzed(true);
  }

  function reset() {
    setStep(0);
    setAnalyzed(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Deadlock Detector</h1>
        <p className="text-sm text-muted mt-1">
          Analyze the resource allocation graph for cycles. A cycle in the wait-for graph indicates deadlock
          when each resource has a single instance.
        </p>
      </div>

      {/* Coffman conditions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COFFMAN.map((c) => (
          <div key={c.title} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                <c.icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{c.title}</h3>
            </div>
            <p className="text-xs text-muted-light leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-100">Resource Allocation Graph</h3>
          <p className="text-xs text-muted mt-0.5">
            Showing the deadlock scenario: T1 holds Lock A, T2 holds Lock B, each waits for the other.
          </p>
        </div>
        <button onClick={runAnalysis} className="btn-primary">
          <Siren className="w-4 h-4" />
          Run Deadlock Analysis
        </button>
        <button onClick={reset} className="btn-secondary">
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Graph */}
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Graph Visualization</h3>
          <ResourceGraph
            threads={snapshot.threads}
            resources={snapshot.resources}
            edges={snapshot.edges}
            deadlockCycle={analysisResult?.cycle ?? snapshot.deadlockCycle}
            height={380}
          />
        </div>

        {/* Analysis result */}
        <div className="space-y-4">
          {!analyzed && (
            <div className="card p-8 text-center">
              <Play className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted-light">
                Click "Run Deadlock Analysis" to scan the resource allocation graph for cycles.
              </p>
            </div>
          )}

          {analyzed && analysisResult && (
            <>
              {/* Status */}
              <div className={`card p-5 border-2 ${analysisResult.hasDeadlock ? 'border-danger/40 bg-danger/5' : 'border-success/40 bg-success/5'}`}>
                <div className="flex items-center gap-3">
                  {analysisResult.hasDeadlock ? (
                    <XCircle className="w-8 h-8 text-danger" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  )}
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      {analysisResult.hasDeadlock ? 'Deadlock Detected' : 'No Deadlock'}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {analysisResult.hasDeadlock
                        ? 'A circular wait was found in the resource allocation graph.'
                        : 'No cycles found — the wait-for graph is acyclic.'}
                    </p>
                  </div>
                </div>
              </div>

              {analysisResult.hasDeadlock && (
                <>
                  <div className="card p-4">
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Threads Involved</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.threads.map((t) => (
                        <span key={t} className="label-badge bg-danger/10 text-danger border border-danger/30">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="card p-4">
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Resources Involved</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.resources.map((r) => (
                        <span key={r} className="label-badge bg-accent/10 text-accent border border-accent/30">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {analysisResult.cycle && (
                    <div className="card p-4 border-warning/30 bg-warning/5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <h4 className="text-xs font-semibold text-warning uppercase tracking-wider">Dependency Cycle</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                        {analysisResult.cycle.map((node, i) => (
                          <span key={i} className="flex items-center gap-1.5">
                            <span className={i % 2 === 0 ? 'text-danger' : 'text-accent'}>{node}</span>
                            {i < analysisResult.cycle!.length - 1 && <span className="text-muted">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="card p-4 border-success/20 bg-success/5">
                    <div className="flex items-start gap-2.5">
                      <Lightbulb className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Prevention Strategies</h4>
                        <ul className="text-xs text-muted-light space-y-1.5 list-disc list-inside">
                          <li>Enforce a global lock ordering (always A before B) to break circular wait.</li>
                          <li>Use std::lock() or std::scoped_lock to acquire multiple locks atomically.</li>
                          <li>Use a timeout with try_lock and back off if not all locks can be acquired.</li>
                          <li>Use a deadlock detection scheme with a resource allocation graph at runtime.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event log */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Event Log</h3>
        <EventTimeline events={events} currentStep={step} />
      </div>

      <div className="card p-3 border-accent/20 bg-accent/5">
        <p className="text-xs text-muted-light text-center">
          Note: Cycle detection definitively indicates deadlock for single-instance resources.
          Multi-instance resource systems require more careful analysis (e.g., Banker's Algorithm).
        </p>
      </div>
    </div>
  );
}


