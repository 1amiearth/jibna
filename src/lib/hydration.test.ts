/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calcGoal,
  dayKey,
  entriesOn,
  dayTotals,
  DEFAULT_PROFILE,
  fillLevel,
  vesselFill,
  isBottle,
  formatMl,
  mascotMood,
  stepSize,
  hydrationOf,
  monthGrid,
  reminderTimes,
  streak,
  windowInsideWake,
  awakeMinutes,
  addedText,
  entryAmount,
  entryLabel,
  fitWindow,
  goalOn,
  caffeineOf,
  drinkOrder,
  homeDrinks,
  moveDrink,
  CHALLENGES,
  challengeFor,
  challengeProgress,
  migrateEntries,
  waterDrops,
  withGoal,
  planSchedule,
  type Entry,
  type Reminders,
} from './hydration.ts';

const at = (d: number, h: number) => new Date(2026, 9, d, h).getTime();

// The Day Log example from Figma (Sat 24 Oct 2026).
const figmaDay: Entry[] = [
  { id: '1', type: 'Coconut', ml: 400, at: at(24, 14) },
  { id: '2', type: 'Coffee', ml: 200, at: at(24, 12) },
  { id: '3', type: 'Water', ml: 350, at: at(24, 10) },
  { id: '4', type: 'ThaiTea', ml: 250, at: at(24, 9) },
  { id: '5', type: 'Water', ml: 350, at: at(24, 7) },
];

test('goal: 55 kg, mid activity, very hot = 2,300 ml', () => {
  assert.equal(calcGoal(DEFAULT_PROFILE), 2300);
  assert.equal(calcGoal({ weightKg: 200, activity: 'high', weather: 'veryHot' }), 5000);
});

test('Figma day log totals', () => {
  const t = dayTotals(figmaDay, '2026-10-24');
  // Figma showed 95 mg caffeine (coffee only); ชาไทย 250 ml now adds its 40 mg.
  assert.deepEqual(t, { hydration: 1460, total: 1550, caffeine: 135, count: 5 });
  const afterDelete = dayTotals(figmaDay.filter((e) => e.type !== 'Coffee'), '2026-10-24');
  assert.equal(afterDelete.hydration, 1300);
});

test('alcohol: one ABV formula, water content minus 10 ml per gram; the day never goes below 0', () => {
  assert.equal(Math.round(hydrationOf({ type: 'Beer', ml: 320 })), 171);
  assert.equal(Math.round(hydrationOf({ type: 'Liquor', ml: 30 })), -77);
  assert.equal(Math.round(hydrationOf({ type: 'Liquor', ml: 60 })), -153);
  const t = dayTotals([{ id: 'b', type: 'Liquor', ml: 60, at: at(24, 20) }], '2026-10-24');
  assert.equal(t.hydration, 0);
  assert.equal(t.total, 60);
});

test('streak counts back from today, or yesterday if today not met yet', () => {
  const full = (d: number): Entry => ({ id: `d${d}`, type: 'Water', ml: 2300, at: at(d, 12) });
  const log = [full(21), full(22), full(23)];
  assert.equal(streak(log, () => 2300, at(24, 9)), 3);
  assert.equal(streak([...log, full(24)], () => 2300, at(24, 20)), 4);
  assert.equal(streak([full(21), full(23)], () => 2300, at(24, 9)), 1);
});

test('reminder counts match the Figma interval sheet (08:00–21:00)', () => {
  assert.deepEqual([30, 60, 90, 120, 180].map((i) => reminderTimes(i, '08:00', '21:00').length), [26, 13, 8, 6, 4]);
});

test('wake window validation', () => {
  assert.equal(awakeMinutes('07:00', '23:00'), 960);
  assert.equal(awakeMinutes('07:00', '01:00'), 1080);
  assert.equal(windowInsideWake('08:00', '21:00', '07:00', '23:00'), true);
  assert.equal(windowInsideWake('06:00', '21:00', '07:00', '23:00'), false);
});

test('helpers', () => {
  assert.equal(formatMl(1460), '1,460');
  assert.equal(formatMl(-128), '−128');
  assert.equal(dayKey(at(24, 23)), '2026-10-24');
  const oct = monthGrid(2026, 9);
  assert.deepEqual(oct[0].slice(0, 4), [null, null, null, '2026-10-01']); // 1 Oct 2026 is Thursday
});

