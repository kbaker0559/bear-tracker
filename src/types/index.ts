export type Role = 'admin' | 'player';
export type Player = { id:string; name:string; handicap:number; quota:number; pin:string; active:boolean; role:Role; };
export type Hole = { number:number; par:number; strokeIndex:number };
export type ScoreMap = Record<string, Record<number, number | undefined>>;
export type PlayerRoundSummary = { player: Player; thru:number; gross:number; net:number; points:number; quota:number; plusMinus:number; projectedPlusMinus:number; };
export type SkinResult = { hole:number; winnerId?:string; winnerName?:string; netScore?:number; status:'pending'|'won'|'cancelled'; tiedPlayerNames?:string[]; };
export type Group = { id:string; name:string; playerIds:string[]; scorekeeperIds:string[]; };
