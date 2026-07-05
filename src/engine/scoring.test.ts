import { describe, expect, it } from 'vitest';
import { strokesOnHole, stablefordPoints, quotaChange, netSkins } from './scoring';
import { blackBearHoles } from '../data/course';
import { initialPlayers } from '../data/players';

describe('Bear Tracker scoring engine', () => {
  it('gives a 12 handicap player one stroke on handicap holes 1-12', () => {
    expect(strokesOnHole(12, 1)).toBe(1);
    expect(strokesOnHole(12, 12)).toBe(1);
    expect(strokesOnHole(12, 13)).toBe(0);
  });

  it('handles handicaps above 18', () => {
    expect(strokesOnHole(19, 1)).toBe(2);
    expect(strokesOnHole(19, 2)).toBe(1);
    expect(strokesOnHole(19, 18)).toBe(1);
  });

  it('calculates Stableford points from net score', () => {
    expect(stablefordPoints(4, 4)).toBe(2);
    expect(stablefordPoints(3, 4)).toBe(4);
    expect(stablefordPoints(2, 4)).toBe(6);
    expect(stablefordPoints(1, 4)).toBe(8);
    expect(stablefordPoints(5, 4)).toBe(1);
    expect(stablefordPoints(6, 4)).toBe(0);
  });

  it('does not increase quota for a positive player who did not cash', () => {
    expect(quotaChange(3, false)).toBe(0);
  });

  it('increases quota for a positive player who cashed', () => {
    expect(quotaChange(3, true)).toBe(2);
    expect(quotaChange(11, true)).toBe(6);
  });

  it('finds lowest unique net skin', () => {
    const players = initialPlayers.slice(0, 2);
    const scores = [{ playerId: players[0].id, holeNumber: 1, gross: 4 }, { playerId: players[1].id, holeNumber: 1, gross: 5 }];
    const result = netSkins(players, blackBearHoles, scores).find(r => r.holeNumber === 1)!;
    expect(result.winnerId).toBe(players[0].id);
  });
});
