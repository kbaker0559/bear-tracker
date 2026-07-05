import type { Hole, Player, PlayerStanding, ScoreEntry } from '../types/models';

export function strokesOnHole(playerHandicap: number, holeHandicapRank: number): number {
  if (playerHandicap <= 0) return 0;
  const fullCycles = Math.floor((playerHandicap - 1) / 18);
  const remainder = ((playerHandicap - 1) % 18) + 1;
  return fullCycles + (holeHandicapRank <= remainder ? 1 : 0);
}

export function netScore(gross: number, playerHandicap: number, holeHandicapRank: number): number {
  return gross - strokesOnHole(playerHandicap, holeHandicapRank);
}

export function stablefordPoints(net: number, par: number): number {
  const relationToPar = net - par;
  if (relationToPar <= -3) return 8;
  if (relationToPar === -2) return 6;
  if (relationToPar === -1) return 4;
  if (relationToPar === 0) return 2;
  if (relationToPar === 1) return 1;
  return 0;
}

export function calculateStandings(players: Player[], holes: Hole[], scores: ScoreEntry[]): PlayerStanding[] {
  const active = players.filter((p) => p.active);
  return active.map((player) => {
    const playerScores = scores.filter((s) => s.playerId === player.id);
    const totals = playerScores.reduce(
      (acc, score) => {
        const hole = holes.find((h) => h.number === score.hole);
        if (!hole) return acc;
        const net = netScore(score.gross, player.handicap, hole.handicapRank);
        acc.gross += score.gross;
        acc.net += net;
        acc.stableford += stablefordPoints(net, hole.par);
        acc.holesPlayed += 1;
        return acc;
      },
      { gross: 0, net: 0, stableford: 0, holesPlayed: 0 }
    );

    return {
      player,
      holesPlayed: totals.holesPlayed,
      gross: totals.gross,
      net: totals.net,
      stableford: totals.stableford,
      quotaPlusMinus: totals.stableford - player.quota,
    };
  }).sort((a, b) => b.quotaPlusMinus - a.quotaPlusMinus || b.stableford - a.stableford || a.player.name.localeCompare(b.player.name));
}

export interface SkinResult {
  hole: number;
  winnerId: string | null;
  winningNet: number | null;
  tied: boolean;
  pendingPlayers: number;
}

export function calculateNetSkins(players: Player[], holes: Hole[], scores: ScoreEntry[]): SkinResult[] {
  const active = players.filter((p) => p.active);
  return holes.map((hole) => {
    const holeScores = scores.filter((s) => s.hole === hole.number);
    const pendingPlayers = active.length - holeScores.length;
    const netByPlayer = holeScores.map((score) => {
      const player = active.find((p) => p.id === score.playerId);
      if (!player) return null;
      return { playerId: player.id, net: netScore(score.gross, player.handicap, hole.handicapRank) };
    }).filter(Boolean) as { playerId: string; net: number }[];

    if (netByPlayer.length === 0) return { hole: hole.number, winnerId: null, winningNet: null, tied: false, pendingPlayers };
    const bestNet = Math.min(...netByPlayer.map((n) => n.net));
    const bestPlayers = netByPlayer.filter((n) => n.net === bestNet);
    return {
      hole: hole.number,
      winnerId: bestPlayers.length === 1 && pendingPlayers === 0 ? bestPlayers[0].playerId : null,
      winningNet: bestNet,
      tied: bestPlayers.length > 1,
      pendingPlayers,
    };
  });
}

export function quotaAdjustment(result: number, cashed: boolean): number {
  if (result <= -10) return -4;
  if (result <= -6) return -3;
  if (result <= -3) return -2;
  if (result <= -1) return -1;
  if (result === 0) return 0;
  if (!cashed) return 0;
  if (result <= 2) return 1;
  if (result <= 4) return 2;
  if (result <= 6) return 3;
  if (result <= 9) return 4;
  return Math.ceil(result / 2);
}
