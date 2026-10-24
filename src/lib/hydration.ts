// Pure domain logic. No React Native imports so it runs under `node --test`.

export type DrinkType =
  | 'Water'
  | 'ThaiTea'
  | 'GreenTea'
  | 'Coffee'
  | 'Milk'
  | 'Coconut'
  | 'Beer'
  | 'Liquor';

export type Drink = {
  label: string;
  /** Default serving in ml. */
  ml: number;
  /** Net hydration per ml counted toward the goal. Negative = loses more water than it gives. */
  factor: number;
  /** Swipeable serving sizes on Add Drink; `ml` is one of them. */
  sizes: number[];
  /** Largest single entry. For liquor this is the liquor itself; mixers have MIXER_MAX_ML. */
  maxMl: number;
  /** Sizes from this ml up are drawn as a bottle on Add Drink (water: 600 ml, 1.5 L). */
  bottleFrom?: number;
  /** Alcohol by volume (0–1); set only for alcoholic drinks. */
  abv?: number;
  caffeineMgPerMl?: number;
};

/** Diuresis: about 10 ml of extra urine per gram of alcohol. */
const ML_LOST_PER_G_ALCOHOL = 10;
const ETHANOL_G_PER_ML = 0.789;
/** Alcoholic drinks: their own water content minus the water lost to their alcohol, per ml. */
export const alcoholFactor = (abv: number, waterShare: number) => waterShare - ML_LOST_PER_G_ALCOHOL * ETHANOL_G_PER_ML * abv;

/*
 * Hydration values (net ml counted toward the daily goal). Non-alcoholic shares come from the
 * Figma Drink Chip descriptions. Every alcoholic drink uses one formula:
 *   net = ml × water share − 10 ml × grams of alcohol,  grams = ml × ABV × 0.789
 * Product values pending nutrition review; not medical advice.
 *
 *   Drink        serving  factor   net / serving   max per entry
 *   น้ำเปล่า       350 ml   100%     +350            2,000 ml
 *   ชาไทย          250 ml    80%     +200            1,000 ml
 *   ชาเขียว         300 ml    95%     +285            1,000 ml
 *   กาแฟ           200 ml    80%     +160            1,000 ml
 *   นม             200 ml    90%     +180            1,000 ml
 *   น้ำมะพร้าว      400 ml   100%     +400            1,000 ml
 *   เบียร์ 5%       320 ml   ≈+54%    ≈+171           1,500 ml   (water 93%, 12.6 g alcohol)
 *   เหล้า 40%        30 ml   ≈−256%   ≈−77 neat         300 ml   (water 60%, 9.5 g alcohol)
 *   mixer (น้ำ/โซดา)  +ml     100%     +ml             1,000 ml   (plain soda water, no sugar)
 *   e.g. เหล้า 45 + โซดา 200 ≈ −115 + 200 = +85
 */
export const DRINKS: Record<DrinkType, Drink> = {
  Water: { label: 'น้ำเปล่า', ml: 350, factor: 1, sizes: [250, 350, 500, 600, 1500], maxMl: 2000, bottleFrom: 600 },
  // Caffeine: brewed black tea ≈ 0.2 mg/ml, diluted by milk in ชาไทย; green tea ≈ 0.1; coffee ≈ 0.475.
  ThaiTea: { label: 'ชาไทย', ml: 250, factor: 0.8, sizes: [200, 250, 350], maxMl: 1000, caffeineMgPerMl: 0.16 },
  GreenTea: { label: 'ชาเขียว', ml: 300, factor: 0.95, sizes: [200, 300, 400], maxMl: 1000, caffeineMgPerMl: 0.1 },
  Coffee: { label: 'กาแฟ', ml: 200, factor: 0.8, sizes: [150, 200, 350], maxMl: 1000, caffeineMgPerMl: 0.475 },
  Milk: { label: 'นม', ml: 200, factor: 0.9, sizes: [200, 250, 400], maxMl: 1000 },
  Coconut: { label: 'น้ำมะพร้าว', ml: 400, factor: 1, sizes: [250, 400, 500], maxMl: 1000 },
  Beer: { label: 'เบียร์', ml: 320, factor: alcoholFactor(0.05, 0.93), abv: 0.05, sizes: [320, 490, 620], maxMl: 1500 },
  Liquor: { label: 'เหล้า', ml: 30, factor: alcoholFactor(0.4, 0.6), abv: 0.4, sizes: [30, 45, 60], maxMl: 300 },
};

