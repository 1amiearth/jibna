import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  calcGoal,
  DEFAULT_PROFILE,
  type DrinkType,
  migrateEntries,
  type Entry,
  type Mix,
  type Profile,
} from '@/lib/hydration';

export type Reminders = {
  enabled: boolean;
  intervalMin: number;
  start: string;
  end: string;
  hotBoost: boolean;
  stopAtGoal: boolean;
  sleepMode: boolean;
};

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
  entries: Entry[];
  reminders: Reminders;
  lastCelebrated: string | null;
  toast: Toast | null; // not persisted
};

type Actions = {
  setProfile: (p: Partial<Profile>) => void;
  setGoal: (ml: number, custom: boolean) => void;
  completeOnboarding: (remindersOn: boolean) => void;
  addEntry: (type: DrinkType, ml: number, at?: number, mix?: Mix) => Entry;
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
      entries: [],
      reminders: {
        enabled: false,
        intervalMin: 90,
        start: '08:00',
        end: '21:00',
        hotBoost: true,
        stopAtGoal: false,
        sleepMode: true,
      },
      lastCelebrated: null,
      toast: null,

      setProfile: (p) =>
        set((s) => {
          const profile = { ...s.profile, ...p };
          return { profile, goal: s.goalIsCustom ? s.goal : calcGoal(profile) };
        }),
      setGoal: (goal, goalIsCustom) => set({ goal, goalIsCustom }),
      completeOnboarding: (enabled) =>
        set((s) => ({ onboarded: true, reminders: { ...s.reminders, enabled } })),
      addEntry: (type, ml, at = Date.now(), mix) => {
        const entry: Entry = { id: newId(), type, ml, at };
        if (mix) entry.mix = mix;
        else if (type === 'Liquor') entry.mix = { kind: 'neat', liquorMl: ml };
        set((s) => ({ entries: [...s.entries, entry] }));
        return entry;
      },
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
      version: 1,
      // v1: Entry.mix (liquor mixers).
      migrate: (persisted, version) => {
        const s = persisted as State;
        return version < 1 ? { ...s, entries: migrateEntries(s.entries ?? []) } : s;
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ toast, ...rest }) => rest,
    },
  ),
);
