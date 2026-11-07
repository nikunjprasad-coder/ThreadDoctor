import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const ACCENT_STYLES = {
  default: 'text-accent bg-accent/10 border-accent/20',
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  danger: 'text-danger bg-danger/10 border-danger/20',
};

export function MetricCard({ label, value, icon, accent = 'default', subtitle }: MetricCardProps) {
  return (
    <div className="card p-5 transition-all duration-200 hover:border-border-strong">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold text-slate-100 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg border ${ACCENT_STYLES[accent]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}
