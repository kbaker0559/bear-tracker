export type Hole = { hole: number; par: number; strokeIndex: number };
export type Player = { id: string; name: string; handicap: number; quota: number; active: boolean; pin: string; isAdmin?: boolean };
export type Score = { playerId: string; hole: number; gross: number };
export type PlayerResult = { player: Player; gross: number; net: number; points: number; quotaDiff: number; thru: number };
export type SkinResult = { hole: number; winnerId: string | null; netScore: number | null; status: 'pending' | 'no-skin' | 'won' };
export type Session = { playerId: string; isAdmin: boolean } | null;
