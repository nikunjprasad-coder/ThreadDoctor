import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { SimulationHistoryEntry } from '@/types';

const KEY = 'threaddoctor:history';

export function useHistory() {
  const [history, setHistory] = useLocalStorage<SimulationHistoryEntry[]>(KEY, []);

  function addEntry(entry: SimulationHistoryEntry) {
    setHistory((prev) => [entry, ...prev].slice(0, 100));
  }

  function removeEntry(id: string) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  return { history, addEntry, removeEntry, clearHistory };
}
