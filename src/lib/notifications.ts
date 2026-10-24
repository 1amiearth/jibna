import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { dayKey, dayTotals, planSchedule } from '@/lib/hydration';
import { useJibna } from '@/store/useJibna';

const supported = Platform.OS !== 'web';

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

/**
 * Replace all pending reminders with a fresh plan (see planSchedule). Re-run on launch, on
 * foreground and whenever entries/goal/settings change, so "stop at goal" and the
 * remaining-ml copy stay current without background tasks.
 */
async function reschedule() {
  if (!supported) return;
  const { reminders, entries, goal, profile } = useJibna.getState();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminders.enabled || (await getPermission()) !== 'granted') return;

  const now = Date.now();
  const remaining = Math.max(0, goal - dayTotals(entries, dayKey(now)).hydration);
  for (const { at, body } of planSchedule(now, reminders, profile.weather !== 'normal', remaining)) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'จิบนะ', body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    });
  }
}

// One run at a time: a later change waits for the current cancel+schedule pass to finish.
let queue: Promise<unknown> = Promise.resolve();
/** Reschedule now (also the Reminders screen's retry). Failures show on that screen. */
export function queueReschedule() {
  queue = queue
    .then(reschedule)
    .then(() => useJibna.setState({ reminderSyncFailed: false }))
    .catch((e) => {
      if (__DEV__) console.warn('[reminders] reschedule failed', e);
      useJibna.setState({ reminderSyncFailed: true });
    });
}

/** Mount once at the root: keeps scheduled reminders in sync with the store and app foreground. */
export function useReminderSync(enabled: boolean) {
  const reminders = useJibna((s) => s.reminders);
  const entries = useJibna((s) => s.entries);
  const goal = useJibna((s) => s.goal);
  const weather = useJibna((s) => s.profile.weather);
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(queueReschedule, 500);
    return () => clearTimeout(t);
  }, [enabled, reminders, entries, goal, weather]);
  // Coming back from iOS Settings (permission) or after days away: top the schedule up.
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (s) => s === 'active' && queueReschedule());
    return () => sub.remove();
  }, [enabled]);
}
