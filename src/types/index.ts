export type Player={id:string;name:string;handicap:number;quota:number;pin:string;active:boolean;isAdmin?:boolean;isGuest?:boolean};
export type Hole={number:number;par:number;strokeIndex:number};
export type ScoreMap=Record<string,Record<number,number>>;
export type Group={id:string;name:string;playerIds:string[];scorekeeperIds:string[]};
export type LeaderboardRow={player:Player;gross:number;net:number;points:number;quotaPlusMinus:number;thru:number;projected:number};
export type SkinResult={hole:number;winnerId:string|null;winningNet:number|null;status:'pending'|'skin'|'no-skin'};
export type PayoutResult={playerId:string;place:number;amount:number;placesCovered:number[]};
