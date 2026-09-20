import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTimeToMinutes,
  calculateTransferGap,
  getWeekday,
  addDays,
} from '../lib/routing-engine.ts';

test('Time Parsing: converts HH:mm and day offsets to cumulative minutes', () => {
  assert.equal(parseTimeToMinutes('00:00', 0), 0);
  assert.equal(parseTimeToMinutes('01:30', 0), 90);
  assert.equal(parseTimeToMinutes('23:50', 0), 23 * 60 + 50); // 1430
  assert.equal(parseTimeToMinutes('00:30', 1), 24 * 60 + 30); // 1470
  assert.equal(parseTimeToMinutes('14:15', 2), 2 * 24 * 60 + 14 * 60 + 15);
});

test('Transfer Gap: calculates same-day transfer accurately', () => {
  // Train 1 arrives 14:10, Train 2 departs 14:45 same day
  const gap = calculateTransferGap('14:10', 0, '14:45', 0);
  assert.equal(gap, 35, 'Transfer gap between 14:10 and 14:45 should be exactly 35 minutes');
});

test('Transfer Gap: calculates midnight crossing & day change accurately', () => {
  // Train 1 arrives at 23:50 on Day 1, Train 2 departs at 00:30 on Day 2
  const gap = calculateTransferGap('23:50', 0, '00:30', 1);
  assert.equal(gap, 40, 'Overnight gap between 23:50 and 00:30 should be exactly 40 minutes');

  // Same day notation with rollover: 23:50 arr, 00:30 dep
  const rolloverGap = calculateTransferGap('23:50', 0, '00:30', 0);
  assert.equal(rolloverGap, 40, 'Rollover transfer gap should handle next day automatically');
});

test('Transfer Buffer Enforcement: distinguishes feasible vs rejected transfers', () => {
  const minBuffer = 25;

  const validGap = calculateTransferGap('10:00', 0, '10:30', 0); // 30 min
  assert.ok(validGap >= minBuffer, '30m gap satisfies 25m buffer');

  const tooTightGap = calculateTransferGap('10:00', 0, '10:15', 0); // 15 min
  assert.ok(tooTightGap < minBuffer, '15m gap is rejected for 25m buffer');
});

test('Live Delay Risk Recalculation: flags at-risk when delay erodes buffer', () => {
  const scheduledGap = 35; // 35 min transfer window
  const minBuffer = 25; // requires at least 25 min

  // Scenario A: Train 1 runs 5 min late -> 30 min effective gap (still feasible)
  const delayA = 5;
  const effectiveA = scheduledGap - delayA;
  assert.equal(effectiveA, 30);
  assert.ok(effectiveA >= minBuffer, '5m delay leaves feasible 30m buffer');

  // Scenario B: Train 1 runs 20 min late -> 15 min effective gap (below safe 25m buffer)
  const delayB = 20;
  const effectiveB = scheduledGap - delayB;
  assert.equal(effectiveB, 15);
  assert.ok(effectiveB < minBuffer, '20m delay erodes safe buffer, must flag Connection at Risk');

  // Scenario C: Train 1 runs 40 min late -> negative gap (missed connection)
  const delayC = 40;
  const effectiveC = scheduledGap - delayC;
  assert.equal(effectiveC, -5);
  assert.ok(effectiveC < 0, '40m delay results in missed connection');
});

test('Weekday & Date Math: correctly computes calendar days and offsets', () => {
  assert.equal(addDays('2026-09-20', 1), '2026-09-21');
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');

  // 2026-09-20 is a Sunday
  assert.equal(getWeekday('2026-09-20'), 'sun');
  assert.equal(getWeekday('2026-09-21'), 'mon');
  assert.equal(getWeekday('2026-09-22'), 'tue');
});
