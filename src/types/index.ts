export type Hole = { hole: number; par: number; strokeIndex: number };
export type Player = { id: string; name: string; handicap: number; quota: number; active: boolean; pin: string; isAdmin?: boolean; isGuest?: boolean };
export type Score = { playerId: string; hole: number; gross: number };
export type Group = { id: string; name: string; playerIds: string[]; scorekeeperIds: string[] };
export type PlayerResult = { player: Player; gross: number; net: number; points: number; quotaDiff: number; thru: number; holesRemaining: number; projectedDiff: number };
export type SkinResult = { hole: number; winnerId: string | null; netScore: number | null; status: 'pending' | 'no-skin' | 'won' };
export type PlacePayout = { placeLabel: string; playerIds: string[]; amountEach: number; placesCovered: number[] };
export type PayoutSettings = { placePurse: number; skinValue: number };
export type QuotaPreview = { playerId: string; currentQuota: number; points: number; quotaDiff: number; inMoney: boolean; adjustment: number; nextQuota: number; placeMoney: number; skinMoney: number; totalMoney: number };
export type RoundPlayerHistory = { playerId: string; playerName: string; gross: number; net: number; points: number; quotaDiff: number; quotaBefore: number; quotaAfter: number; placeMoney: number; skinMoney: number; totalMoney: number };
export type RoundRecord = { id: string; date: string; label: string; playerCount: number; totalPlaceMoney: number; totalSkinMoney: number; players: RoundPlayerHistory[] };
export type Session = { playerId: string; isAdmin: boolean } | null;
export type HoleScoreDetail = { player: Player; gross: number | null; strokes: number; net: number | null; points: number | null; label: string; };

export type RoundSettings = { name: string; date: string; courseName: string; notes: string };
