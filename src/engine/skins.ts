import type { HoleResult, SkinResult } from '../types/domain';

export function calculateNetSkins(results: HoleResult[]): SkinResult[] {
  const holes = [...new Set(results.map((r) => r.holeNumber))].sort((a, b) => a - b);
  return holes.map((holeNumber) => {
    const holeResults = results.filter((r) => r.holeNumber === holeNumber);
    if (holeResults.length === 0) {
      return { holeNumber, winnerPlayerId: null, winningNet: null, tied: false };
    }

    const lowestNet = Math.min(...holeResults.map((r) => r.net));
    const winners = holeResults.filter((r) => r.net === lowestNet);

    return {
      holeNumber,
      winnerPlayerId: winners.length === 1 ? winners[0].playerId : null,
      winningNet: lowestNet,
      tied: winners.length > 1
    };
  });
}
