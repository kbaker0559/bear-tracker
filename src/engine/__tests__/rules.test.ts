import { describe, expect, it } from 'vitest';
import { stablefordPoints, strokesReceivedForHole } from '../scoring';
import { calculateNetSkins } from '../skins';
import { calculatePlacePayouts } from '../payouts';
import { quotaChangeAfterMoneyRule } from '../quota';
import type { HoleResult, LeaderboardRow } from '../../types/domain';

describe('Stableford scoring', () => {
  it('awards Saturday-game points', () => {
    expect(stablefordPoints(7, 4)).toBe(0); // double bogey or worse
    expect(stablefordPoints(5, 4)).toBe(1); // bogey
    expect(stablefordPoints(4, 4)).toBe(2); // par
    expect(stablefordPoints(3, 4)).toBe(4); // birdie
    expect(stablefordPoints(2, 4)).toBe(6); // eagle
    expect(stablefordPoints(1, 4)).toBe(8); // double eagle or better
  });
});

describe('Stroke allocation', () => {
  it('gives a 12 handicap strokes on holes ranked 1 through 12', () => {
    expect(strokesReceivedForHole(12, 1)).toBe(1);
    expect(strokesReceivedForHole(12, 12)).toBe(1);
    expect(strokesReceivedForHole(12, 13)).toBe(0);
  });

  it('supports handicaps above 18', () => {
    expect(strokesReceivedForHole(19, 1)).toBe(2);
    expect(strokesReceivedForHole(19, 2)).toBe(1);
  });
});

describe('Skins', () => {
  it('awards lowest unique net score', () => {
    const results: HoleResult[] = [
      { playerId: 'a', holeNumber: 1, gross: 4, strokesReceived: 1, net: 3, stablefordPoints: 4 },
      { playerId: 'b', holeNumber: 1, gross: 4, strokesReceived: 0, net: 4, stablefordPoints: 2 },
      { playerId: 'c', holeNumber: 1, gross: 5, strokesReceived: 0, net: 5, stablefordPoints: 1 }
    ];
    expect(calculateNetSkins(results)[0]).toMatchObject({ winnerPlayerId: 'a', winningNet: 3, tied: false });
  });

  it('cancels the skin on a tie', () => {
    const results: HoleResult[] = [
      { playerId: 'a', holeNumber: 1, gross: 4, strokesReceived: 1, net: 3, stablefordPoints: 4 },
      { playerId: 'b', holeNumber: 1, gross: 3, strokesReceived: 0, net: 3, stablefordPoints: 4 }
    ];
    expect(calculateNetSkins(results)[0]).toMatchObject({ winnerPlayerId: null, winningNet: 3, tied: true });
  });
});

describe('Payouts and quota increases', () => {
  const placeAmounts = [
    { place: 1, amount: 100 },
    { place: 2, amount: 80 },
    { place: 3, amount: 60 },
    { place: 4, amount: 40 },
    { place: 5, amount: 20 }
  ];

  it('splits a two-way tie for second across second and third money, rounded down', () => {
    const leaderboard: LeaderboardRow[] = [
      { playerId: 'a', name: 'A', quota: 20, holesPlayed: 18, stablefordPoints: 25, quotaDiff: 5 },
      { playerId: 'b', name: 'B', quota: 20, holesPlayed: 18, stablefordPoints: 23, quotaDiff: 3 },
      { playerId: 'c', name: 'C', quota: 20, holesPlayed: 18, stablefordPoints: 23, quotaDiff: 3 },
      { playerId: 'd', name: 'D', quota: 20, holesPlayed: 18, stablefordPoints: 21, quotaDiff: 1 }
    ];

    const payouts = calculatePlacePayouts(leaderboard, placeAmounts);
    expect(payouts.find((p) => p.playerId === 'b')?.amount).toBe(70);
    expect(payouts.find((p) => p.playerId === 'c')?.amount).toBe(70);
  });

  it('allows three players tied for fifth to split only fifth-place money', () => {
    const leaderboard: LeaderboardRow[] = [
      { playerId: 'a', name: 'A', quota: 20, holesPlayed: 18, stablefordPoints: 30, quotaDiff: 10 },
      { playerId: 'b', name: 'B', quota: 20, holesPlayed: 18, stablefordPoints: 29, quotaDiff: 9 },
      { playerId: 'c', name: 'C', quota: 20, holesPlayed: 18, stablefordPoints: 28, quotaDiff: 8 },
      { playerId: 'd', name: 'D', quota: 20, holesPlayed: 18, stablefordPoints: 27, quotaDiff: 7 },
      { playerId: 'e', name: 'E', quota: 20, holesPlayed: 18, stablefordPoints: 26, quotaDiff: 6 },
      { playerId: 'f', name: 'F', quota: 20, holesPlayed: 18, stablefordPoints: 26, quotaDiff: 6 },
      { playerId: 'g', name: 'G', quota: 20, holesPlayed: 18, stablefordPoints: 26, quotaDiff: 6 }
    ];

    const payouts = calculatePlacePayouts(leaderboard, placeAmounts);
    expect(payouts.find((p) => p.playerId === 'e')?.amount).toBe(6);
    expect(payouts.find((p) => p.playerId === 'f')?.amount).toBe(6);
    expect(payouts.find((p) => p.playerId === 'g')?.amount).toBe(6);
  });

  it('does not increase quota for positive score outside the money', () => {
    expect(quotaChangeAfterMoneyRule(3, false)).toBe(0);
    expect(quotaChangeAfterMoneyRule(3, true)).toBe(2);
  });

  it('still decreases quota for players below quota', () => {
    expect(quotaChangeAfterMoneyRule(-7, false)).toBe(-3);
  });
});
