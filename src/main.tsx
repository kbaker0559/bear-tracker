import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { holes, courseName } from './data/course';
import { defaultPlayers } from './data/players';
import { calculateSkins, leaderboard, netScore, stablefordPoints, quotaChange } from './engine/scoring';
import { loadJson, saveJson } from './utils/storage';
import type { Player, ScoreMap } from './types';
import './style.css';

type Tab = 'home'|'players'|'score'|'leaderboard'|'skins';
const PLAYER_KEY='bear-tracker.players.v2';
const SCORE_KEY='bear-tracker.scores.v2';

function App(){
  const [players,setPlayers]=useState<Player[]>(()=>loadJson(PLAYER_KEY, defaultPlayers));
  const [scores,setScores]=useState<ScoreMap>(()=>loadJson(SCORE_KEY, {}));
  const [session,setSession]=useState<Player|null>(null);
  const [pin,setPin]=useState('');
  const [tab,setTab]=useState<Tab>('home');
  const activePlayers=players.filter(p=>p.active);
  const board=useMemo(()=>leaderboard(players,holes,scores),[players,scores]);
  const skins=useMemo(()=>calculateSkins(players,holes,scores),[players,scores]);
  function persistPlayers(next:Player[]){ setPlayers(next); saveJson(PLAYER_KEY,next); }
  function persistScores(next:ScoreMap){ setScores(next); saveJson(SCORE_KEY,next); }
  function login(){ const p=players.find(x=>x.pin===pin.trim() && x.active); if(p){setSession(p); setPin(''); setTab('home');} else alert('PIN not found. Admin Kevin default PIN is 1006.'); }
  if(!session) return <div className="app"><header><h1>Bear Tracker</h1><p>{courseName} Saturday Quota Game</p></header><main className="login"><h2>Enter PIN</h2><input value={pin} onChange={e=>setPin(e.target.value)} placeholder="4-digit PIN" inputMode="numeric" autoFocus/><button onClick={login}>Log In</button><p className="muted">Default Kevin/admin PIN: 1006</p></main></div>;
  return <div className="app"><header><h1>Bear Tracker</h1><p>{session.name} · {session.role}</p></header><nav>{(['home','players','score','leaderboard','skins'] as Tab[]).filter(t=>t!=='players'||session.role==='admin').map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}<button onClick={()=>setSession(null)}>Log Out</button></nav><main>{tab==='home'&&<Home players={activePlayers.length} holesComplete={Object.values(scores).reduce((n,p)=>n+Object.values(p).filter(v=>typeof v==='number').length,0)} />}{tab==='players'&&<Players players={players} save={persistPlayers}/>} {tab==='score'&&<ScoreEntry players={session.role==='admin'?activePlayers:[session]} scores={scores} save={persistScores}/>} {tab==='leaderboard'&&<Leaderboard board={board}/>} {tab==='skins'&&<Skins skins={skins}/>}</main></div>;
}
function Home({players,holesComplete}:{players:number;holesComplete:number}){return <div className="grid"><section className="card"><h2>Saturday Round</h2><p><b>{players}</b> active players</p><p><b>{holesComplete}</b> scores entered</p><p>Next sprint: drag-and-drop groups and group scorekeeper workflow.</p></section><section className="card"><h2>Rules</h2><p>Net skins only. Ties cancel. Quota leaderboard sorts by Stableford points minus quota.</p></section></div>}
function Players({players,save}:{players:Player[];save:(p:Player[])=>void}){ const [draft,setDraft]=useState(players); function update(id:string, patch:Partial<Player>){setDraft(draft.map(p=>p.id===id?{...p,...patch}:p));} function add(){setDraft([...draft,{id:crypto.randomUUID(),name:'New Golfer',handicap:0,quota:0,pin:String(Math.floor(1000+Math.random()*9000)),active:true,role:'player'}]);} return <section className="card wide"><h2>Player Admin</h2><button onClick={add}>Add Golfer</button><div className="table">{draft.map(p=><div className="row" key={p.id}><input value={p.name} onChange={e=>update(p.id,{name:e.target.value})}/><label>HDCP <input type="number" value={p.handicap} onChange={e=>update(p.id,{handicap:+e.target.value})}/></label><label>Quota <input type="number" value={p.quota} onChange={e=>update(p.id,{quota:+e.target.value})}/></label><label>PIN <input value={p.pin} onChange={e=>update(p.id,{pin:e.target.value})}/></label><label><input type="checkbox" checked={p.active} onChange={e=>update(p.id,{active:e.target.checked})}/> Active</label><label><input type="checkbox" checked={p.role==='admin'} onChange={e=>update(p.id,{role:e.target.checked?'admin':'player'})}/> Admin</label></div>)}</div><button onClick={()=>save(draft)}>Save Player Changes</button></section>}
function ScoreEntry({players,scores,save}:{players:Player[];scores:ScoreMap;save:(s:ScoreMap)=>void}){ const [hole,setHole]=useState(1); const h=holes.find(x=>x.number===hole)!; function setScore(pid:string,gross:number){save({...scores,[pid]:{...(scores[pid]??{}),[hole]:gross}});} return <section className="card wide"><h2>Score Entry · Hole {hole}</h2><p>Par {h.par} · Hole Handicap {h.strokeIndex}</p><div className="score-grid">{players.map(p=>{const g=scores[p.id]?.[hole]; const n=typeof g==='number'?netScore(g,p.handicap,h):undefined; const pts=typeof n==='number'?stablefordPoints(n,h.par):undefined; return <div className="score-card" key={p.id}><h3>{p.name}</h3><div>{[2,3,4,5,6,7,8,9,10].map(x=><button key={x} className={g===x?'active':''} onClick={()=>setScore(p.id,x)}>{x}</button>)}</div><p>{typeof n==='number'?`Net ${n}, ${pts} pts`: 'No score'}</p></div>})}</div><div className="pager"><button disabled={hole===1} onClick={()=>setHole(hole-1)}>Previous</button><button disabled={hole===18} onClick={()=>setHole(hole+1)}>Next</button></div></section>}
function Leaderboard({board}:{board:ReturnType<typeof leaderboard>}){return <section className="card wide"><h2>Leaderboard</h2><table><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Proj.</th><th>Quota Change*</th></tr></thead><tbody>{board.map((b,i)=><tr key={b.player.id}><td>{i+1}</td><td>{b.player.name}</td><td>{b.thru}</td><td>{b.points}</td><td>{b.quota}</td><td>{b.plusMinus}</td><td>{b.projectedPlusMinus}</td><td>{quotaChange(b.plusMinus,i<5)}</td></tr>)}</tbody></table><p className="muted">*Preview assumes top 5 are in the money. Payout engine comes later.</p></section>}
function Skins({skins}:{skins:ReturnType<typeof calculateSkins>}){return <section className="card wide"><h2>Net Skins</h2><div className="skins">{skins.map(s=><div className="skin" key={s.hole}><b>Hole {s.hole}</b><p>{s.status==='won'?`${s.winnerName} net ${s.netScore}`:s.status==='cancelled'?`No skin: tied at net ${s.netScore}`:'Pending'}</p></div>)}</div></section>}

createRoot(document.getElementById('root')!).render(<App/>);
