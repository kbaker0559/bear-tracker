import { describe, expect, it } from 'vitest';
import { calculatePlacePayouts, paidPlaces } from '../engine/payouts';
import type { Player, PlayerRoundSummary } from '../types';

function summary(name: string, plusMinus: number): PlayerRoundSummary {
  const player: Player = { id: name, name, handicap: 0, quota: 0, pin: '0000', active: true, role: 'player' };
  return { player, thru: 18, gross: 0, net: 0, points: plusMinus, quota: 0, plusMinus, projectedPlusMinus: plusMinus };
}

describe('payout engine', () => {
  it('pays four places for 9 to 15 players', () => {
    expect(paidPlaces(8)).toBe(0);
    expect(paidPlaces(9)).toBe(4);
    expect(paidPlaces(15)).toBe(4);
  });

  it('pays five places for 16 or more players', () => {
    expect(paidPlaces(16)).toBe(5);
    expect(paidPlaces(28)).toBe(5);
  });

  it('splits a two-way tie for second across second and third money and rounds down', () => {
    const board = [summary('A', 5), summary('B', 4), summary('C', 4), summary('D', 2), summary('E', 1), summary('F', 0), summary('G', -1), summary('H', -2), summary('I', -3)];
    const result = calculatePlacePayouts(board, [100, 70, 45, 25]);
    const b = result.payouts.find(p => p.playerName === 'B')!;
    const c = result.payouts.find(p => p.playerName === 'C')!;
    expect(b.amount).toBe(57);
    expect(c.amount).toBe(57);
    expect(b.placeStart).toBe(2);
    expect(b.placeEnd).toBe(3);
  });

  it('splits fifth-place money among all players tied for fifth', () => {
    const board = [summary('A', 6), summary('B', 5), summary('C', 4), summary('D', 3), summary('E', 2), summary('F', 2), summary('G', 2), summary('H', 1), summary('I', 0), summary('J', -1), summary('K', -2), summary('L', -3), summary('M', -4), summary('N', -5), summary('O', -6), summary('P', -7)];
    const result = calculatePlacePayouts(board, [100, 80, 60, 40, 25]);
    expect(result.payouts.filter(p => p.amount === 8).map(p => p.playerName).sort()).toEqual(['E','F','G']);
  });
});
