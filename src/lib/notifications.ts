import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { dayKey, dayTotals, formatMl, reminderTimes, toMin } from '@/lib/hydration';
import { useJibna, type Reminders } from '@/store/useJibna';

const supported = Platform.OS !== 'web';
const HOT_EXTRA = ['12:30', '15:30'];

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<PermissionState> {
  if (!supported) return 'denied';
  const p = await Notifications.getPermissionsAsync();
  return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}

export async function requestPermission(): Promise<boolean> {
  if (!supported) return false;
  const p = await Notifications.requestPermissionsAsync();
  return p.granted;
}

/** Daily reminder times; "hot boost" adds midday nudges when the profile says it's hot. */
export function plannedTimes(r: Reminders, hot: boolean): string[] {
  const times = reminderTimes(r.intervalMin, r.start, r.end);
  if (!r.hotBoost || !hot) return times;
  const extra = HOT_EXTRA.filter(
    (t) => toMin(t) > toMin(r.start) && toMin(t) < toMin(r.end) && times.every((x) => Math.abs(toMin(x) - toMin(t)) >= 20),
  );
  return [...times, ...extra].sort((a, b) => toMin(a) - toMin(b));
}

/**
 * One-shot notifications for the rest of today and tomorrow (≤ 64 on iOS).
 * Re-run on launch and whenever entries/goal/settings change, so "stop at goal" and the
 * remaining-ml copy stay current without background tasks.
 */
async function reschedule() {
  if (!supported) return;
  const { reminders, entries, goal, profile } = useJibna.getState();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminders.enabled || (await getPermission()) !== 'granted') return;

  const now = Date.now();
  const hydration = dayTotals(entries, dayKey(now)).hydration;
  const remaining = Math.max(0, goal - hydration);
  const times = plannedTimes(reminders, profile.weather !== 'normal');

  for (const offset of [0, 1]) {
    if (offset === 0 && reminders.stopAtGoal && remaining === 0) continue;
    for (const t of times) {
      const date = new Date(now);
      date.setDate(date.getDate() + offset);
      date.setHours(Math.floor(toMin(t) / 60), toMin(t) % 60, 0, 0);
      if (date.getTime() <= now) continue;
      const body =
        offset === 0 && remaining > 0
          ? `น้องจิบเริ่มคอแห้งแล้ว ดื่มน้ำสักแก้วไหม? ยังขาดอีก ${formatMl(remaining)} ml`
          : 'น้องจิบเริ่มคอแห้งแล้ว ดื่มน้ำสักแก้วไหม?';
      await Notifications.scheduleNotificationAsync({
        content: { title: 'จิบนะ', body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  }
}

/** Mount once at the root: keeps scheduled reminders in sync with the store. */
export function useReminderSync(enabled: boolean) {
  const reminders = useJibna((s) => s.reminders);
  const entries = useJibna((s) => s.entries);
  const goal = useJibna((s) => s.goal);
  const weather = useJibna((s) => s.profile.weather);
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => reschedule().catch(() => {}), 500);
    return () => clearTimeout(t);
  }, [enabled, reminders, entries, goal, weather]);
}
