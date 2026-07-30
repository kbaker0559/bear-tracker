import { initialLeaguePlayers } from '../data/initialLeaguePlayers';
import {
  loadLeaguePlayers,
  saveLeaguePlayers
} from './leaguePlayerStore';
import type { LeaguePlayer } from '../types/leaguePlayer';

function isValidLeaguePlayer(
  value: unknown
): value is LeaguePlayer {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const player =
    value as Partial<LeaguePlayer>;

  return (
    typeof player.id === 'string' &&
    typeof player.firstName === 'string' &&
    typeof player.lastName === 'string' &&
    typeof player.active === 'boolean' &&
    Array.isArray(player.aliases)
  );
}

export function ensureLeaguePlayersExist(): void {
  const players = loadLeaguePlayers();

  if (
    players &&
    players.every(isValidLeaguePlayer)
  ) {
    return;
  }

  saveLeaguePlayers(initialLeaguePlayers);
}