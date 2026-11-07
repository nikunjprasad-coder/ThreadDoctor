import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

interface SimulationControlsProps {
  status: 'ready' | 'running' | 'paused' | 'completed' | 'issue';
  currentStep: number;
  totalSteps: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
}

export function SimulationControls({
  status,
  currentStep,
  totalSteps,
  speed,
  onPlay,
  onPause,
  onStep,
  onRestart,
  onSpeedChange,
}: SimulationControlsProps) {
  const isRunning = status === 'running';
  const isFinished = status === 'completed' || status === 'issue';

  return (
    <div className="card p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        {isRunning ? (
          <button onClick={onPause} className="btn-secondary px-3 py-2" title="Pause">
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={isFinished && currentStep >= totalSteps - 1}
            className="btn-primary px-3 py-2"
            title="Play"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        <button onClick={onStep} disabled={currentStep >= totalSteps - 1} className="btn-secondary px-3 py-2" title="Step forward">
          <SkipForward className="w-4 h-4" />
        </button>
        <button onClick={onRestart} className="btn-secondary px-3 py-2" title="Restart">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs text-muted font-mono">Speed</span>
        <div className="flex items-center gap-1">
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                speed === s
                  ? 'bg-accent text-white'
                  : 'bg-bg-raised text-muted-light hover:bg-bg-hover border border-border-subtle'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="w-32 h-1.5 bg-bg-base rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-200"
            style={{ width: `${totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted tabular-nums">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
    </div>
  );
}
