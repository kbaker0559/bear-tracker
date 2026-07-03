import { useMemo, useState } from 'react';
import { blackBearCourse } from './data/course';
import { initialPlayers } from './data/players';
import type { Score } from './types';
import { calculateResults, calculateSkins, strokesOnHole } from './lib/scoring';
import './styles.css';

export default function App() {
  const [scores, setScores] = useState<Score[]>([]);
  const players = initialPlayers;
  const group = players.slice(0,4);
  const [hole, setHole] = useState(1);
  const results = useMemo(()=>calculateResults(players, blackBearCourse, scores), [scores]);
  const skins = useMemo(()=>calculateSkins(players, blackBearCourse, scores), [scores]);
  const currentHole = blackBearCourse.find(h=>h.hole===hole)!;
  function saveScore(playerId: string, gross: number) {
    setScores(prev => [...prev.filter(s => !(s.playerId===playerId && s.hole===hole)), {playerId, hole, gross}]);
  }
  return <div className="app">
    <header><h1>Bear Tracker</h1><p>Real implementation foundation · Black Bear Saturday Game</p></header>
    <main className="grid">
      <section className="card"><h2>Group Scoring</h2><h3>Hole {hole} · Par {currentHole.par}</h3>
        <div className="scoreRows">{group.map(p=>{
          const strokes = strokesOnHole(p.handicap,currentHole.strokeIndex);
          const existing = scores.find(s=>s.playerId===p.id&&s.hole===hole)?.gross;
          return <div className="scoreRow" key={p.id}><div><b>{p.name}</b><span>Gets {strokes} stroke{strokes!==1?'s':''}</span></div><div className="buttons">{[2,3,4,5,6,7,8,9].map(n=><button className={existing===n?'selected':''} onClick={()=>saveScore(p.id,n)} key={n}>{n}</button>)}</div></div>
        })}</div><div className="nav"><button disabled={hole===1} onClick={()=>setHole(h=>h-1)}>Previous</button><button disabled={hole===18} onClick={()=>setHole(h=>h+1)}>Next Hole</button></div></section>
      <section className="card"><h2>Live Leaderboard</h2><table><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th></tr></thead><tbody>{results.map((r,i)=><tr key={r.player.id}><td>{i+1}</td><td>{r.player.name}</td><td>{r.thru}</td><td>{r.points}</td><td>{r.player.quota}</td><td className={r.quotaDiff>=0?'good':'bad'}>{r.quotaDiff>0?'+':''}{r.quotaDiff}</td></tr>)}</tbody></table></section>
      <section className="card"><h2>Net Skins</h2><div className="skins">{skins.map(s=><div key={s.hole}><b>#{s.hole}</b> {s.status==='pending'?'Pending':s.status==='no-skin'?'No skin':players.find(p=>p.id===s.winnerId)?.name}</div>)}</div></section>
      <section className="card"><h2>Next Build</h2><p>This is the real code foundation: React + TypeScript with scoring functions separated from the UI.</p><p>Next: editable players, groups, and persistent storage.</p></section>
    </main>
  </div>
}
