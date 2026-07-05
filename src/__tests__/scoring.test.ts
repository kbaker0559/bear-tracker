import { describe, expect, it } from 'vitest';
import { holes } from '../data/course';
import { defaultPlayers } from '../data/players';
import { calculateSkins, netScore, quotaChange, stablefordPoints, strokesOnHole, leaderboard } from '../engine/scoring';

describe('Bear Tracker scoring engines',()=>{
  it('calculates handicap strokes correctly',()=>{ expect(strokesOnHole(12,1)).toBe(1); expect(strokesOnHole(12,13)).toBe(0); expect(strokesOnHole(19,1)).toBe(2); });
  it('calculates net score',()=>{ expect(netScore(5,12,holes[0])).toBe(4); });
  it('awards stableford points',()=>{ expect(stablefordPoints(4,4)).toBe(2); expect(stablefordPoints(3,4)).toBe(4); expect(stablefordPoints(6,4)).toBe(0); });
  it('calculates quota changes with in-money rule',()=>{ expect(quotaChange(3,false)).toBe(0); expect(quotaChange(3,true)).toBe(2); expect(quotaChange(-6,false)).toBe(-3); expect(quotaChange(11,true)).toBe(6); });
  it('sorts leaderboard by plus-minus',()=>{ const kevin=defaultPlayers.find(p=>p.name==='Kevin Baker')!; const cam=defaultPlayers.find(p=>p.name==='Cam Crollard')!; const scores={ [kevin.id]:{1:4}, [cam.id]:{1:4} }; const board=leaderboard([kevin,cam], holes, scores); expect(board[0].plusMinus).toBeGreaterThanOrEqual(board[1].plusMinus); });
  it('cancels tied net skin',()=>{ const p1={...defaultPlayers[0],handicap:0}; const p2={...defaultPlayers[1],handicap:0}; const skins=calculateSkins([p1,p2], [holes[0]], {[p1.id]:{1:4},[p2.id]:{1:4}}); expect(skins[0].status).toBe('cancelled'); });
  it('awards unique net skin',()=>{ const p1={...defaultPlayers[0],handicap:0}; const p2={...defaultPlayers[1],handicap:0}; const skins=calculateSkins([p1,p2], [holes[0]], {[p1.id]:{1:3},[p2.id]:{1:4}}); expect(skins[0].status).toBe('won'); expect(skins[0].winnerId).toBe(p1.id); });
});
