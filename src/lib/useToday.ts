import { dayKey, dayTotals, percentOf, streak } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';

/** Today's totals derived from the store. Recomputed on every store change. */
export function useToday() {
  const entries = useJibna((s) => s.entries);
  const goal = useJibna((s) => s.goal);
  const now = Date.now();
  const key = dayKey(now);
  const totals = dayTotals(entries, key);
  return { key, goal, ...totals, percent: percentOf(totals.hydration, goal), streak: streak(entries, goal, now) };
}
