import { describe, expect, it } from 'vitest';
import { stablefordPoints, strokesReceivedOnHole, quotaAdjustment } from './scoring';

describe('Bear Tracker scoring engine', () => {
  it('calculates strokes received from handicap and stroke index', () => {
    expect(strokesReceivedOnHole(12, 5)).toBe(1);
    expect(strokesReceivedOnHole(12, 13)).toBe(0);
    expect(strokesReceivedOnHole(19, 1)).toBe(2);
    expect(strokesReceivedOnHole(19, 18)).toBe(1);
  });

  it('uses Saturday Stableford values', () => {
    expect(stablefordPoints(1, 4)).toBe(8);
    expect(stablefordPoints(2, 4)).toBe(6);
    expect(stablefordPoints(3, 4)).toBe(4);
    expect(stablefordPoints(4, 4)).toBe(2);
    expect(stablefordPoints(5, 4)).toBe(1);
    expect(stablefordPoints(6, 4)).toBe(0);
  });

  it('does not increase quota for plus scores outside the money', () => {
    expect(quotaAdjustment(3, false)).toBe(0);
    expect(quotaAdjustment(3, true)).toBe(2);
  });

  it('decreases quota even when player is not in the money', () => {
    expect(quotaAdjustment(-7, false)).toBe(-3);
  });
});
