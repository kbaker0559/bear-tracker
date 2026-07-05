export type Player = { id: string; name: string; handicap: number; quota: number; pin: string; active: boolean; isAdmin?: boolean };
export type Hole = { number: number; par: number; handicapRank: number };
export type Score = { playerId: string; holeNumber: number; gross: number };
export type PlayerRoundResult = { player: Player; grossTotal: number; netTotal: number; stablefordPoints: number; quotaDiff: number; holesPlayed: number };
export type SkinResult = { holeNumber: number; winnerId: string | null; winningNet: number | null; tied: boolean };
