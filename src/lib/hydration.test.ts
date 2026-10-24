import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calcGoal,
  dayKey,
  dayTotals,
  DEFAULT_PROFILE,
  formatMl,
  hydrationOf,
  monthGrid,
  reminderTimes,
  streak,
  windowInsideWake,
  awakeMinutes,
  type Entry,
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
  assert.deepEqual(t, { hydration: 1460, total: 1550, caffeine: 95, count: 5 });
  const afterDelete = dayTotals(figmaDay.filter((e) => e.type !== 'Coffee'), '2026-10-24');
  assert.equal(afterDelete.hydration, 1300);
});

test('alcohol dehydrates and the day never goes below 0', () => {
  assert.equal(hydrationOf({ type: 'Beer', ml: 320 }), -128);
  assert.equal(hydrationOf({ type: 'Liquor', ml: 30 }), -90);
  const t = dayTotals([{ id: 'b', type: 'Liquor', ml: 60, at: at(24, 20) }], '2026-10-24');
  assert.equal(t.hydration, 0);
});

test('streak counts back from today, or yesterday if today not met yet', () => {
  const full = (d: number): Entry => ({ id: `d${d}`, type: 'Water', ml: 2300, at: at(d, 12) });
  const log = [full(21), full(22), full(23)];
  assert.equal(streak(log, 2300, at(24, 9)), 3);
  assert.equal(streak([...log, full(24)], 2300, at(24, 20)), 4);
  assert.equal(streak([full(21), full(23)], 2300, at(24, 9)), 1);
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
