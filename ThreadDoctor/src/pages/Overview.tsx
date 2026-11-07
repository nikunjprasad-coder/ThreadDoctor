import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/MetricCard';
import { useHistory } from '@/hooks/useHistory';
import { EXAMPLES } from '@/data/examples';
import {
  FlaskConical,
  Siren,
  AlertTriangle,
  CheckCircle2,
  Play,
  BookOpen,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const POPULAR = [
  { exampleId: 'race-condition', reason: 'Most common concurrency bug' },
  { exampleId: 'deadlock', reason: 'Classic circular wait pattern' },
  { exampleId: 'dining-philosophers', reason: 'Symmetric resource contention' },
  { exampleId: 'producer-consumer', reason: 'Coordination with condition variables' },
];

const QUICK_START = [
  { title: 'Run a simulation', desc: 'Pick an example and hit Run to see threads interact.', route: '/playground', icon: Play },
  { title: 'Watch the graph', desc: 'See ownership and waiting edges animate live.', route: '/visualizer', icon: Zap },
  { title: 'Detect deadlock', desc: 'Run cycle detection on a resource allocation graph.', route: '/deadlock', icon: Siren },
  { title: 'Learn the basics', desc: 'Explore interactive lessons on concurrency concepts.', route: '/learning', icon: BookOpen },
];

export function Overview() {
  const navigate = useNavigate();
  const { history } = useHistory();

  const totalRuns = history.length;
  const deadlocks = history.filter((h) => h.issues.some((i) => i.toLowerCase().includes('deadlock') || i.toLowerCase().includes('circular'))).length;
  const races = history.filter((h) => h.issues.some((i) => i.toLowerCase().includes('race'))).length;
  const fixes = history.filter((h) => h.fixTested && h.result === 'success').length;

  // Build activity chart from last 7 runs (or sample data)
  const chartData =
    history.length > 0
      ? history.slice(0, 7).reverse().map((h, i) => ({
          name: `R${i + 1}`,
          runs: 1,
          issues: h.issues.length,
        }))
      : [
          { name: 'S1', runs: 1, issues: 1 },
          { name: 'S2', runs: 1, issues: 0 },
          { name: 'S3', runs: 1, issues: 1 },
          { name: 'S4', runs: 1, issues: 0 },
        ];

  const recent = history.slice(0, 5);
  const isSample = history.length === 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
            Understand concurrency.
            <br />
            <span className="text-accent">Debug with confidence.</span>
          </h1>
          <p className="text-muted-light mt-4 max-w-2xl leading-relaxed">
            ThreadDoctor helps you explore race conditions, deadlocks, and synchronization through
            interactive, deterministic simulations — right in your browser. No compiler, no setup.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => navigate('/playground')} className="btn-primary">
              <Play className="w-4 h-4" />
              Start Debugging
            </button>
            <button onClick={() => navigate('/learning')} className="btn-secondary">
              <BookOpen className="w-4 h-4" />
              Explore Examples
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Simulations"
          value={totalRuns}
          icon={<FlaskConical className="w-5 h-5" />}
          subtitle={isSample ? 'Sample data shown' : undefined}
        />
        <MetricCard
          label="Deadlocks Detected"
          value={isSample ? 2 : deadlocks}
          icon={<Siren className="w-5 h-5" />}
          accent="danger"
        />
        <MetricCard
          label="Race Conditions"
          value={isSample ? 1 : races}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="warning"
        />
        <MetricCard
          label="Successful Fixes"
          value={isSample ? 1 : fixes}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="success"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent experiments */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Recent Experiments</h3>
          {recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-lg bg-bg-raised border border-border-subtle px-4 py-3 hover:border-border-strong transition-colors cursor-pointer"
                  onClick={() => navigate('/history')}
                >
                  <div className={`p-1.5 rounded-lg ${h.result === 'issue' ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                    {h.result === 'issue' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{h.exampleName}</div>
                    <div className="text-xs text-muted">{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                  {h.fixTested && (
                    <span className="label-badge bg-success/10 text-success border border-success/30 text-[10px]">Fixed</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FlaskConical className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No experiments yet. Run a simulation to see history here.</p>
              <button onClick={() => navigate('/playground')} className="btn-secondary mt-3">
                Go to Playground
              </button>
            </div>
          )}
        </div>

        {/* Activity chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F87171" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#F87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252B38" />
              <XAxis dataKey="name" stroke="#7B8499" fontSize={11} />
              <YAxis stroke="#7B8499" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#121620', border: '1px solid #252B38', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="runs" stroke="#8B5CF6" fill="url(#colorRuns)" strokeWidth={2} />
              <Area type="monotone" dataKey="issues" stroke="#F87171" fill="url(#colorIssues)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-muted mt-2 text-center">
            {isSample ? 'Sample data — run simulations to populate' : 'Last 7 runs'}
          </p>
        </div>
      </div>

      {/* Popular examples */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Popular Concurrency Examples</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {POPULAR.map(({ exampleId, reason }) => {
            const ex = EXAMPLES.find((e) => e.id === exampleId)!;
            return (
              <button
                key={exampleId}
                onClick={() => navigate('/playground')}
                className="flex items-center gap-3 rounded-lg bg-bg-raised border border-border-subtle p-4 text-left hover:border-accent/40 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200">{ex.name}</div>
                  <div className="text-xs text-muted mt-0.5">{reason}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick start */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Quick Start</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_START.map(({ title, desc, route, icon: Icon }) => (
            <button
              key={title}
              onClick={() => navigate(route)}
              className="rounded-lg bg-bg-raised border border-border-subtle p-4 text-left hover:border-accent/40 transition-colors group"
            >
              <Icon className="w-5 h-5 text-accent mb-2" />
              <div className="text-sm font-medium text-slate-200">{title}</div>
              <div className="text-xs text-muted mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Callout */}
      <div className="card p-4 border-accent/20 bg-accent/5 flex items-start gap-3">
        <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-muted-light">
          This version of ThreadDoctor uses <strong className="text-slate-200">controlled, deterministic simulations</strong> —
          the same scenario always produces the same result. This is ideal for learning and demonstration.
          A future version will connect to a real C++ concurrency engine.
        </p>
      </div>
    </div>
  );
}
