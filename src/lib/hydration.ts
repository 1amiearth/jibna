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
  /** Share of volume counted as water. Negative = dehydrating (alcohol). */
  factor: number;
  /** Swipeable serving sizes on Add Drink; `ml` is one of them. */
  sizes: number[];
  caffeineMgPerMl?: number;
};

// Values from the Figma Drink Chip description. Alcohol factor ≈ −10 ml per gram of
// alcohol with the drink's own water not credited — a product decision pending review.
export const DRINKS: Record<DrinkType, Drink> = {
  Water: { label: 'น้ำเปล่า', ml: 350, factor: 1, sizes: [250, 350, 500] },
  ThaiTea: { label: 'ชาไทย', ml: 250, factor: 0.8, sizes: [200, 250, 350] },
  GreenTea: { label: 'ชาเขียว', ml: 300, factor: 0.95, sizes: [200, 300, 400], caffeineMgPerMl: 0.1 },
  Coffee: { label: 'กาแฟ', ml: 200, factor: 0.8, sizes: [150, 200, 350], caffeineMgPerMl: 0.475 },
  Milk: { label: 'นม', ml: 200, factor: 0.9, sizes: [200, 250, 400] },
  Coconut: { label: 'น้ำมะพร้าว', ml: 400, factor: 1, sizes: [250, 400, 500] },
  Beer: { label: 'เบียร์', ml: 320, factor: -0.4, sizes: [320, 490, 620] },
  Liquor: { label: 'เหล้า', ml: 30, factor: -3, sizes: [30, 45, 60] },
};

export const DRINK_TYPES = Object.keys(DRINKS) as DrinkType[];

export type Entry = { id: string; type: DrinkType; ml: number; at: number };

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

export function hydrationOf(e: Pick<Entry, 'type' | 'ml'>): number {
  return e.ml * DRINKS[e.type].factor;
}

export function caffeineOf(e: Pick<Entry, 'type' | 'ml'>): number {
  return Math.round(e.ml * (DRINKS[e.type].caffeineMgPerMl ?? 0));
}

/** Local calendar day, 'YYYY-MM-DD'. */
export function dayKey(t: number | Date): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function entriesOn(entries: Entry[], key: string): Entry[] {
  return entries.filter((e) => dayKey(e.at) === key).sort((a, b) => b.at - a.at);
}

export type DayTotals = { hydration: number; total: number; caffeine: number; count: number };

/** Hydration never drops below 0 for a day, however much alcohol is logged. */
export function dayTotals(entries: Entry[], key: string): DayTotals {
  const day = entriesOn(entries, key);
  const hydration = day.reduce((s, e) => s + hydrationOf(e), 0);
  return {
    hydration: Math.max(0, Math.round(hydration)),
    total: day.reduce((s, e) => s + e.ml, 0),
    caffeine: day.reduce((s, e) => s + caffeineOf(e), 0),
    count: day.length,
  };
}

export function percentOf(hydration: number, goal: number): number {
  return goal > 0 ? Math.round((hydration / goal) * 100) : 0;
}

/**
 * Consecutive days meeting the goal, ending today (if met) or yesterday.
 * ponytail: uses the current goal for past days; store goal history if goals change often.
 */
export function streak(entries: Entry[], goal: number, now: number): number {
  const d = new Date(now);
  if (dayTotals(entries, dayKey(d)).hydration < goal) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dayTotals(entries, dayKey(d)).hydration >= goal) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
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

/** Reminder times: every `interval` minutes after `start`, up to and including `end`. */
export function reminderTimes(intervalMin: number, start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = toMin(start) + intervalMin; t <= toMin(end); t += intervalMin) out.push(fromMin(t));
  return out;
}

export function formatMl(n: number): string {
  const sign = n < 0 ? '−' : '';
  return sign + String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatFactor(factor: number): string {
  return `${factor < 0 ? '−' : ''}${Math.round(Math.abs(factor) * 100)}%`;
}

export function formatTime(t: number): string {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
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