export const MIXER_MAX_ML = 1000;

/** User's drink order, made safe: unknown types dropped, types added in a later version appended. */
export function drinkOrder(saved: readonly string[]): DrinkType[] {
  const known = saved.filter((t, i): t is DrinkType => DRINK_TYPES.includes(t as DrinkType) && saved.indexOf(t) === i);
  return [...known, ...DRINK_TYPES.filter((t) => !known.includes(t))];
}

/** Drinks on Home's quick-add row, in the user's order. Never empty: water stays if all are hidden. */
export function homeDrinks(saved: readonly string[], hidden: readonly string[]): DrinkType[] {
  const shown = drinkOrder(saved).filter((t) => !hidden.includes(t));
  return shown.length ? shown : ['Water'];
}

/** Move `t` one step up (-1) or down (+1) in the order. */
export function moveDrink(order: DrinkType[], t: DrinkType, dir: 1 | -1): DrinkType[] {
  const i = order.indexOf(t);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= order.length) return order;
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
export const isAlcohol = (t: DrinkType) => (DRINKS[t].abv ?? 0) > 0;

export const DRINK_TYPES = Object.keys(DRINKS) as DrinkType[];

export type MixKind = 'neat' | 'water' | 'soda' | 'waterSoda';
/** Liquor only. `liquorMl` of the entry's `ml` is liquor; the rest is the mixer. */
export type Mix = { kind: MixKind; liquorMl: number };

/** Liquor mixers. Plain soda water (no sugar) counts like water. */
export const MIXES: Record<MixKind, { label: string; mixer: string; factor: number; sizes: number[] }> = {
  neat: { label: 'เพียว', mixer: '', factor: 0, sizes: [] },
  water: { label: 'ผสมน้ำ', mixer: 'น้ำ', factor: 1, sizes: [150, 200, 300] },
  soda: { label: 'ผสมโซดา', mixer: 'โซดา', factor: 1, sizes: [150, 200, 300] },
  waterSoda: { label: 'ผสมน้ำ+โซดา', mixer: 'น้ำ+โซดา', factor: 1, sizes: [150, 200, 300] },
};
export const MIX_KINDS = Object.keys(MIXES) as MixKind[];

/** `summary`: a whole old day of one drink merged by compactEntries (no real time of day). */
export type Entry = { id: string; type: DrinkType; ml: number; at: number; mix?: Mix; summary?: true };

export type Sex = 'female' | 'male' | 'other';
export type Activity = 'low' | 'mid' | 'high';
export type Weather = 'normal' | 'hot' | 'veryHot';
export type Profile = {
  sex: Sex;
  weightKg: number;
  activity: Activity;
  weather: Weather;
  wake: string; // 'HH:MM'
  sleep: string; // 'HH:MM'
};

export const ML_PER_KG = 30;
export const ACTIVITY_ML: Record<Activity, number> = { low: 0, mid: 250, high: 500 };
export const WEATHER_ML: Record<Weather, number> = { normal: 0, hot: 200, veryHot: 400 };
export const GOAL_MIN = 1000;
export const GOAL_MAX = 5000;
export const GOAL_STEP = 50;
export const AMOUNT_MIN = 10;
export const AMOUNT_MAX = 2000;
export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 200;
export const MIN_AWAKE_MIN = 8 * 60;
export const BACKDATE_DAYS = 7;

