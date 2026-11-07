import { useState, useMemo, useEffect } from 'react';
import { ResourceGraph } from '@/components/ResourceGraph';
import { SimulationControls } from '@/components/SimulationControls';
import { EventTimeline } from '@/components/EventTimeline';
import { EXAMPLES, getExample } from '@/data/examples';
import { scenarioForExample } from '@/simulation/scenarios';
import { useSimulation } from '@/hooks/useSimulation';
import { useSettings } from '@/hooks/useSettings';
import { ChevronDown, Workflow, Info } from 'lucide-react';

const VISUALIZABLE = EXAMPLES.filter((e) =>
  ['deadlock', 'dining-philosophers', 'producer-consumer', 'race-condition'].includes(e.id),
);

export function Visualizer() {
  const { settings } = useSettings();
  const [exampleId, setExampleId] = useState('deadlock');
  const [useFix, setUseFix] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const example = getExample(exampleId)!;
  const scenario = useMemo(() => scenarioForExample(exampleId, useFix), [exampleId, useFix]);
  const sim = useSimulation(scenario);
  const { snapshot, currentStep, totalSteps, speed, setSpeed, playStatus } = sim;

  useEffect(() => {
    setSpeed(settings.defaultSpeed);
  }, [settings.defaultSpeed, setSpeed]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Live Thread Visualizer</h1>
        <p className="text-sm text-muted mt-1">
          Watch threads acquire, release, and wait for resources in real time. The graph animates as the simulation steps forward.
        </p>
      </div>

      {/* Controls bar */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-muted uppercase tracking-wider">Scenario</label>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="input pr-9 flex items-center gap-2 min-w-[240px] cursor-pointer"
          >
            <Workflow className="w-4 h-4 text-accent" />
            <span className="text-slate-100">{useFix ? `${example.name} (Fixed)` : example.name}</span>
            <ChevronDown className="w-4 h-4 text-muted ml-auto" />
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute z-20 mt-1 w-full card-raised border border-border-subtle rounded-lg overflow-hidden shadow-xl">
                {VISUALIZABLE.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setExampleId(ex.id);
                      setUseFix(false);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-bg-hover ${
                      ex.id === exampleId && !useFix ? 'bg-accent/10 text-accent' : 'text-slate-200'
                    }`}
                  >
                    {ex.name}
                  </button>
                ))}
                {example.hasFix && (
                  <button
                    onClick={() => {
                      setUseFix(true);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-bg-hover border-t border-border-subtle ${
                      useFix ? 'bg-success/10 text-success' : 'text-slate-200'
                    }`}
                  >
                    {example.name} (Fixed)
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <SimulationControls
        status={playStatus}
        currentStep={currentStep}
        totalSteps={totalSteps}
        speed={speed}
        onPlay={sim.play}
        onPause={sim.pause}
        onStep={sim.step}
        onRestart={sim.restart}
        onSpeedChange={setSpeed}
      />

      {/* Graph */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-100">Resource Allocation Graph</h3>
          {snapshot.deadlockCycle && (
            <span className="label-badge bg-danger/10 text-danger border border-danger/30">
              Deadlock cycle detected
            </span>
          )}
        </div>
        <ResourceGraph
          threads={snapshot.threads}
          resources={snapshot.resources}
          edges={snapshot.edges}
          deadlockCycle={snapshot.deadlockCycle}
          height={460}
        />
      </div>

      {/* Legend + Event timeline */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Legend</h3>
          <div className="space-y-2.5 text-xs">
            <LegendItem color="#8B5CF6" label="Thread node" />
            <LegendItem color="#34D399" label="Running / completed" />
            <LegendItem color="#FBBF24" label="Waiting" />
            <LegendItem color="#F87171" label="Blocked / deadlock" />
            <div className="border-t border-border-subtle my-2" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-accent" />
              <span className="text-muted-light">Ownership edge (thread → resource)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke="#FBBF24" strokeWidth="2" strokeDasharray="4 3" /></svg>
              <span className="text-muted-light">Waiting edge (thread → resource)</span>
            </div>
            <div className="border-t border-border-subtle my-2" />
            <div className="flex items-start gap-2 text-muted-light">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Cycle detection: a cycle in the wait-for graph indicates deadlock for single-instance resources.</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-100">Event Timeline</h3>
            <span className="ml-auto text-xs text-muted font-mono">
              Step {currentStep + 1} / {totalSteps}
            </span>
          </div>
          <EventTimeline events={sim.events} currentStep={currentStep} />
        </div>
      </div>

      {/* Thread state table */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Thread States</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted uppercase tracking-wider border-b border-border-subtle">
                <th className="py-2 pr-4">Thread</th>
                <th className="py-2 pr-4">State</th>
                <th className="py-2 pr-4">Holds</th>
                <th className="py-2">Waiting For</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {snapshot.threads.map((t) => (
                <tr key={t.id} className="border-b border-border-subtle/50">
                  <td className="py-2 pr-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </td>
                  <td className="py-2 pr-4">
                    <StateBadge state={t.state} />
                  </td>
                  <td className="py-2 pr-4 text-muted-light">{t.ownedResources.join(', ') || '—'}</td>
                  <td className="py-2 text-warning">{t.waitingFor || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-muted-light">{label}</span>
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    idle: 'text-muted bg-bg-raised',
    running: 'text-success bg-success/10',
    waiting: 'text-warning bg-warning/10',
    blocked: 'text-danger bg-danger/10',
    completed: 'text-success/80 bg-success/5',
  };
  return <span className={`label-badge ${map[state] || ''} capitalize`}>{state}</span>;
}

