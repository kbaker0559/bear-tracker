import type { Hole, Player, Score, SkinResult } from '../types/domain';
import { netScore } from './scoring';

export function calculateNetSkins(players: Player[], holes: Hole[], scores: Score[]): SkinResult[] {
  return holes.map(hole => {
    const holeScores = scores.filter(score => score.holeNumber === hole.number);
    const netRows = holeScores.map(score => {
      const player = players.find(p => p.id === score.playerId);
      if (!player) return null;
      return {
        playerId: player.id,
        net: netScore(score.gross, player.handicap, hole.strokeIndex)
      };
    }).filter((row): row is { playerId: string; net: number } => row !== null);

    if (netRows.length === 0) {
      return { holeNumber: hole.number, winnerPlayerId: null, winningNetScore: null, tiedPlayerIds: [] };
    }

    const lowNet = Math.min(...netRows.map(row => row.net));
    const lowPlayers = netRows.filter(row => row.net === lowNet).map(row => row.playerId);

    return {
      holeNumber: hole.number,
      winnerPlayerId: lowPlayers.length === 1 ? lowPlayers[0] : null,
      winningNetScore: lowNet,
      tiedPlayerIds: lowPlayers.length > 1 ? lowPlayers : []
    };
  });
}
