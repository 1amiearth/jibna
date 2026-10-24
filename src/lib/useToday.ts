import { dayKey, dayTotals, goalOn, percentOf, streak } from '@/lib/hydration';
import { useNow } from '@/lib/useNow';
import { useJibna } from '@/store/useJibna';

/** Today's totals derived from the store. Recomputed on every store change. */
export function useToday() {
  const entries = useJibna((s) => s.entries);
  const goal = useJibna((s) => s.goal);
  const goals = useJibna((s) => s.goals);
  const now = useNow();
  const key = dayKey(now);
  const totals = dayTotals(entries, key);
  return { key, goal, ...totals, percent: percentOf(totals.hydration, goal), streak: streak(entries, (k) => goalOn(goals, k, goal), now) };
}
