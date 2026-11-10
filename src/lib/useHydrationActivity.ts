import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import HydrationActivity from '@/components/HydrationActivity';
import { VESSELS } from '@/components/Vessel';
import { cupLayers, dayKey, dayTotals, entriesOn, goalOn, planSchedule } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';

/** Mirrors today's intake, next reminder and this week into one Live Activity (Dynamic Island). iOS only. */
export function useHydrationActivity() {
  const entries = useJibna((s) => s.entries);
  const goal = useJibna((s) => s.goal);
  const goals = useJibna((s) => s.goals);
  const reminders = useJibna((s) => s.reminders);
  const hot = useJibna((s) => s.profile.weather !== 'normal');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const sync = () => {
      const now = new Date();
      const ml = dayTotals(entries, dayKey(now)).hydration;
      const nextAt = reminders.enabled ? (planSchedule(now.getTime(), reminders, hot, Math.max(0, goal - ml))[0]?.at ?? null) : null;
      // Mon..Sun of the current week.
      const monday = now.getDate() - ((now.getDay() + 6) % 7);
      const week = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now.getFullYear(), now.getMonth(), monday + i);
        if (day > now) return 0;
        const key = dayKey(day);
        const drank = dayTotals(entries, key).hydration;
        return drank >= goalOn(goals, key, goal) ? 2 : drank > 0 ? 1 : 0;
      });
      // The ring starts one reminder interval before the next glass (or now, overnight).
      const fromAt = nextAt != null ? Math.min(now.getTime(), nextAt - reminders.intervalMin * 60_000) : null;
      const props = { ml, goal, nextAt, fromAt, week, layers: cupLayers(entriesOn(entries, dayKey(now)), goal, (t) => VESSELS[t].liquid) };
      // ponytail: no end-of-day end yet; iOS removes it after 8h, the next app open starts a fresh one.
      try {
        const [live] = HydrationActivity.getInstances();
        if (live) live.update(props);
        else HydrationActivity.start(props, 'jibna://home');
      } catch (e) {
        console.warn('[live-activity]', e);
      }
    };
    sync();
    // iOS only starts an activity while the app is foreground, so retry on every return to it.
    const sub = AppState.addEventListener('change', (st) => st === 'active' && sync());
    return () => sub.remove();
  }, [entries, goal, goals, reminders, hot]);
}