export const DEFAULT_PROFILE: Profile = {
  sex: 'female',
  weightKg: 55,
  activity: 'mid',
  weather: 'veryHot',
  wake: '07:00',
  sleep: '23:00',
};

export function calcGoal(p: Pick<Profile, 'weightKg' | 'activity' | 'weather'>): number {
  const raw = p.weightKg * ML_PER_KG + ACTIVITY_ML[p.activity] + WEATHER_ML[p.weather];
  return clamp(Math.round(raw / GOAL_STEP) * GOAL_STEP, GOAL_MIN, GOAL_MAX);
}

export const isValidGoal = (ml: number) => ml >= GOAL_MIN && ml <= GOAL_MAX;
export const isValidAmount = (ml: number) => ml >= AMOUNT_MIN && ml <= AMOUNT_MAX;

export function hydrationOf(e: Pick<Entry, 'type' | 'ml' | 'mix'>): number {
  if (!e.mix || e.mix.kind === 'neat') return e.ml * DRINKS[e.type].factor;
  return e.mix.liquorMl * DRINKS[e.type].factor + (e.ml - e.mix.liquorMl) * MIXES[e.mix.kind].factor;
}

/** 'เหล้า ผสมโซดา' — drink name plus mixer for mixed liquor. */
export function entryLabel(e: Pick<Entry, 'type' | 'mix'>): string {
  const label = DRINKS[e.type].label;
  return e.mix && e.mix.kind !== 'neat' ? `${label} ${MIXES[e.mix.kind].label}` : label;
}

/** '45+200 ml' for mixed liquor, otherwise '350 ml'. */
export function entryAmount(e: Pick<Entry, 'ml' | 'mix'>): string {
  return e.mix && e.mix.kind !== 'neat'
    ? `${formatMl(e.mix.liquorMl)}+${formatMl(e.ml - e.mix.liquorMl)} ml`
    : `${formatMl(e.ml)} ml`;
}

/** Added-toast text: '+350 ml น้ำเปล่า', or '+ เหล้า ผสมโซดา 45+200 ml' so the sum doesn't read as '+45+200'. */
export function addedText(e: Pick<Entry, 'type' | 'ml' | 'mix'>): string {
  return e.mix && e.mix.kind !== 'neat' ? `+ ${entryLabel(e)} ${entryAmount(e)}` : `+${entryAmount(e)} ${entryLabel(e)}`;
}

/** Days kept entry-by-entry; older days are merged into one summary entry per drink. */
export const DETAIL_DAYS = 365;

/**
 * Keeps storage bounded (the whole log is one AsyncStorage value): entries on days older than
 * `keepDays` are merged per day × drink × mix into one entry at noon. Day totals, caffeine
 * (±1 mg rounding), streaks and drops don't change, since hydration is linear in ml. Idempotent.
 * Returns the same array when there's nothing to merge.
 */
export function compactEntries(entries: Entry[], now: number, keepDays = DETAIL_DAYS): Entry[] {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - keepDays);
  const old = entries.filter((e) => e.at < cutoff.getTime());
  const groups = new Map<string, Entry[]>();
  for (const e of old) {
    const g = `${dayKey(e.at)}|${e.type}|${e.mix?.kind ?? ''}`;
    groups.set(g, [...(groups.get(g) ?? []), e]);
  }
  if ([...groups.values()].every((g) => g.length === 1 && g[0].summary)) return entries;
  const merged = [...groups.entries()].map(([g, es]): Entry => {
    const [key, type, kind] = g.split('|');
    const at = fromKey(key);
    at.setHours(12, 0, 0, 0);
    const e: Entry = { id: `sum-${key}-${type}-${kind}`, type: type as DrinkType, ml: es.reduce((s, x) => s + x.ml, 0), at: at.getTime(), summary: true };
    if (kind) e.mix = { kind: kind as MixKind, liquorMl: es.reduce((s, x) => s + (x.mix?.liquorMl ?? x.ml), 0) };
    return e;
  });
  return [...merged, ...entries.filter((e) => e.at >= cutoff.getTime())];
}

