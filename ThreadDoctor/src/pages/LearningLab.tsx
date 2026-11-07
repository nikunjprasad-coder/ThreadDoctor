import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  ArrowRight,
  Lightbulb,
  Code2,
  Play,
  HelpCircle,
  RotateCcw,
  Pencil,
  Eye,
} from 'lucide-react';
import { CodeEditor } from '@/components/CodeEditor';

interface Quiz {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  icon: typeof GraduationCap;
  category: string;
  explanation: string;
  analogy: string;
  code: string;
  demo: { description: string; steps: string[] };
  quiz: Quiz;
}

const LESSONS: Lesson[] = [
  {
    id: 'race-conditions',
    title: 'Race Conditions',
    icon: GraduationCap,
    category: 'Bug',
    explanation:
      'A race condition occurs when two or more threads access shared data concurrently and at least one modifies it. Because the operating system can interleave thread execution at any point, the final value depends on the unpredictable timing of reads and writes — leading to lost updates or corrupted state.',
    analogy:
      'Imagine two people editing the same Google Doc offline. Person A reads the document, adds a paragraph, and saves. Person B also read the original, added a different paragraph, and saves — overwriting A\'s change. The last save wins; A\'s paragraph is gone.',
    code: `int balance = 100;

void withdraw(int amount) {
    int current = balance;      // read
    balance = current - amount; // write
    // If two threads interleave here,
    // one withdrawal is lost.
}`,
    demo: {
      description: 'Two threads withdraw $50 each. Expected balance: $0. Race outcome: $50 (one withdrawal lost).',
      steps: [
        'T1 reads balance = 100',
        'T2 reads balance = 100 (stale)',
        'T1 computes 100 - 50 = 50, writes balance = 50',
        'T2 computes 100 - 50 = 50, writes balance = 50',
        'Final balance = 50 instead of 0 — $50 was lost',
      ],
    },
    quiz: {
      question: 'What is the root cause of a race condition?',
      options: [
        'Using too many threads',
        'Unsynchronized concurrent access to shared mutable data',
        'Not using semaphores',
        'Threads running at different speeds',
      ],
      correct: 1,
      explanation: 'A race condition arises when threads access shared mutable data without proper synchronization, making the outcome depend on timing.',
    },
  },
  {
    id: 'deadlocks',
    title: 'Deadlocks',
    icon: GraduationCap,
    category: 'Bug',
    explanation:
      'A deadlock is a state where two or more threads are permanently blocked, each waiting for a resource held by another. All four Coffman conditions must hold: mutual exclusion, hold-and-wait, no preemption, and circular wait.',
    analogy:
      'Two people need both a pen and paper to write. Person A grabs the pen, Person B grabs the paper. Each waits for the other to give up their item. Neither will budge — they\'re stuck forever.',
    code: `std::mutex pen, paper;

void personA() {
    pen.lock();
    paper.lock(); // waits forever
    // ...
}
void personB() {
    paper.lock();
    pen.lock();   // waits forever
}`,
    demo: {
      description: 'T1 holds Lock A and waits for Lock B. T2 holds Lock B and waits for Lock A. Both block forever.',
      steps: [
        'T1 acquires Lock A',
        'T2 acquires Lock B',
        'T1 requests Lock B → blocks (T2 holds it)',
        'T2 requests Lock A → blocks (T1 holds it)',
        'Circular wait: T1 → B → T2 → A → T1',
      ],
    },
    quiz: {
      question: 'Which condition is NOT one of the four Coffman conditions for deadlock?',
      options: ['Mutual exclusion', 'Hold and wait', 'Priority inversion', 'Circular wait'],
      correct: 2,
      explanation: 'Priority inversion is a different scheduling problem. The Coffman conditions are mutual exclusion, hold-and-wait, no preemption, and circular wait.',
    },
  },
  {
    id: 'mutexes',
    title: 'Mutexes',
    icon: GraduationCap,
    category: 'Primitive',
    explanation:
      'A mutex (mutual exclusion lock) ensures only one thread enters a critical section at a time. When a thread locks the mutex, others that try to lock it block until it is released. This serializes access to shared data.',
    analogy:
      'A mutex is like a key to a single-occupancy bathroom. Only one person can enter at a time. Others wait in line. When the person exits and returns the key, the next person goes in.',
    code: `std::mutex mtx;
int counter = 0;

void safeIncrement() {
    std::lock_guard<std::mutex> lock(mtx);
    counter++;  // critical section
}`,
    demo: {
      description: 'With a mutex, increments are serialized — no lost updates.',
      steps: [
        'T1 locks mutex, enters critical section',
        'T2 tries to lock → blocks',
        'T1 increments counter, unlocks mutex',
        'T2 acquires lock, enters critical section',
        'T2 increments, unlocks — counter is correct',
      ],
    },
    quiz: {
      question: 'What does std::lock_guard provide?',
      options: [
        'A way to lock multiple mutexes simultaneously',
        'RAII-based automatic lock release when scope exits',
        'A non-blocking try-lock mechanism',
        'A recursive lock that allows re-entry',
      ],
      correct: 1,
      explanation: 'lock_guard uses RAII to automatically release the mutex when its scope ends, preventing forgotten unlocks.',
    },
  },
  {
    id: 'semaphores',
    title: 'Semaphores',
    icon: GraduationCap,
    category: 'Primitive',
    explanation:
      'A semaphore is a counting synchronization primitive. It maintains a count of available permits. Threads call wait() (decrement) to acquire a permit and signal() (increment) to release one. A binary semaphore (count 0 or 1) behaves like a mutex.',
    analogy:
      'A semaphore is like the host at a restaurant with 5 tables. Each arriving party takes a table (wait). When they leave, a table frees up (signal). If all tables are full, new parties wait.',
    code: `std::counting_semaphore<3> sem(3);

void useResource() {
    sem.acquire();  // decrement
    // use limited resource
    sem.release();  // increment
}`,
    demo: {
      description: 'A semaphore with count=3 allows up to 3 threads to access a resource simultaneously.',
      steps: [
        'Semaphore starts with 3 permits',
        'T1 acquires → count = 2',
        'T2 acquires → count = 1',
        'T3 acquires → count = 0',
        'T4 tries to acquire → blocks until one releases',
      ],
    },
    quiz: {
      question: 'What is the difference between a mutex and a binary semaphore?',
      options: [
        'They are identical in every way',
        'A mutex has ownership — only the locker can unlock it',
        'A binary semaphore is faster',
        'A mutex can count above 1',
      ],
      correct: 1,
      explanation: 'A mutex has ownership semantics: the thread that locked it must unlock it. A binary semaphore can be signaled by any thread.',
    },
  },
  {
    id: 'starvation',
    title: 'Starvation',
    icon: GraduationCap,
    category: 'Bug',
    explanation:
      'Starvation occurs when a thread is perpetually denied access to resources because other threads continually take priority. The thread isn\'t deadlocked — it could run — but it never gets scheduled.',
    analogy:
      'At a busy coffee shop, the barista always serves the loudest customers first. A quiet, patient customer keeps getting skipped and never gets their coffee, even though there\'s nothing physically preventing it.',
    code: `// Priority scheduling where low-priority
// threads may never run
void highPriorityWork() {
    while (true) {
        // keeps grabbing the CPU
    }
}
void lowPriorityWork() {
    // may never execute
}`,
    demo: {
      description: 'A low-priority thread waits while high-priority threads keep acquiring the lock.',
      steps: [
        'High-priority T1 acquires lock',
        'Low-priority T3 waits',
        'T1 releases, high-priority T2 grabs lock first',
        'T2 releases, T1 grabs it again',
        'T3 never gets the lock — starvation',
      ],
    },
    quiz: {
      question: 'How can starvation be prevented?',
      options: [
        'Use more threads',
        'Use fair locking or priority aging',
        'Remove the mutex entirely',
        'Use a binary semaphore',
      ],
      correct: 1,
      explanation: 'Fair locking (e.g., FIFO queues) or priority aging (gradually increasing priority of waiting threads) ensures every thread eventually runs.',
    },
  },
  {
    id: 'producer-consumer',
    title: 'Producer-Consumer',
    icon: GraduationCap,
    category: 'Pattern',
    explanation:
      'The producer-consumer pattern coordinates threads sharing a bounded buffer. Producers add items and block when full; consumers remove items and block when empty. A mutex protects the buffer; condition variables signal state changes.',
    analogy:
      'A chef (producer) cooks burgers and puts them on a small warming tray (buffer). A waiter (consumer) takes burgers to serve. If the tray is full, the chef waits. If it\'s empty, the waiter waits.',
    code: `std::queue<int> buffer;
std::mutex mtx;
std::condition_variable notFull, notEmpty;

void produce(int item) {
    std::unique_lock lock(mtx);
    notFull.wait(lock, []{ return buffer.size() < MAX; });
    buffer.push(item);
    notEmpty.notify_one();
}`,
    demo: {
      description: 'Producer fills a buffer of capacity 5; consumer drains it. Both coordinate without loss.',
      steps: [
        'Producer locks mutex, checks buffer not full',
        'Producer pushes item, signals notEmpty',
        'Consumer wakes, locks mutex, pops item',
        'Consumer signals notFull',
        'Cycle repeats — no items lost or duplicated',
      ],
    },
    quiz: {
      question: 'What role do condition variables play in producer-consumer?',
      options: [
        'They replace the mutex',
        'They let threads wait for a condition and wake when it changes',
        'They limit the number of threads',
        'They measure buffer performance',
      ],
      correct: 1,
      explanation: 'Condition variables let a thread sleep until a predicate becomes true (e.g., buffer not empty), then wake it when another thread signals a change.',
    },
  },
  {
    id: 'dining-philosophers',
    title: 'Dining Philosophers',
    icon: GraduationCap,
    category: 'Problem',
    explanation:
      'Five philosophers sit at a table with five forks. Each needs two forks to eat but only picks up one at a time. If everyone grabs their left fork simultaneously, they all wait for the right fork forever — a classic deadlock.',
    analogy:
      'Five people at a round table each need two chopsticks to eat, but there are only five chopsticks total. If everyone grabs the one on their left and waits for the right, nobody eats.',
    code: `void philosopher(int i) {
    forks[i].lock();            // left
    forks[(i+1)%5].lock();      // right
    // eat...
    forks[(i+1)%5].unlock();
    forks[i].unlock();
}`,
    demo: {
      description: 'All 5 philosophers pick up their left fork. Each waits for the right fork. Deadlock.',
      steps: [
        'P0 picks up Fork 0, P1 picks up Fork 1, ... P4 picks up Fork 4',
        'P0 wants Fork 1 (held by P1) → waits',
        'P1 wants Fork 2 (held by P2) → waits',
        '...all wait for their right fork',
        'Circular wait: P0→F1→P1→F2→...→P4→F0→P0',
      ],
    },
    quiz: {
      question: 'Which fix breaks the deadlock in dining philosophers?',
      options: [
        'Add more philosophers',
        'Have one philosopher pick up forks in the opposite order',
        'Remove all forks',
        'Make philosophers eat faster',
      ],
      correct: 1,
      explanation: 'Having one philosopher pick up the right fork first breaks the symmetry — the cycle can no longer form.',
    },
  },
  {
    id: 'critical-sections',
    title: 'Critical Sections',
    icon: GraduationCap,
    category: 'Concept',
    explanation:
      'A critical section is a code region that accesses shared resources and must not be executed by more than one thread at a time. Protecting critical sections with locks ensures data consistency and prevents races.',
    analogy:
      'A critical section is like a confessional booth — only one person enters at a time. While someone is inside, others wait outside. Once they exit, the next person can enter.',
    code: `std::mutex mtx;

void updateSharedData() {
    mtx.lock();
    // --- critical section starts ---
    sharedVar += 1;
    // --- critical section ends ---
    mtx.unlock();
}`,
    demo: {
      description: 'Identifying and protecting the critical section eliminates races.',
      steps: [
        'Identify code that reads/writes shared data',
        'Wrap it in a lock/unlock pair',
        'Only one thread enters at a time',
        'Keep the section as short as possible',
        'Data remains consistent across threads',
      ],
    },
    quiz: {
      question: 'What makes a section of code "critical"?',
      options: [
        'It runs slowly',
        'It accesses shared mutable resources',
        'It contains loops',
        'It is called frequently',
      ],
      correct: 1,
      explanation: 'A critical section is any code that accesses shared mutable data. It must be protected to prevent concurrent access from causing inconsistency.',
    },
  },
];

