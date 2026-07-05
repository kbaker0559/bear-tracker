import { describe, expect, it } from 'vitest';
import { quotaAdjustment, stablefordPoints, strokesOnHole } from './scoring';

describe('scoring engine', () => {
  it('gives a 12 handicap player strokes on handicap holes 1-12 only', () => {
    expect(strokesOnHole(12, 1)).toBe(1);
    expect(strokesOnHole(12, 12)).toBe(1);
    expect(strokesOnHole(12, 13)).toBe(0);
  });

  it('scores Stableford by net score vs par', () => {
    expect(stablefordPoints(4, 4)).toBe(2);
    expect(stablefordPoints(3, 4)).toBe(4);
    expect(stablefordPoints(5, 4)).toBe(1);
    expect(stablefordPoints(6, 4)).toBe(0);
  });

  it('does not increase quota for players outside the money', () => {
    expect(quotaAdjustment(3, false)).toBe(0);
    expect(quotaAdjustment(3, true)).toBe(2);
  });
});
