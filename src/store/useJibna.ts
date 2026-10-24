import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  calcGoal,
  compactEntries,
  dayKey,
  DEFAULT_PROFILE,
  DRINK_TYPES,
  fitWindow,
  type DrinkType,
  applyUndo,
  migrateState,
  STORE_VERSION,
  withGoal,
  type Entry,
  type GoalLog,
  type Mix,
  type Profile,
  type Reminders,
} from '@/lib/hydration';

export type { Reminders };
export { STORE_VERSION };

export type Toast = {
  id: number;
  message: string;
  /** Entry to remove (after add) or restore (after delete) when the user taps เลิกทำ. */
  undo?: { kind: 'add' | 'delete'; entry: Entry };
};

type State = {
  onboarded: boolean;
  profile: Profile;
  goal: number;
  goalIsCustom: boolean;
  /** Goal per day for history (streak, calendar); `goal` is always today's. */
  goals: GoalLog;
  /** Drinks list editor: order everywhere, and which drinks are hidden from Home's quick-add row. */
  drinkOrder: DrinkType[];
  hiddenDrinks: DrinkType[];
  entries: Entry[];
  reminders: Reminders;
  lastCelebrated: string | null;
  toast: Toast | null; // not persisted
  /** Last reminder reschedule threw (not persisted). */
  reminderSyncFailed: boolean;
};

type Actions = {
  setProfile: (p: Partial<Profile>) => void;
  setGoal: (ml: number, custom: boolean) => void;
  completeOnboarding: (remindersOn: boolean) => void;
  addEntry: (type: DrinkType, ml: number, at?: number, mix?: Mix) => Entry;
  setDrinkOrder: (order: DrinkType[]) => void;
  setDrinkHidden: (type: DrinkType, hidden: boolean) => void;
  removeEntry: (id: string) => Entry | undefined;
  /** Backup data (persisted fields only) and full replacement from a parsed backup. */
  backupData: () => BackupData;
  restoreBackup: (data: Record<string, unknown>, version: number) => void;
  /** Merge entries older than a year into per-day summaries (bounded storage). */
  compactOld: () => void;
  restoreEntry: (e: Entry) => void;
  setReminders: (r: Partial<Reminders>) => void;
  markCelebrated: (day: string) => void;
  showToast: (t: Omit<Toast, 'id'>) => void;
  undoToast: () => void;
  hideToast: () => void;
};

// What a backup holds: everything persisted except transient UI state.
const BACKUP_KEYS = ['onboarded', 'profile', 'goal', 'goalIsCustom', 'goals', 'drinkOrder', 'hiddenDrinks', 'entries', 'reminders', 'lastCelebrated'] as const;
type BackupData = Pick<State, (typeof BACKUP_KEYS)[number]>;

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useJibna = create<State & Actions>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profile: DEFAULT_PROFILE,
      goal: calcGoal(DEFAULT_PROFILE),
      goalIsCustom: false,
      goals: [{ from: '', ml: calcGoal(DEFAULT_PROFILE) }],
      entries: [],
      drinkOrder: [...DRINK_TYPES],
      hiddenDrinks: [],
      reminders: {
        enabled: false,
        intervalMin: 90,
        start: '08:00',
        end: '21:00',
        hotBoost: true,
        stopAtGoal: true, // onboarding promises reminders go quiet once the goal is met
      },
      lastCelebrated: null,
      toast: null,
      reminderSyncFailed: false,

      setProfile: (p) =>
        set((s) => {
          const profile = { ...s.profile, ...p };
          const goal = s.goalIsCustom ? s.goal : calcGoal(profile);
          // New wake/sleep can leave the saved reminder window outside wake hours: refit it.
          const window = fitWindow(s.reminders, profile.wake, profile.sleep);
          const moved = window.start !== s.reminders.start || window.end !== s.reminders.end;
          return {
            profile,
            goal,
            goals: goal === s.goal ? s.goals : withGoal(s.goals, dayKey(Date.now()), goal),
            ...(moved && {
              reminders: { ...s.reminders, ...window },
              toast: s.reminders.enabled
                ? { id: Date.now(), message: `ปรับช่วงเตือนเป็น ${window.start}–${window.end} ให้อยู่ในช่วงตื่น` }
                : s.toast,
            }),
          };
        }),
      setGoal: (goal, goalIsCustom) =>
        set((s) => ({ goal, goalIsCustom, goals: goal === s.goal ? s.goals : withGoal(s.goals, dayKey(Date.now()), goal) })),
      completeOnboarding: (enabled) =>
        set((s) => ({ onboarded: true, reminders: { ...s.reminders, enabled } })),
      addEntry: (type, ml, at = Date.now(), mix) => {
        const entry: Entry = { id: newId(), type, ml, at };
        if (mix) entry.mix = mix;
        else if (type === 'Liquor') entry.mix = { kind: 'neat', liquorMl: ml };
        set((s) => ({ entries: [...s.entries, entry] }));
        return entry;
      },
      setDrinkOrder: (order) => set({ drinkOrder: order }),
      setDrinkHidden: (type, hidden) =>
        set((s) => {
          const next = s.hiddenDrinks.filter((t) => t !== type).concat(hidden ? [type] : []);
          // Keep at least one drink on Home.
          return next.length >= DRINK_TYPES.length ? {} : { hiddenDrinks: next };
        }),
      backupData: () => {
        const s = get();
        return Object.fromEntries(BACKUP_KEYS.map((k) => [k, s[k]])) as BackupData;
      },
      restoreBackup: (data, version) => {
        // Start from the current state so fields a backup lacks keep sane values, then migrate.
        const current = get().backupData();
        const restored = migrateState({ ...current, ...data } as State, version);
        const picked = Object.fromEntries(BACKUP_KEYS.map((k) => [k, restored[k]])) as BackupData;
        set({ ...picked, entries: compactEntries(picked.entries, Date.now()), onboarded: true, toast: null });
      },
      compactOld: () =>
        set((s) => {
          const entries = compactEntries(s.entries, Date.now());
          return entries === s.entries ? {} : { entries };
        }),
      removeEntry: (id) => {
        const entry = get().entries.find((e) => e.id === id);
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
        return entry;
      },
      restoreEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
      setReminders: (r) => set((s) => ({ reminders: { ...s.reminders, ...r } })),
      markCelebrated: (lastCelebrated) => set({ lastCelebrated }),
      showToast: (t) => set({ toast: { ...t, id: Date.now() } }),
      undoToast: () => {
        const undo = get().toast?.undo;
        set((s) => ({ toast: null, ...(undo && { entries: applyUndo(s.entries, undo) }) }));
      },
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'jibna-v1',
      version: STORE_VERSION,
      migrate: (persisted, version) => migrateState(persisted as State, version),
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ toast, reminderSyncFailed, ...rest }) => rest,
      onRehydrateStorage: () => (state) => state?.compactOld(),
    },
  ),
);
