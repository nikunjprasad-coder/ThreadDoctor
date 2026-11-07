import { Activity, Scissors } from 'lucide-react';

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-lg bg-accent/15 border border-accent/30"
        style={{ width: size, height: size }}
      >
        <Activity className="text-accent" style={{ width: size * 0.5, height: size * 0.5 }} />
        <Scissors
          className="absolute text-accent/70"
          style={{ width: size * 0.3, height: size * 0.3, bottom: 2, right: 2 }}
        />
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-slate-100 text-[15px] tracking-tight">ThreadDoctor</div>
        <div className="text-[10px] text-muted font-mono uppercase tracking-wider">Concurrency Lab</div>
      </div>
    </div>
  );
}
