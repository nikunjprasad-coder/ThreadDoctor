# ThreadDoctor

An interactive concurrency debugging platform that helps students and developers understand, visualize, and diagnose concurrency problems in multithreaded programs — right in the browser, no compiler or backend required.

## Features

- **Overview Dashboard** — Summary metrics, recent experiments, popular examples, and an activity chart
- **Playground** — Split-panel workspace with a syntax-highlighted C++ code editor, deterministic simulation engine, event logs, diagnostics, and suggested fixes
- **Live Thread Visualizer** — Interactive React Flow graph showing thread/resource nodes, ownership and waiting edges, animated state changes, and playback controls (play, pause, step, restart, speed)
- **Deadlock Detector** — Resource allocation graph analysis with cycle detection, Coffman condition explanations, and prevention strategies
- **Learning Lab** — Eight interactive lessons (race conditions, deadlocks, mutexes, semaphores, starvation, producer-consumer, dining philosophers, critical sections) with real-world analogies, code examples, step-by-step demos, and knowledge-check quizzes
- **Run History** — Searchable, filterable, sortable list of past simulations persisted in local storage
- **Settings** — Dark/light theme toggle, animation toggle, default simulation speed, clear history, about panel

## Predefined Examples

| Example | Description |
|---------|-------------|
| Race Condition | Two threads increment a shared counter without a mutex |
| Fixed Race Condition | Same example protected by a mutex |
| Deadlock | Two threads acquire two mutexes in opposite orders |
| Fixed Deadlock | Both threads acquire locks in a consistent global order |
| Producer-Consumer | Bounded buffer with mutex and condition variables |
| Dining Philosophers | Five philosophers competing for five forks |

## Technology Stack

- **React** with **TypeScript**
- **Vite** for development and builds
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Flow** for interactive thread/resource graphs
- **Recharts** for charts
- **React Router** for navigation
- **Local storage** for preferences and run history

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Run type checking
npm run typecheck
```

The app runs entirely in the browser. No API keys, databases, or backend services are required.

## How Simulations Work

ThreadDoctor uses a **deterministic simulation engine** — each predefined scenario has a fixed event sequence that reproduces the same result every time. This is ideal for learning and demonstration, since real multithreaded timing is non-deterministic and hard to reproduce.

The engine:

1. Generates a sequence of `SimulationEvent`s (acquire, release, wait, deadlock, etc.)
2. Replays them step-by-step through the `eventEngine`, which updates thread states, resource ownership, and the resource allocation graph
3. Runs cycle detection on the wait-for graph to identify deadlocks
4. Produces diagnostics with explanations and suggested fixes

All results are clearly labeled as **simulated**, not from real C++ execution.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Sidebar/
│   ├── CodeEditor.tsx
│   ├── ResourceGraph.tsx
│   ├── ThreadNode.tsx
│   ├── ResourceNode.tsx
│   ├── EventTimeline.tsx
│   ├── DiagnosticPanel.tsx
│   ├── SimulationControls.tsx
│   ├── ComparisonPanel.tsx
│   └── MetricCard.tsx
├── pages/               # Route-level pages
│   ├── Overview.tsx
│   ├── Playground.tsx
│   ├── Visualizer.tsx
│   ├── DeadlockDetector.tsx
│   ├── LearningLab.tsx
│   ├── RunHistory.tsx
│   └── Settings.tsx
├── simulation/          # Deterministic simulation engine
│   ├── scenarios.ts
│   └── eventEngine.ts
├── hooks/               # React hooks
├── data/                # Example definitions
├── types/               # TypeScript interfaces
└── App.tsx              # Routing and layout
```

## Future Roadmap

- Python FastAPI backend for real C++ compilation and execution
- Custom code input and arbitrary simulation
- Multi-instance resource analysis (Banker's Algorithm)
- ThreadSanitizer-style report formatting

## License

Built for educational use.
