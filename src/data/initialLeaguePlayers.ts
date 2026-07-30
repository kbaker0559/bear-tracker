import { initialPlayers } from './players';
import type { LeaguePlayer } from '../types/leaguePlayer';

function splitPlayerName(
  name: string
): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: ''
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

export const initialLeaguePlayers: LeaguePlayer[] =
  initialPlayers.map((player) => {
    const { firstName, lastName } =
      splitPlayerName(player.name);

    return {
      id: player.id,
      firstName,
      lastName,
      active: player.active,
      aliases: []
    };
  });