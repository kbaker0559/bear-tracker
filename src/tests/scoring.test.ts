import { describe, expect, it } from 'vitest';
import { stablefordPoints, strokesReceivedOnHole, netScore, leaderboard } from '../engine/scoring';
import { calculateNetSkins } from '../engine/skins';
import { nextQuota } from '../engine/quota';
import { calculatePlacePayouts } from '../engine/payouts';
import { blackBearHoles } from '../data/course';
import type { Player, Score } from '../types/domain';

const players: Player[] = [
  { id: 'a', name: 'A', handicap: 12, quota: 19, pin: '1111', active: true },
  { id: 'b', name: 'B', handicap: 5, quota: 30, pin: '2222', active: true },
  { id: 'c', name: 'C', handicap: 10, quota: 20, pin: '3333', active: true }
];

describe('scoring engine', () => {
  it('calculates strokes received by stroke index', () => {
    expect(strokesReceivedOnHole(12, 5)).toBe(1);
    expect(strokesReceivedOnHole(12, 13)).toBe(0);
    expect(strokesReceivedOnHole(19, 1)).toBe(2);
  });

  it('calculates net scores', () => {
    expect(netScore(5, 12, 5)).toBe(4);
    expect(netScore(5, 12, 13)).toBe(5);
  });

  it('calculates Stableford points by net score', () => {
    expect(stablefordPoints(6, 4)).toBe(0);
    expect(stablefordPoints(5, 4)).toBe(1);
    expect(stablefordPoints(4, 4)).toBe(2);
    expect(stablefordPoints(3, 4)).toBe(4);
    expect(stablefordPoints(2, 4)).toBe(6);
    expect(stablefordPoints(1, 4)).toBe(8);
  });

  it('sorts leaderboard by quota plus/minus', () => {
    const scores: Score[] = [
      { playerId: 'a', holeNumber: 1, gross: 4 },
      { playerId: 'b', holeNumber: 1, gross: 4 },
      { playerId: 'c', holeNumber: 1, gross: 6 }
    ];
    const board = leaderboard(players, blackBearHoles, scores);
    expect(board[0].player.id).toBe('a');
  });
});

describe('skins engine', () => {
  it('awards lowest unique net score', () => {
    const skins = calculateNetSkins(players, [blackBearHoles[0]], [
      { playerId: 'a', holeNumber: 1, gross: 5 },
      { playerId: 'b', holeNumber: 1, gross: 4 },
      { playerId: 'c', holeNumber: 1, gross: 5 }
    ]);
    expect(skins[0].winnerPlayerId).toBe('b');
  });

  it('cancels skin on tie', () => {
    const skins = calculateNetSkins(players, [blackBearHoles[0]], [
      { playerId: 'a', holeNumber: 1, gross: 5 },
      { playerId: 'c', holeNumber: 1, gross: 5 }
    ]);
    expect(skins[0].winnerPlayerId).toBeNull();
    expect(skins[0].tiedPlayerIds).toEqual(['a', 'c']);
  });
});

describe('quota engine', () => {
  it('does not increase quota for non-cashing positive result', () => {
    expect(nextQuota(19, 3, false)).toBe(19);
  });

  it('increases quota for cashing positive result and decreases for negative result', () => {
    expect(nextQuota(19, 3, true)).toBe(21);
    expect(nextQuota(19, -7, false)).toBe(16);
  });
});

describe('payout engine', () => {
  it('splits tied places and rounds down', () => {
    const board = [
      { player: players[0], holesPlayed: 18, grossTotal: 80, netTotal: 68, stablefordPoints: 25, quotaPlusMinus: 6 },
      { player: players[1], holesPlayed: 18, grossTotal: 78, netTotal: 73, stablefordPoints: 34, quotaPlusMinus: 4 },
      { player: players[2], holesPlayed: 18, grossTotal: 82, netTotal: 72, stablefordPoints: 24, quotaPlusMinus: 4 }
    ];
    const payouts = calculatePlacePayouts(board, [
      { place: 1, amount: 50 },
      { place: 2, amount: 30 },
      { place: 3, amount: 20 }
    ]);
    expect(payouts.find(p => p.playerId === 'a')?.placePayout).toBe(50);
    expect(payouts.find(p => p.playerId === 'b')?.placePayout).toBe(25);
    expect(payouts.find(p => p.playerId === 'c')?.placePayout).toBe(25);
  });
});