test('mascot mood thresholds', () => {
  assert.deepEqual([0, 24, 25, 99, 100, 119, 120, 180].map(mascotMood), ['thirsty', 'thirsty', 'happy', 'happy', 'celebrate', 'celebrate', 'full', 'full']);
});

test('size picker steps between presets and from a custom amount', () => {
  const sizes = [250, 350, 500];
  assert.equal(stepSize(sizes, 1, null, 1), 2);
  assert.equal(stepSize(sizes, 1, null, -1), 0);
  assert.equal(stepSize(sizes, 2, null, 1), null);
  assert.equal(stepSize(sizes, 0, null, -1), null);
  assert.equal(stepSize(sizes, 1, 400, 1), 2);
  assert.equal(stepSize(sizes, 1, 400, -1), 1);
  assert.equal(stepSize(sizes, 1, 900, 1), null);
  assert.equal(stepSize(sizes, 1, 100, -1), null);
});

test('vessel fill spans 0.25–0.9 over the presets and clamps custom amounts', () => {
  const sizes = [250, 350, 500];
  assert.equal(fillLevel(250, sizes), 0.25);
  assert.equal(fillLevel(500, sizes), 0.9);
  assert.equal(fillLevel(10, sizes), 0.25);
  assert.equal(fillLevel(2000, sizes), 0.9);
  assert.equal(fillLevel(30, [30]), 0.25);
});

test('liquor mixers: liquor part dehydrates, water and soda count 100%, net = sum', () => {
  const neat = { type: 'Liquor', ml: 45, mix: { kind: 'neat', liquorMl: 45 } } as const;
  const soda = { type: 'Liquor', ml: 245, mix: { kind: 'soda', liquorMl: 45 } } as const;
  const water = { type: 'Liquor', ml: 210, mix: { kind: 'water', liquorMl: 60 } } as const;
  const both = { type: 'Liquor', ml: 330, mix: { kind: 'waterSoda', liquorMl: 30 } } as const;
  assert.equal(Math.round(hydrationOf(neat)), -115);
  assert.equal(Math.round(hydrationOf(soda)), 85);
  assert.equal(Math.round(hydrationOf(water)), -3);
  assert.equal(Math.round(hydrationOf(both)), 223);
  // Total intake is the whole glass.
  const t = dayTotals([{ id: 's', at: at(24, 20), ...soda }], '2026-10-24');
  assert.equal(t.total, 245);
  assert.equal(t.hydration, 85);
  assert.equal(entryLabel(soda), 'เหล้า ผสมโซดา');
  assert.equal(entryAmount(soda), '45+200 ml');
  assert.equal(entryLabel(neat), 'เหล้า');
  assert.equal(entryAmount(neat), '45 ml');
  assert.equal(addedText(soda), '+ เหล้า ผสมโซดา 45+200 ml');
  assert.equal(addedText({ type: 'Water', ml: 350 }), '+350 ml น้ำเปล่า');
});

test('store v0 → v1 marks old liquor entries neat and leaves the rest alone', () => {
  const old: Entry[] = [
    { id: 'l', type: 'Liquor', ml: 30, at: at(24, 20) },
    { id: 'w', type: 'Water', ml: 350, at: at(24, 9) },
  ];
  const [l, w] = migrateEntries(old);
  assert.deepEqual(l.mix, { kind: 'neat', liquorMl: 30 });
  assert.equal(Math.round(hydrationOf(l)), -77);
  assert.equal(w, old[1]);
});

