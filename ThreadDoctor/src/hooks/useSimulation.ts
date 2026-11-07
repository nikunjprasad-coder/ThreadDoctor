import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  SimulationEvent,
  Thread,
  Resource,
  LogLine,
  Diagnostic,
  SimulationSnapshot,
  SimulationStatus,
} from '@/types';
import { applyEventsUpTo, totalSteps } from '@/simulation/eventEngine';
import type { ScenarioDef } from '@/simulation/scenarios';

export type PlayStatus = 'ready' | 'running' | 'paused' | 'completed' | 'issue';

export interface SimulationState {
  events: SimulationEvent[];
  logs: LogLine[];
  diagnostics: Diagnostic[];
  baseThreads: Thread[];
  baseResources: Resource[];
  currentStep: number;
  totalSteps: number;
  speed: number;
  playStatus: PlayStatus;
  snapshot: SimulationSnapshot;
}

export function useSimulation(scenario: ScenarioDef | null) {
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [baseThreads, setBaseThreads] = useState<Thread[]>([]);
  const [baseResources, setBaseResources] = useState<Resource[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(2);
  const [playStatus, setPlayStatus] = useState<PlayStatus>('ready');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load scenario
  useEffect(() => {
    if (!scenario) return;
    const ev = scenario.buildEvents();
    setEvents(ev);
    setLogs(scenario.buildLogs(ev));
    setDiagnostics(scenario.buildDiagnostics(ev));
    setBaseThreads(scenario.initialThreads());
    setBaseResources(scenario.initialResources());
    setCurrentStep(0);
    setPlayStatus('ready');
  }, [scenario]);

  const tSteps = totalSteps(events);

  // Clear timer on cleanup or speed change
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Playback effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (playStatus !== 'running') return;

    const interval = 1000 / speed;
    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= tSteps - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPlayStatus((ps) => (ps === 'running' ? (scenario?.hasIssue ? 'issue' : 'completed') : ps));
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playStatus, speed, tSteps, scenario]);

  const snapshot = applyEventsUpTo(events, currentStep, baseThreads, baseResources, logs);
  const status: SimulationStatus =
    playStatus === 'completed' ? 'completed' :
    playStatus === 'issue' ? 'issue' :
    playStatus === 'running' ? 'running' : 'ready';

  const play = useCallback(() => {
    if (currentStep >= tSteps - 1) setCurrentStep(0);
    setPlayStatus('running');
  }, [currentStep, tSteps]);

  const pause = useCallback(() => setPlayStatus('paused'), []);
  const step = useCallback(() => {
    setPlayStatus('paused');
    setCurrentStep((p) => Math.min(p + 1, tSteps - 1));
  }, [tSteps]);
  const restart = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentStep(0);
    setPlayStatus('ready');
  }, []);

  return {
    events,
    logs,
    diagnostics,
    baseThreads,
    baseResources,
    currentStep,
    totalSteps: tSteps,
    speed,
    setSpeed,
    playStatus,
    play,
    pause,
    step,
    restart,
    snapshot,
    status,
  };
}
