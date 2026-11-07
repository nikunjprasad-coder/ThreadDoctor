import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeEditor } from '@/components/CodeEditor';
import { EventTimeline } from '@/components/EventTimeline';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';
import { ResourceGraph } from '@/components/ResourceGraph';
import { SimulationControls } from '@/components/SimulationControls';
import { EXAMPLES, getExample } from '@/data/examples';
import { scenarioForExample } from '@/simulation/scenarios';
import { useSimulation } from '@/hooks/useSimulation';
import { useSettings } from '@/hooks/useSettings';
import { useHistory } from '@/hooks/useHistory';
import type { SimulationHistoryEntry } from '@/types';
import {
  Play,
  Wrench,
  ChevronDown,
  Cpu,
  Layers,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Terminal,
  FileWarning,
  Activity,
  Workflow,
} from 'lucide-react';

const STATUS_BADGE = {
  ready: { text: 'Ready', cls: 'text-muted bg-bg-raised border-border-subtle' },
  running: { text: 'Running', cls: 'text-accent bg-accent/10 border-accent/30' },
  completed: { text: 'Completed', cls: 'text-success bg-success/10 border-success/30' },
  issue: { text: 'Issue Detected', cls: 'text-danger bg-danger/10 border-danger/30' },
};

export function Playground() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { addEntry } = useHistory();

  const [exampleId, setExampleId] = useState('race-condition');
  const [useFix, setUseFix] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  const example = getExample(exampleId)!;
  const scenario = useMemo(
    () => scenarioForExample(exampleId, useFix),
    [exampleId, useFix],
  );

  const sim = useSimulation(scenario);
  const { snapshot, playStatus, currentStep, totalSteps, speed, setSpeed } = sim;

  // Set default speed from settings on scenario change
  useEffect(() => {
    setSpeed(settings.defaultSpeed);
  }, [settings.defaultSpeed, setSpeed]);

  function handleRun() {
    sim.play();
  }

  function handleApplyFix() {
    setUseFix(true);
  }

  function handleReset() {
    setUseFix(false);
    sim.restart();
  }

  // Save to history when sim finishes (only once per run)
  const savedRef = useRef(false);
  useEffect(() => {
    if (playStatus === 'completed' || playStatus === 'issue') {
      if (savedRef.current) return;
      savedRef.current = true;
      const entry: SimulationHistoryEntry = {
        id: `run-${Date.now()}`,
        exampleId,
        exampleName: useFix ? `${example.name} (Fixed)` : example.name,
        simulationType: example.category,
        result: playStatus === 'issue' ? 'issue' : 'success',
        issues: sim.diagnostics.filter((d) => d.severity === 'error').map((d) => d.title),
        fixTested: useFix,
        createdAt: Date.now(),
        durationMs: scenario.expectedDurationMs,
      };
      addEntry(entry);
    } else {
      savedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playStatus]);

  const displayedCode = useFix && example.fixedCode ? example.fixedCode : example.code;
  const statusBadge = STATUS_BADGE[snapshot.status];
  const issuesDetected = sim.diagnostics.filter((d) => d.severity === 'error');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Playground</h1>
          <p className="text-sm text-muted mt-1">
            Run deterministic browser-based simulations of classic concurrency scenarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGraph((s) => !s)}
            className="btn-secondary"
            title="Toggle graph view"
          >
            <Workflow className="w-4 h-4" />
            {showGraph ? 'Hide Graph' : 'Show Graph'}
          </button>
        </div>
      </div>

      {/* Example selector */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">Example</label>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="input pr-9 flex items-center gap-2 min-w-[260px] cursor-pointer"
            >
              <span className="text-slate-100 font-medium">{example.name}</span>
              <span className="text-xs text-muted">· {example.category}</span>
              <ChevronDown className="w-4 h-4 text-muted ml-auto" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute z-20 mt-1 w-full card-raised border border-border-subtle rounded-lg overflow-hidden shadow-xl">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setExampleId(ex.id);
                        setUseFix(false);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-bg-hover ${
                        ex.id === exampleId ? 'bg-accent/10 text-accent' : 'text-slate-200'
                      }`}
                    >
                      <div className="font-medium">{ex.name}</div>
                      <div className="text-xs text-muted mt-0.5">{ex.description}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {example.hasFix && !useFix && (
              <button onClick={handleApplyFix} className="btn-secondary">
                <Wrench className="w-4 h-4" />
                Apply Fix
              </button>
            )}
            {useFix && (
              <span className="label-badge bg-success/10 text-success border border-success/30">
                <CheckCircle2 className="w-3 h-3" />
                Fix Applied
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">{example.description}</p>
      </div>

      {/* Simulation controls */}
      <SimulationControls
        status={playStatus}
        currentStep={currentStep}
        totalSteps={totalSteps}
        speed={speed}
        onPlay={handleRun}
        onPause={sim.pause}
        onStep={sim.step}
        onRestart={handleReset}
        onSpeedChange={setSpeed}
      />

      {/* Split panel */}
      <div className={`grid gap-5 ${showGraph ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Left: Code editor */}
        <div className={showGraph ? 'lg:col-span-1' : ''}>
          <div className="h-[480px]">
            <CodeEditor code={displayedCode} onReset={handleReset} editable />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRun}
              disabled={playStatus === 'running'}
              className="btn-primary flex-1"
            >
              <Play className="w-4 h-4" />
              Run Simulation
            </button>
            {example.hasFix && (
              <button
                onClick={() => {
                  setUseFix((f) => !f);
                  sim.restart();
                }}
                className={useFix ? 'btn-secondary' : 'btn-secondary'}
              >
                <Wrench className="w-4 h-4" />
                {useFix ? 'Show Original' : 'Apply Fix'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Execution summary */}
        <div className={showGraph ? 'lg:col-span-1' : ''}>
          <div className="space-y-4">
            {/* Status + metrics */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100">Execution Summary</h3>
                <span className={`label-badge border ${statusBadge.cls}`}>
                  <Activity className="w-3 h-3" />
                  {statusBadge.text}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricMini icon={Cpu} label="Threads" value={example.threadCount} />
                <MetricMini icon={Layers} label="Resources" value={example.resourceCount} />
                <MetricMini
                  icon={AlertTriangle}
                  label="Issues"
                  value={issuesDetected.length}
                  accent={issuesDetected.length > 0 ? 'danger' : 'success'}
                />
                <MetricMini
                  icon={Clock}
                  label="Duration"
                  value={`${scenario.expectedDurationMs}ms`}
                  suffix="sim"
                />
              </div>
            </div>

            {/* Standard output */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-bg-panel">
                <Terminal className="w-4 h-4 text-muted" />
                <span className="text-xs font-mono text-muted uppercase tracking-wider">Output</span>
              </div>
              <div className="p-4 font-mono text-[13px] min-h-[80px] max-h-[180px] overflow-y-auto">
                {snapshot.logs.length > 0 ? (
                  snapshot.logs.map((l, i) => (
                    <div key={i} className={l.stream === 'stderr' ? 'text-danger' : 'text-success'}>
                      <span className="text-muted mr-2">{l.stream === 'stderr' ? '!' : '>'}</span>
                      {l.text}
                    </div>
                  ))
                ) : (
                  <span className="text-muted text-xs">Run the simulation to see output.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Graph (when toggled) */}
        {showGraph && (
          <div className="lg:col-span-1">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-3">Thread-Resource Graph</h3>
              <ResourceGraph
                threads={snapshot.threads}
                resources={snapshot.resources}
                edges={snapshot.edges}
                deadlockCycle={snapshot.deadlockCycle}
                height={400}
              />
              <button
                onClick={() => navigate('/visualizer')}
                className="btn-ghost mt-3 w-full text-xs"
              >
                Open full visualizer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event logs + diagnostics */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="w-4 h-4 text-muted" />
            <h3 className="text-sm font-semibold text-slate-100">Event Log</h3>
            <span className="ml-auto text-xs text-muted font-mono">{sim.events.length} events</span>
          </div>
          <EventTimeline events={sim.events} currentStep={currentStep} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Diagnosis</h3>
          <DiagnosticPanel diagnostics={sim.diagnostics} />
        </div>
      </div>

      <div className="card p-3 border-accent/20 bg-accent/5">
        <p className="text-xs text-muted-light text-center">
          Simulations run deterministically in your browser using predefined event sequences.
          Results are illustrative, not from real C++ execution.
        </p>
      </div>
    </div>
  );
}

function MetricMini({
  icon: Icon,
  label,
  value,
  accent = 'default',
  suffix,
}: {
  icon: typeof Cpu;
  label: string;
  value: string | number;
  accent?: 'default' | 'success' | 'danger';
  suffix?: string;
}) {
  const color =
    accent === 'danger' ? 'text-danger' : accent === 'success' ? 'text-success' : 'text-slate-100';
  return (
    <div className="rounded-lg bg-bg-raised border border-border-subtle p-3">
      <div className="flex items-center gap-1.5 text-muted">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-lg font-semibold mt-1 ${color}`}>
        {value}
        {suffix && <span className="text-[10px] text-muted ml-1 font-normal">{suffix}</span>}
      </div>
    </div>
  );
}
