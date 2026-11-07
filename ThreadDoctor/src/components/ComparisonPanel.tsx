import { CodeEditor } from './CodeEditor';
import { ArrowRight, Check, X, Wrench } from 'lucide-react';

interface ComparisonPanelProps {
  faultyCode: string;
  fixedCode: string;
  faultyLabel?: string;
  fixedLabel?: string;
  faultyResult?: string;
  fixedResult?: string;
}

export function ComparisonPanel({
  faultyCode,
  fixedCode,
  faultyLabel = 'Before — Buggy',
  fixedLabel = 'After — Fixed',
  faultyResult,
  fixedResult,
}: ComparisonPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-danger">
            <X className="w-4 h-4" />
            {faultyLabel}
          </div>
          <CodeEditor code={faultyCode} />
          {faultyResult && (
            <div className="card p-3 border-danger/30 bg-danger/5">
              <span className="text-[10px] font-semibold text-danger uppercase tracking-wider">Result</span>
              <pre className="mt-1 text-xs font-mono text-slate-200 whitespace-pre-wrap">{faultyResult}</pre>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-success">
            <Check className="w-4 h-4" />
            {fixedLabel}
          </div>
          <CodeEditor code={fixedCode} />
          {fixedResult && (
            <div className="card p-3 border-success/30 bg-success/5">
              <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Result</span>
              <pre className="mt-1 text-xs font-mono text-slate-200 whitespace-pre-wrap">{fixedResult}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4 border-accent/20 bg-accent/5">
        <div className="flex items-start gap-3">
          <Wrench className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-100">What changed</h4>
            <p className="text-xs text-muted-light mt-1">
              The fix removes the concurrency defect by serializing access or enforcing a consistent acquisition order.
              The right panel shows how the corrected version eliminates the race or deadlock while preserving the same
              overall behavior.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted ml-auto shrink-0 mt-0.5 hidden md:block" />
        </div>
      </div>
    </div>
  );
}