const BACKUP_APP = 'jibna';

/** Backup file: the persisted store plus its version, as JSON text (shared via the share sheet). */
export function backupText(data: object, version: number, now: number): string {
  return JSON.stringify({ app: BACKUP_APP, version, exportedAt: new Date(now).toISOString(), data });
}

function validEntry(e: unknown): e is Entry {
  if (!e || typeof e !== 'object') return false;
  const x = e as Record<string, unknown>;
  const mix = x.mix as Record<string, unknown> | undefined;
  return (
    typeof x.id === 'string' &&
    DRINK_TYPES.includes(x.type as DrinkType) &&
    typeof x.ml === 'number' && Number.isFinite(x.ml) && x.ml > 0 &&
    typeof x.at === 'number' && Number.isFinite(x.at) &&
    (mix === undefined || (MIX_KINDS.includes(mix.kind as MixKind) && typeof mix.liquorMl === 'number' && mix.liquorMl > 0))
  );
}

/** Parse a pasted backup. Returns the data and its store version, or a Thai error message. */
export function parseBackup(text: string): { version: number; data: Record<string, unknown> } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { error: 'ข้อความนี้ไม่ใช่ข้อมูลสำรองของจิบนะ' };
  }
  const b = raw as { app?: unknown; version?: unknown; data?: Record<string, unknown> };
  if (!b || b.app !== BACKUP_APP || !b.data || typeof b.data !== 'object') return { error: 'ข้อความนี้ไม่ใช่ข้อมูลสำรองของจิบนะ' };
  if (typeof b.version !== 'number' || !Number.isInteger(b.version) || b.version < 0) return { error: 'ไม่รู้จักเวอร์ชันของข้อมูลสำรอง' };
  if (!Array.isArray(b.data.entries) || !b.data.entries.every(validEntry)) return { error: 'ข้อมูลการดื่มในไฟล์สำรองไม่ถูกต้อง' };
  if (typeof b.data.goal !== 'number' || !isValidGoal(b.data.goal)) return { error: 'เป้าหมายในไฟล์สำรองไม่ถูกต้อง' };
  return { version: b.version, data: b.data };
}

/** Store v0 → v1: liquor entries logged before mixers existed were neat. */
export function migrateEntries(entries: Entry[]): Entry[] {
  return entries.map((e) => (e.type === 'Liquor' && !e.mix ? { ...e, mix: { kind: 'neat', liquorMl: e.ml } } : e));
}

export function caffeineOf(e: Pick<Entry, 'type' | 'ml'>): number {
  return Math.round(e.ml * (DRINKS[e.type].caffeineMgPerMl ?? 0));
}

/**
 * Local calendar day, 'YYYY-MM-DD'. Entries store a UTC timestamp and are bucketed by the
 * device's *current* timezone when read, so after flying to another timezone a late-night drink
 * can show on the neighbouring day. Deliberate: matches the clock the user sees; no stored tz.
 */
export function dayKey(t: number | Date): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type DayIndex = { byDay: Map<string, Entry[]>; totals: Map<string, DayTotals> };
// The store replaces `entries` on every change, so the array identity is a safe cache key:
// one O(n) pass per change instead of one per dayTotals call (Calendar ×31, streak ×days, …).
const indexCache = new WeakMap<readonly Entry[], DayIndex>();

function dayIndex(entries: readonly Entry[]): DayIndex {
  let index = indexCache.get(entries);
  if (!index) {
    const byDay = new Map<string, Entry[]>();
    for (const e of entries) {
      const k = dayKey(e.at);
      const day = byDay.get(k);
      if (day) day.push(e);
      else byDay.set(k, [e]);
    }
    for (const day of byDay.values()) day.sort((a, b) => b.at - a.at);
    index = { byDay, totals: new Map() };
    indexCache.set(entries, index);
  }
  return index;
}