test('reminder plan covers up to a week, stays under the iOS 64 limit, and respects stop-at-goal', () => {
  const r: Reminders = { enabled: true, intervalMin: 90, start: '08:00', end: '21:00', hotBoost: true, stopAtGoal: true };
  const now = at(24, 10); // 8 slots/day: 09:30 … 20:00
  const plan = planSchedule(now, r, false, 500);
  assert.equal(plan.length, 7 + 6 * 8); // 11:00…20:00 today + 6 more days
  assert.ok(plan.every((p) => p.at > now));
  assert.match(plan[0].body, /ยังขาดอีก 500 ml/);
  assert.doesNotMatch(plan[plan.length - 1].body, /ยังขาดอีก/);
  // Goal met today: skip today only.
  assert.equal(planSchedule(now, r, false, 0).length, 6 * 8);
  assert.equal(planSchedule(now, { ...r, stopAtGoal: false }, false, 0).length, 7 + 6 * 8);
  // Every 30 min (26/day) only fits two days under the cap.
  const dense = planSchedule(at(24, 7), { ...r, intervalMin: 30 }, true, 500);
  assert.equal(dense.length, 52);
  assert.ok(dense.length <= 64);
  // Hot boost adds midday nudges when they aren't next to an existing slot.
  const hourly = planSchedule(at(24, 7), { ...r, intervalMin: 120, start: '08:00', end: '20:00' }, true, 500);
  assert.equal(hourly.filter((p) => new Date(p.at).getDate() === 24).length, 6 + 2);
});

test('goal history: raising the goal today keeps past days (and the streak) under the old goal', () => {
  const full = (d: number): Entry => ({ id: `d${d}`, type: 'Water', ml: 2300, at: at(d, 12) });
  const log = withGoal([{ from: '', ml: 2300 }], '2026-10-24', 3000);
  assert.equal(goalOn(log, '2026-10-20', 9999), 2300);
  assert.equal(goalOn(log, '2026-10-24', 9999), 3000);
  assert.equal(goalOn([], '2026-10-24', 2500), 2500);
  const g = (k: string) => goalOn(log, k, 3000);
  assert.equal(streak([full(21), full(22), full(23)], g, at(24, 9)), 3);
  // Changing it twice the same day keeps one record for that day.
  assert.deepEqual(withGoal(log, '2026-10-24', 2800), [{ from: '', ml: 2300 }, { from: '2026-10-24', ml: 2800 }]);
});

test('water drops: 20 per day that met its own goal', () => {
  const e = (d: number, ml: number): Entry => ({ id: `w${d}`, type: 'Water', ml, at: at(d, 12) });
  const log = withGoal([{ from: '', ml: 2000 }], '2026-10-24', 3000);
  const g = (k: string) => goalOn(log, k, 3000);
  assert.equal(waterDrops([e(22, 2000), e(23, 1500), e(24, 2500)], g), 20); // 24th misses the new 3,000
  assert.equal(waterDrops([], g), 0);
});

test('reminder window is pulled back inside wake hours when wake/sleep change', () => {
  const w = { start: '08:00', end: '21:00' };
  assert.equal(fitWindow(w, '07:00', '23:00'), w); // still fits: same object
  assert.deepEqual(fitWindow(w, '09:00', '23:00'), { start: '10:00', end: '21:00' });
  assert.deepEqual(fitWindow(w, '10:00', '02:00'), { start: '11:00', end: '23:30' }); // sleep after midnight
  assert.deepEqual(fitWindow(w, '23:30', '08:00'), { start: '00:30', end: '06:00' }); // night shift
  assert.deepEqual(fitWindow({ start: '08:00', end: '22:30' }, '07:00', '22:00'), { start: '08:00', end: '20:00' });
});

test('caffeine per serving', () => {
  assert.equal(caffeineOf({ type: 'ThaiTea', ml: 250 }), 40);
  assert.equal(caffeineOf({ type: 'Coffee', ml: 200 }), 95);
  assert.equal(caffeineOf({ type: 'Water', ml: 350 }), 0);
});

test('water bottles: 600 ml and 1.5 L draw as a bottle with their own fill scale', () => {
  const sizes = [250, 350, 500, 600, 1500];
  assert.equal(isBottle('Water', 500), false);
  assert.equal(isBottle('Water', 600), true);
  assert.equal(isBottle('Coffee', 1000), false);
  assert.equal(vesselFill('Water', 250, sizes), 0.25);
  assert.equal(vesselFill('Water', 500, sizes), 0.9);
  assert.equal(vesselFill('Water', 1500, sizes), 0.9);
  assert.ok(Math.abs(vesselFill('Water', 600, sizes) - 0.51) < 0.01);
  assert.equal(vesselFill('Coffee', 200, [150, 200, 350]), fillLevel(200, [150, 200, 350]));
});