export function LearningLab() {
  const navigate = useNavigate();
  const [progress, setProgress] = useLocalStorage<Record<string, { completed: boolean; quizCorrect: boolean }>>(
    'threaddoctor:progress',
    {},
  );
  const [selectedId, setSelectedId] = useState<string | null>(LESSONS[0].id);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [editedCode, setEditedCode] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState(false);

  const lesson = LESSONS.find((l) => l.id === selectedId) ?? LESSONS[0];
  const currentCode = editedCode[lesson.id] ?? lesson.code;
  const isModified = editedCode[lesson.id] !== undefined && editedCode[lesson.id] !== lesson.code;

  // Reset edit mode when switching lessons
  useEffect(() => {
    setEditMode(false);
  }, [selectedId]);

  function selectLesson(id: string) {
    setSelectedId(id);
    setQuizAnswer(null);
    setQuizSubmitted(false);
  }

  function handleCodeChange(newCode: string) {
    setEditedCode((prev) => ({ ...prev, [lesson.id]: newCode }));
  }

  function resetCode() {
    setEditedCode((prev) => {
      const next = { ...prev };
      delete next[lesson.id];
      return next;
    });
  }

  function submitQuiz() {
    if (quizAnswer === null) return;
    const correct = quizAnswer === lesson.quiz.correct;
    setQuizSubmitted(true);
    setProgress((prev) => ({
      ...prev,
      [lesson.id]: { completed: true, quizCorrect: correct },
    }));
  }

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const totalLessons = LESSONS.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Learning Lab</h1>
          <p className="text-sm text-muted mt-1">
            Interactive lessons on concurrency concepts — with real-world analogies, code, and quizzes.
          </p>
        </div>
        <div className="card px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4 text-accent" />
            <span className="text-slate-200 font-medium">{completedCount}/{totalLessons}</span>
            <span className="text-muted">completed</span>
          </div>
          <div className="w-40 h-1.5 bg-bg-base rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${(completedCount / totalLessons) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Lesson list */}
        <div className="card p-3 space-y-1 lg:max-h-[600px] overflow-y-auto">
          {LESSONS.map((l) => {
            const p = progress[l.id];
            const active = l.id === selectedId;
            return (
              <button
                key={l.id}
                onClick={() => selectLesson(l.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                  active ? 'bg-accent/12 text-accent border border-accent/25' : 'text-slate-200 hover:bg-bg-hover border border-transparent'
                }`}
              >
                {p?.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted shrink-0" />
                )}
                <span className="font-medium">{l.title}</span>
              </button>
            );
          })}
        </div>

        {/* Lesson content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Header */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <lesson.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">{lesson.title}</h2>
                <span className="text-xs text-muted uppercase tracking-wider">{lesson.category}</span>
              </div>
              {progress[lesson.id]?.completed && (
                <span className="ml-auto label-badge bg-success/10 text-success border border-success/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Explanation</h3>
                <p className="text-sm text-muted-light leading-relaxed">{lesson.explanation}</p>
              </div>

              <div className="rounded-lg bg-bg-base/50 border border-border-subtle p-4">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-warning uppercase tracking-wider mb-1">Real-World Analogy</h3>
                    <p className="text-sm text-muted-light leading-relaxed">{lesson.analogy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code example */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-slate-100">Code Example</h3>
              {isModified && (
                <span className="label-badge bg-warning/10 text-warning border border-warning/30 text-[10px] ml-1">
                  Modified
                </span>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setEditMode((e) => !e)}
                  className={`btn-ghost px-2 py-1 text-xs ${editMode ? 'text-accent bg-accent/10' : ''}`}
                  title={editMode ? 'Switch to read-only' : 'Edit code'}
                >
                  {editMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  {editMode ? 'Read-only' : 'Edit'}
                </button>
                {isModified && (
                  <button onClick={resetCode} className="btn-ghost px-2 py-1 text-xs" title="Reset to original">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>
            <CodeEditor
              code={currentCode}
              editable={editMode}
              onChange={handleCodeChange}
              onReset={isModified ? resetCode : undefined}
            />
            {editMode && (
              <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-warning" />
                Try modifying the code to experiment with the concept. Your edits are saved per-lesson as you browse.
              </p>
            )}
          </div>

          {/* Interactive demo */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-success" />
              <h3 className="text-sm font-semibold text-slate-100">Interactive Demo</h3>
            </div>
            <p className="text-sm text-muted-light mb-3">{lesson.demo.description}</p>
            <div className="space-y-2">
              {lesson.demo.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-bg-raised border border-border-subtle px-3 py-2 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/15 text-accent text-[10px] font-mono font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-200">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-slate-100">Knowledge Check</h3>
            </div>
            <p className="text-sm text-slate-200 mb-4">{lesson.quiz.question}</p>
            <div className="space-y-2">
              {lesson.quiz.options.map((opt, i) => {
                const isSelected = quizAnswer === i;
                const isCorrect = i === lesson.quiz.correct;
                const showResult = quizSubmitted;
                return (
                  <button
                    key={i}
                    onClick={() => !quizSubmitted && setQuizAnswer(i)}
                    disabled={quizSubmitted}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-sm transition-all ${
                      showResult && isCorrect
                        ? 'border-success/40 bg-success/10 text-success'
                        : showResult && isSelected && !isCorrect
                        ? 'border-danger/40 bg-danger/10 text-danger'
                        : isSelected
                        ? 'border-accent/40 bg-accent/10 text-slate-100'
                        : 'border-border-subtle bg-bg-raised text-slate-200 hover:border-border-strong'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono shrink-0 ${
                      showResult && isCorrect ? 'border-success' : showResult && isSelected ? 'border-danger' : isSelected ? 'border-accent' : 'border-border-strong'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="mt-4 rounded-lg bg-bg-base/50 border border-border-subtle p-3 animate-fade-in">
                <p className="text-xs text-muted-light">
                  <strong className={quizAnswer === lesson.quiz.correct ? 'text-success' : 'text-danger'}>
                    {quizAnswer === lesson.quiz.correct ? 'Correct! ' : 'Not quite. '}
                  </strong>
                  {lesson.quiz.explanation}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              {!quizSubmitted ? (
                <button onClick={submitQuiz} disabled={quizAnswer === null} className="btn-primary">
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={() => {
                    setQuizAnswer(null);
                    setQuizSubmitted(false);
                  }}
                  className="btn-secondary"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <button onClick={() => navigate('/playground')} className="btn-secondary ml-auto">
                Try in Playground
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