const NO_ENTRIES: Entry[] = [];

/** That day's entries, newest first. Shared from a cache: don't mutate the result. */
export function entriesOn(entries: readonly Entry[], key: string): Entry[] {
  return dayIndex(entries).byDay.get(key) ?? NO_ENTRIES;
}

/** Local day keys that have at least one entry. */
export function loggedDays(entries: readonly Entry[]): string[] {
  return [...dayIndex(entries).byDay.keys()];
}

export type DayTotals = { hydration: number; total: number; caffeine: number; count: number };

/** Hydration never drops below 0 for a day, however much alcohol is logged. */
export function dayTotals(entries: readonly Entry[], key: string): DayTotals {
  const index = dayIndex(entries);
  let t = index.totals.get(key);
  if (!t) {
    const day = index.byDay.get(key) ?? NO_ENTRIES;
    t = {
      hydration: Math.max(0, Math.round(day.reduce((s, e) => s + hydrationOf(e), 0))),
      total: day.reduce((s, e) => s + e.ml, 0),
      caffeine: day.reduce((s, e) => s + caffeineOf(e), 0),
      count: day.length,
    };
    index.totals.set(key, t);
  }
  return t;
}

export function percentOf(hydration: number, goal: number): number {
  return goal > 0 ? Math.round((hydration / goal) * 100) : 0;
}

/**
 * Daily-goal changes, oldest first. Each applies from its day on; `from: ''` is the goal that
 * was in place before any recorded change, so past days keep the goal they were logged under.
 */
export type GoalLog = { from: string; ml: number }[];

export function goalOn(log: GoalLog, key: string, fallback: number): number {
  let ml = fallback;
  for (const g of log) if (g.from <= key) ml = g.ml;
  return ml;
}

/** Record `ml` as the goal from day `key` on (replaces any change already made that day). */
export function withGoal(log: GoalLog, key: string, ml: number): GoalLog {
  return [...log.filter((g) => g.from < key), { from: key, ml }];
}

