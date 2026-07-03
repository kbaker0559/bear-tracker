import { useEffect, useMemo, useState } from 'react';
import { blackBearCourse } from './data/course';
import { initialPlayers } from './data/players';
import type { Player, Score, Session } from './types';
import { calculateResults, calculateSkins, strokesOnHole } from './lib/scoring';
import { loadJson, saveJson } from './lib/storage';
import { Login } from './components/Login';
import { PlayerAdmin } from './components/PlayerAdmin';
import './styles.css';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadJson('players', initialPlayers));
  const [scores, setScores] = useState<Score[]>(() => loadJson('scores', []));
  const [session, setSession] = useState<Session>(() => loadJson('session', null));
  const [tab, setTab] = useState<'scoring' | 'leaderboard' | 'skins' | 'admin'>('scoring');
  const [hole, setHole] = useState(1);

  useEffect(()=>saveJson('players', players), [players]);
  useEffect(()=>saveJson('scores', scores), [scores]);
  useEffect(()=>saveJson('session', session), [session]);

  const activePlayers = players.filter(p => p.active);
  const group = activePlayers.slice(0,4);
  const results = useMemo(()=>calculateResults(players, blackBearCourse, scores), [players, scores]);
  const skins = useMemo(()=>calculateSkins(players, blackBearCourse, scores), [players, scores]);
  const currentHole = blackBearCourse.find(h=>h.hole===hole)!;
  const currentUser = session ? players.find(p=>p.id===session.playerId) : null;
  const canScore = !!session;
  const canAdmin = !!session?.isAdmin;

  function saveScore(playerId: string, gross: number) {
    if (!canScore) return alert('Sign in before entering scores.');
    setScores(prev => [...prev.filter(s => !(s.playerId===playerId && s.hole===hole)), {playerId, hole, gross}]);
  }

  function login(playerId: string, pin: string): boolean {
    const player = players.find(p => p.id === playerId && p.pin === pin);
    if (!player) return false;
    setSession({ playerId: player.id, isAdmin: !!player.isAdmin });
    return true;
  }

  function resetScores() {
    if (confirm('Clear all current-round scores on this device?')) setScores([]);
  }

  return <div className="app">
    <header><h1>Bear Tracker</h1><p>Real implementation v0.2 · Player/Admin Management</p><Login players={players} session={session} onLogin={login} onLogout={()=>setSession(null)} /></header>
    <nav className="tabs">
      <button className={tab==='scoring'?'active':''} onClick={()=>setTab('scoring')}>Group Scoring</button>
      <button className={tab==='leaderboard'?'active':''} onClick={()=>setTab('leaderboard')}>Leaderboard</button>
      <button className={tab==='skins'?'active':''} onClick={()=>setTab('skins')}>Skins</button>
      <button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>Admin</button>
    </nav>
    <main className="grid">
      {tab === 'scoring' && <section className="card full"><h2>Group Scoring</h2><p>{currentUser ? `Scorekeeper: ${currentUser.name}` : 'Sign in to enter scores.'}</p><h3>Hole {hole} · Par {currentHole.par} · Stroke Index {currentHole.strokeIndex}</h3>
        <div className="scoreRows">{group.map(p=>{
          const strokes = strokesOnHole(p.handicap,currentHole.strokeIndex);
          const existing = scores.find(s=>s.playerId===p.id&&s.hole===hole)?.gross;
          return <div className="scoreRow" key={p.id}><div><b>{p.name}</b><span>HDCP {p.handicap} · Quota {p.quota} · Gets {strokes} stroke{strokes!==1?'s':''}</span></div><div className="buttons">{[2,3,4,5,6,7,8,9,10].map(n=><button className={existing===n?'selected':''} onClick={()=>saveScore(p.id,n)} key={n}>{n}</button>)}</div></div>
        })}</div><div className="nav"><button disabled={hole===1} onClick={()=>setHole(h=>h-1)}>Previous</button><button disabled={hole===18} onClick={()=>setHole(h=>h+1)}>Next Hole</button><button onClick={resetScores}>Reset Scores</button></div></section>}
      {tab === 'leaderboard' && <section className="card full"><h2>Live Leaderboard</h2><table><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Gross</th><th>Net</th><th>Pts</th><th>Quota</th><th>+/-</th></tr></thead><tbody>{results.map((r,i)=><tr key={r.player.id}><td>{i+1}</td><td>{r.player.name}</td><td>{r.thru}</td><td>{r.gross || '-'}</td><td>{r.net || '-'}</td><td>{r.points}</td><td>{r.player.quota}</td><td className={r.quotaDiff>=0?'good':'bad'}>{r.quotaDiff>0?'+':''}{r.quotaDiff}</td></tr>)}</tbody></table></section>}
      {tab === 'skins' && <section className="card full"><h2>Net Skins</h2><div className="skins">{skins.map(s=><div key={s.hole}><b>#{s.hole}</b> {s.status==='pending'?'Pending':s.status==='no-skin'?'No skin':players.find(p=>p.id===s.winnerId)?.name} {s.netScore !== null && <span>Net {s.netScore}</span>}</div>)}</div></section>}
      {tab === 'admin' && (canAdmin ? <PlayerAdmin players={players} onChange={setPlayers} /> : <section className="card full"><h2>Admin</h2><p>Sign in as an admin to edit players. Kevin Baker has admin access in the seed data.</p></section>)}
    </main>
  </div>
}
