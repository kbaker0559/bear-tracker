export type Player = {
  id: string;
  name: string;
  handicap: number;
  quota: number;
  pin: string;
  active: boolean;
  isAdmin?: boolean;
};

export type Hole = {
  number: number;
  par: number;
  strokeIndex: number;
};

export type Score = {
  playerId: string;
  hole: number;
  gross: number;
};

export type Group = {
  id: string;
  name: string;
  playerIds: string[];
  scorekeeperIds: string[];
};

export type PlayerRoundResult = {
  player: Player;
  grossTotal: number;
  netTotal: number;
  stablefordPoints: number;
  quotaPlusMinus: number;
  thru: number;
};

export type SkinResult = {
  hole: number;
  winnerPlayerId: string | null;
  winningNetScore: number | null;
  tied: boolean;
};