/** Consecutive days meeting that day's goal, ending today (if met) or yesterday. */
export function streak(entries: Entry[], goalFor: (key: string) => number, now: number): number {
  const met = (d: Date) => dayTotals(entries, dayKey(d)).hydration >= goalFor(dayKey(d));
  const d = new Date(now);
  if (!met(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (met(d)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export type Challenge = {
  id: string;
  /** Shown as 'ภารกิจวันนี้: …'. */
  title: string;
  target: number;
  /** Progress from that day's entries (newest first) and that day's goal. */
  progress: (day: Entry[], goal: number) => number;
};

const hourOf = (e: Entry) => new Date(e.at).getHours();
const hydrating = (e: Entry) => !isAlcohol(e.type);

/** One per day, in rotation. Alcohol never counts toward a challenge. */
export const CHALLENGES: Challenge[] = [
  { id: 'early', title: 'ดื่ม 2 แก้วก่อน 10 โมง', target: 2, progress: (d) => d.filter((e) => hydrating(e) && hourOf(e) < 10).length },
  { id: 'water4', title: 'ดื่มน้ำเปล่า 4 แก้ว', target: 4, progress: (d) => d.filter((e) => e.type === 'Water').length },
  {
    id: 'halfByNoon',
    title: 'ดื่มให้ถึงครึ่งเป้าก่อนเที่ยง',
    target: 1,
    progress: (d, goal) => (d.filter((e) => hourOf(e) < 12).reduce((s, e) => s + hydrationOf(e), 0) >= goal / 2 ? 1 : 0),
  },
  { id: 'afternoon', title: 'จิบน้ำช่วงบ่าย 2 ครั้ง (13–17 น.)', target: 2, progress: (d) => d.filter((e) => hydrating(e) && hourOf(e) >= 13 && hourOf(e) < 17).length },
  { id: 'five', title: 'ดื่ม 5 ครั้งตลอดวัน', target: 5, progress: (d) => d.filter(hydrating).length },
];

/** The day's challenge: rotates through CHALLENGES by calendar day. */
export function challengeFor(key: string): Challenge {
  const [y, m, d] = key.split('-').map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return CHALLENGES[day % CHALLENGES.length];
}

export function challengeProgress(entries: Entry[], key: string, goal: number): { challenge: Challenge; done: number } {
  const challenge = challengeFor(key);
  return { challenge, done: Math.min(challenge.target, challenge.progress(entriesOn(entries, key), goal)) };
}

export const DROPS_PER_GOAL_DAY = 20;

/**
 * หยดน้ำสะสม: DROPS_PER_GOAL_DAY for every day that met its goal. Derived from the log, so
 * deleting entries can take drops back.
 */
export function waterDrops(entries: Entry[], goalFor: (key: string) => number): number {
  let met = 0;
  for (const k of loggedDays(entries)) if (dayTotals(entries, k).hydration >= goalFor(k)) met++;
  return met * DROPS_PER_GOAL_DAY;
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const fromMin = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

/** Minutes awake between wake and sleep; sleep may be after midnight. */
export function awakeMinutes(wake: string, sleep: string): number {
  return (toMin(sleep) - toMin(wake) + 1440) % 1440;
}

/** Reminder window must sit inside wake hours (same day, no wrap). */
export function windowInsideWake(start: string, end: string, wake: string, sleep: string): boolean {
  const s = toMin(start);
  const e = toMin(end);
  const w = toMin(wake);
  const awake = awakeMinutes(wake, sleep);
  const rel = (t: number) => (t - w + 1440) % 1440;
  return s < e && rel(s) <= awake && rel(e) <= awake;
}

export type Reminders = {
  enabled: boolean;
  intervalMin: number;
  start: string;
  end: string;
  hotBoost: boolean;
  stopAtGoal: boolean;
};

const HOT_EXTRA = ['12:30', '15:30'];
/** iOS keeps at most 64 pending local notifications; leave a little headroom. */
const MAX_PENDING = 60;
const MAX_DAYS = 7;

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
 * One-shot reminders for as many days ahead as fit under the iOS pending limit (up to a week),
 * so they keep coming if the app isn't opened. Stop-at-goal and the remaining-ml copy only
 * apply to today; later days get the generic body.
 */
export function planSchedule(now: number, r: Reminders, hot: boolean, remaining: number): { at: number; body: string }[] {
  const times = plannedTimes(r, hot);
  if (!times.length) return [];
  const days = Math.min(MAX_DAYS, Math.max(1, Math.floor(MAX_PENDING / times.length)));
  const out: { at: number; body: string }[] = [];
  for (let offset = 0; offset < days; offset++) {
    if (offset === 0 && r.stopAtGoal && remaining === 0) continue;
    for (const t of times) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(Math.floor(toMin(t) / 60), toMin(t) % 60, 0, 0);
      if (d.getTime() <= now) continue;
      const body =
        offset === 0 && remaining > 0
          ? `น้องจิบเริ่มคอแห้งแล้ว ดื่มน้ำสักแก้วไหม? ยังขาดอีก ${formatMl(remaining)} ml`
          : 'น้องจิบเริ่มคอแห้งแล้ว ดื่มน้ำสักแก้วไหม?';
      out.push({ at: d.getTime(), body });
    }
  }
  return out;
}

/**
 * Keep the reminder window inside wake hours after wake/sleep change: unchanged if it still
 * fits, otherwise reset to 1 h after waking until 2 h before sleep (no later than 23:30,
 * since the window can't cross midnight).
 */
export function fitWindow(w: { start: string; end: string }, wake: string, sleep: string): { start: string; end: string } {
  if (windowInsideWake(w.start, w.end, wake, sleep)) return w;
  const awake = awakeMinutes(wake, sleep);
  const s = (toMin(wake) + 60) % 1440;
  let e = (toMin(wake) + awake - 120) % 1440;
  if (e <= s) e = 23 * 60 + 30;
  const fitted = { start: fromMin(s), end: fromMin(e) };
  return windowInsideWake(fitted.start, fitted.end, wake, sleep) ? fitted : w;
}

/** Reminder times: every `interval` minutes after `start`, up to and including `end`. */
export function reminderTimes(intervalMin: number, start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = toMin(start) + intervalMin; t <= toMin(end); t += intervalMin) out.push(fromMin(t));
  return out;
}

/**
 * Next preset index when stepping `dir` from the current size. A custom amount steps to the
 * nearest preset in that direction. Returns null at either end.
 */
export function stepSize(sizes: number[], index: number, custom: number | null, dir: 1 | -1): number | null {
  if (custom != null) {
    const i = dir > 0 ? sizes.findIndex((s) => s > custom) : sizes.findLastIndex((s) => s < custom);
    return i === -1 ? null : i;
  }
  const next = index + dir;
  return next < 0 || next >= sizes.length ? null : next;
}

/** Add Drink liquid level 0.25–0.9 across the drink's preset range; custom amounts clamp. */
/** Whether Add Drink draws this amount as a bottle rather than the drink's own vessel. */
export const isBottle = (type: DrinkType, ml: number) => DRINKS[type].bottleFrom != null && ml >= DRINKS[type].bottleFrom!;

/**
 * Liquid level for the vessel actually drawn: glass sizes fill across the glass presets, bottle
 * sizes across 0…largest bottle (so a 600 ml bottle reads ~half, 1.5 L near full).
 */
export function vesselFill(type: DrinkType, ml: number, sizes: number[]): number {
  if (DRINKS[type].bottleFrom == null) return fillLevel(ml, sizes);
  const bottle = isBottle(type, ml);
  const group = sizes.filter((s) => isBottle(type, s) === bottle);
  return fillLevel(ml, bottle ? [0, ...group] : group.length ? group : sizes);
}

export function fillLevel(ml: number, sizes: number[]): number {
  const min = sizes[0];
  const max = sizes[sizes.length - 1];
  return 0.25 + 0.65 * Math.min(1, Math.max(0, (ml - min) / (max - min || 1)));
}

export type MascotMood = 'thirsty' | 'happy' | 'celebrate' | 'full';

/** Home mascot mood from today's progress: thirsty < 25% ≤ happy < 100% ≤ celebrate < 120% ≤ full. */
export function mascotMood(percent: number): MascotMood {
  if (percent >= 120) return 'full';
  if (percent >= 100) return 'celebrate';
  if (percent < 25) return 'thirsty';
  return 'happy';
}

export function formatMl(n: number): string {
  const sign = n < 0 ? '−' : '';
  return sign + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatFactor(factor: number): string {
  return `${factor < 0 ? '−' : ''}${Math.round(Math.abs(factor) * 100)}%`;
}

/** 90 → '1 ชม. 30 นาที' */
export function intervalLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} ชม.` : '', m ? `${m} นาที` : ''].filter(Boolean).join(' ');
}

export function formatTime(t: number): string {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Thai calendars count years in the Buddhist era: 2026 CE = พ.ศ. 2569. */
export const thaiYear = (ceYear: number) => ceYear + 543;

export const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** e.g. 'เสาร์ 24 ตุลาคม' */
export function formatDayTitle(key: string): string {
  const d = fromKey(key);
  return `${TH_DAYS[d.getDay()]} ${d.getDate()} ${TH_MONTHS[d.getMonth()]}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-first month grid; null = padding cell. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(dayKey(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
