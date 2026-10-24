import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  calcGoal,
  dayKey,
  DEFAULT_PROFILE,
  DRINK_TYPES,
  drinkOrder,
  fitWindow,
  type DrinkType,
  migrateEntries,
  withGoal,
  type Entry,
  type GoalLog,
  type Mix,
  type Profile,
  type Reminders,
} from '@/lib/hydration';

export type { Reminders };

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
  restoreEntry: (e: Entry) => void;
  setReminders: (r: Partial<Reminders>) => void;
  markCelebrated: (day: string) => void;
  showToast: (t: Omit<Toast, 'id'>) => void;
  undoToast: () => void;
  hideToast: () => void;
};

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
        if (undo?.kind === 'add') get().removeEntry(undo.entry.id);
        if (undo?.kind === 'delete') get().restoreEntry(undo.entry);
        set({ toast: null });
      },
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'jibna-v1',
      version: 3,
      // v1: Entry.mix (liquor mixers). v2: goal history, seeded with the current goal for all past days.
      // v3: drinks list (order + hidden), defaults to every drink in the built-in order.
      migrate: (persisted, version) => {
        let s = persisted as State;
        if (version < 1) s = { ...s, entries: migrateEntries(s.entries ?? []) };
        if (version < 2) s = { ...s, goals: [{ from: '', ml: s.goal }] };
        if (version < 3) s = { ...s, drinkOrder: drinkOrder([]), hiddenDrinks: [] };
        return s;
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ toast, reminderSyncFailed, ...rest }) => rest,
    },
  ),
);