test('daily challenge rotates by day and counts only that day, never alcohol', () => {
  const keys = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'];
  assert.equal(new Set(keys.map((k) => challengeFor(k).id)).size, CHALLENGES.length);
  assert.equal(challengeFor('2026-10-24').id, challengeFor('2026-10-24').id);
  assert.equal(challengeFor('2026-10-24').id, challengeFor('2026-10-29').id); // every 5 days
  const e = (h: number, type: Entry['type'] = 'Water', ml = 350): Entry => ({ id: `${type}${h}`, type, ml, at: at(24, h) });
  const day = [e(7), e(8, 'Beer'), e(9, 'Coffee'), e(14), e(20)];
  const progress = (id: string) => CHALLENGES.find((c) => c.id === id)!.progress(day, 2300);
  assert.equal(progress('early'), 2); // beer at 8 doesn't count
  assert.equal(progress('water4'), 3);
  assert.equal(progress('afternoon'), 1);
  assert.equal(progress('five'), 4);
  assert.equal(progress('halfByNoon'), 0); // 350 + 171 + 280 < 1,150
  // Progress is capped at the target and ignores other days.
  const waterDay = keys.find((k) => challengeFor(k).id === 'water4')!;
  const d = Number(waterDay.slice(8));
  const glasses = [8, 10, 12, 14, 16, 18].map((h): Entry => ({ id: `g${h}`, type: 'Water', ml: 250, at: at(d, h) }));
  assert.deepEqual(challengeProgress([...glasses, { id: 'x', type: 'Water', ml: 250, at: at(d - 1, 9) }], waterDay, 2300).done, 4);
  assert.equal(challengeProgress(glasses.slice(0, 1), waterDay, 2300).done, 1);
});

test('drinks list: order is repaired, hidden drinks leave Home, never empty', () => {
  assert.deepEqual(drinkOrder(['Beer', 'Water', 'Bogus', 'Beer']).slice(0, 3), ['Beer', 'Water', 'ThaiTea']);
  assert.equal(drinkOrder([]).length, 8);
  assert.deepEqual(homeDrinks(['Coffee', 'Water'], ['Water', 'Liquor']).slice(0, 2), ['Coffee', 'ThaiTea']);
  assert.ok(!homeDrinks([], ['Liquor']).includes('Liquor'));
  const all = drinkOrder([]);
  assert.deepEqual(homeDrinks([], all), ['Water']);
  assert.deepEqual(moveDrink(['Water', 'Coffee', 'Beer'], 'Beer', -1), ['Water', 'Beer', 'Coffee']);
  assert.deepEqual(moveDrink(['Water', 'Coffee'], 'Water', -1), ['Water', 'Coffee']);
});

test('day index: cached per entries array, fresh after a change, fast on a year of data', () => {
  const day: Entry[] = [{ id: 'a', type: 'Water', ml: 350, at: at(24, 9) }];
  assert.equal(dayTotals(day, '2026-10-24').hydration, 350);
  const more = [...day, { id: 'b', type: 'Water', ml: 250, at: at(24, 11) } as Entry];
  assert.equal(dayTotals(more, '2026-10-24').hydration, 600);
  assert.equal(dayTotals(day, '2026-10-24').hydration, 350);
  assert.deepEqual(entriesOn(more, '2026-10-24').map((e) => e.id), ['b', 'a']);
  // 365 days × 10 entries: a month of calendar cells plus the streak stay well under a frame budget.
  const year: Entry[] = [];
  for (let d = 0; d < 365; d++) for (let h = 8; h < 18; h++) year.push({ id: `${d}-${h}`, type: 'Water', ml: 250, at: new Date(2026, 0, 1 + d, h).getTime() });
  const t0 = performance.now();
  for (let d = 1; d <= 31; d++) dayTotals(year, dayKey(new Date(2026, 9, d)));
  assert.equal(streak(year, () => 2300, new Date(2026, 11, 31, 20).getTime()), 365);
  assert.ok(performance.now() - t0 < 200, `took ${performance.now() - t0} ms`);
});
