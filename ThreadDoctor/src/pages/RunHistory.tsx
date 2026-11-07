import { useState, useMemo } from 'react';
import { useHistory } from '@/hooks/useHistory';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  X,
  Filter,
} from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'issue', label: 'Issues Only' },
  { id: 'fixed', label: 'Fixes Tested' },
  { id: 'deadlock', label: 'Deadlocks' },
  { id: 'race', label: 'Race Conditions' },
];

export function RunHistory() {
  const { history, removeEntry, clearHistory } = useHistory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return history
      .filter((h) => {
        if (query && !h.exampleName.toLowerCase().includes(query.toLowerCase())) return false;
        if (filter === 'issue') return h.result === 'issue';
        if (filter === 'fixed') return h.fixTested;
        if (filter === 'deadlock') return h.issues.some((i) => i.toLowerCase().includes('deadlock') || i.toLowerCase().includes('circular'));
        if (filter === 'race') return h.issues.some((i) => i.toLowerCase().includes('race'));
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [history, query, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Run History</h1>
          <p className="text-sm text-muted mt-1">
            A record of your simulation runs. Persisted in your browser's local storage.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="btn-danger"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by example name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-muted" />
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.id
                  ? 'bg-accent text-white'
                  : 'bg-bg-raised text-muted-light hover:bg-bg-hover border border-border-subtle'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted uppercase tracking-wider border-b border-border-subtle bg-bg-panel">
                  <th className="py-3 px-4">Example</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Issues</th>
                  <th className="py-3 px-4">Fix</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.id} className="border-b border-border-subtle/50 hover:bg-bg-hover/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200">{h.exampleName}</td>
                    <td className="py-3 px-4 text-muted-light text-xs">{h.simulationType}</td>
                    <td className="py-3 px-4">
                      {h.result === 'issue' ? (
                        <span className="label-badge bg-danger/10 text-danger border border-danger/30">
                          <AlertTriangle className="w-3 h-3" />
                          Issue
                        </span>
                      ) : (
                        <span className="label-badge bg-success/10 text-success border border-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-light max-w-[200px] truncate">
                      {h.issues.length > 0 ? h.issues.join('; ') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {h.fixTested ? (
                        <span className="label-badge bg-success/10 text-success border border-success/30 text-[10px]">
                          <Wrench className="w-3 h-3" />
                          Tested
                        </span>
                      ) : (
                        <span className="text-muted text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted font-mono whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => removeEntry(h.id)}
                        className="btn-ghost p-1.5 text-muted hover:text-danger"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <HistoryIcon className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted-light">
            {history.length === 0
              ? 'No simulation history yet. Run a simulation in the Playground to see it here.'
              : 'No entries match your search or filter.'}
          </p>
        </div>
      )}

      {/* Clear confirmation modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmClear(false)}>
          <div className="card p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-danger/10 text-danger">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Clear all history?</h3>
            </div>
            <p className="text-sm text-muted-light mb-5">
              This will permanently remove all {history.length} simulation records from your browser. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmClear(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setConfirmClear(false);
                }}
                className="btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
