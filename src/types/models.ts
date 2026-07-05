export type PlayerRole = 'admin' | 'scorekeeper' | 'player';

export interface Player {
  id: string;
  name: string;
  handicap: number;
  quota: number;
  pin: string;
  active: boolean;
  role: PlayerRole;
}

export interface Hole {
  number: number;
  par: number;
  handicapRank: number;
}

export interface ScoreEntry {
  playerId: string;
  hole: number;
  gross: number;
}

export interface PlayerStanding {
  player: Player;
  holesPlayed: number;
  gross: number;
  net: number;
  stableford: number;
  quotaPlusMinus: number;
}

export interface Group {
  id: string;
  name: string;
  playerIds: string[];
  scorekeeperIds: string[];
}
