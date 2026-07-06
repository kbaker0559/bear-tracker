export type Role = 'admin' | 'player';
export type Player = { id:string; name:string; handicap:number; quota:number; pin:string; active:boolean; role:Role; };
export type Hole = { number:number; par:number; strokeIndex:number };
export type ScoreMap = Record<string, Record<number, number | undefined>>;
export type PlayerRoundSummary = { player: Player; thru:number; gross:number; net:number; points:number; quota:number; plusMinus:number; projectedPlusMinus:number; };
export type SkinResult = { hole:number; winnerId?:string; winnerName?:string; netScore?:number; status:'pending'|'won'|'cancelled'; tiedPlayerNames?:string[]; };
export type Group = { id:string; name:string; playerIds:string[]; scorekeeperIds:string[]; };

export type PlacePayout = { playerId:string; playerName:string; placeStart:number; placeEnd:number; plusMinus:number; amount:number; inMoney:boolean };
export type PayoutResult = { placesPaid:number; payouts:PlacePayout[]; totalPaid:number };
export type FinalizedRound = { id:string; date:string; payouts:PlacePayout[]; quotaChanges:Record<string, number>; skinTotals:Record<string, number> };
