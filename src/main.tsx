import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { holes, courseName } from './data/course';
import { defaultPlayers } from './data/players';
import { calculateSkins, leaderboard, netScore, stablefordPoints, quotaChange } from './engine/scoring';
import { calculatePlacePayouts, totalSkinsWonByPlayer } from './engine/payouts';
import { createDefaultGroups, groupsForScorekeeper, movePlayerToGroup, unassignedPlayers } from './engine/groups';
import { loadJson, saveJson } from './utils/storage';
import type { FinalizedRound, Group, Player, ScoreMap } from './types';
import './style.css';

type Tab = 'home'|'players'|'groups'|'score'|'leaderboard'|'skins'|'results'|'backup';
const PLAYER_KEY='bear-tracker.players.v3';
const SCORE_KEY='bear-tracker.scores.v3';
const GROUP_KEY='bear-tracker.groups.v3';
const PLACE_MONEY_KEY='bear-tracker.placeMoney.v4';
const HISTORY_KEY='bear-tracker.history.v4';

function App(){
  const [players,setPlayers]=useState<Player[]>(()=>loadJson(PLAYER_KEY, defaultPlayers));
  const [scores,setScores]=useState<ScoreMap>(()=>loadJson(SCORE_KEY, {}));
  const [groups,setGroups]=useState<Group[]>(()=>loadJson(GROUP_KEY, createDefaultGroups(defaultPlayers,4)));
  const [placeMoney,setPlaceMoney]=useState<number[]>(()=>loadJson(PLACE_MONEY_KEY, [100,75,50,35,25]));
  const [history,setHistory]=useState<FinalizedRound[]>(()=>loadJson(HISTORY_KEY, []));
  const [session,setSession]=useState<Player|null>(null);
  const [pin,setPin]=useState('');
  const [tab,setTab]=useState<Tab>('home');
  const activePlayers=players.filter(p=>p.active);
  const board=useMemo(()=>leaderboard(players,holes,scores),[players,scores]);
  const skins=useMemo(()=>calculateSkins(players,holes,scores),[players,scores]);
  const payouts=useMemo(()=>calculatePlacePayouts(board, placeMoney),[board,placeMoney]);
  function persistPlayers(next:Player[]){ setPlayers(next); saveJson(PLAYER_KEY,next); }
  function persistScores(next:ScoreMap){ setScores(next); saveJson(SCORE_KEY,next); }
  function persistGroups(next:Group[]){ setGroups(next); saveJson(GROUP_KEY,next); }
  function persistPlaceMoney(next:number[]){ setPlaceMoney(next); saveJson(PLACE_MONEY_KEY,next); }
  function finalizeRound(){
    if(!confirm('Finalize this round? This will update quotas for active players and clear today\'s scores.')) return;
    const inMoney = new Set(payouts.payouts.filter(p=>p.inMoney).map(p=>p.playerId));
    const changes:Record<string,number> = {};
    const nextPlayers = players.map(p=>{
      const summary = board.find(b=>b.player.id===p.id);
      if(!summary) return p;
      const change = quotaChange(summary.plusMinus, inMoney.has(p.id));
      changes[p.id]=change;
      return {...p, quota: Math.max(0, p.quota + change)};
    });
    const round:FinalizedRound = { id: crypto.randomUUID(), date: new Date().toISOString(), payouts: payouts.payouts, quotaChanges: changes, skinTotals: totalSkinsWonByPlayer(players.map(p=>p.id), skins) };
    const nextHistory=[round,...history];
    persistPlayers(nextPlayers);
    persistScores({});
    setHistory(nextHistory); saveJson(HISTORY_KEY,nextHistory);
    alert('Round finalized. Quotas updated and scores cleared.');
    setTab('results');
  }
  function login(){ const p=players.find(x=>x.pin===pin.trim() && x.active); if(p){setSession(p); setPin(''); setTab('home');} else alert('PIN not found. Admin Kevin default PIN is 1006.'); }
  if(!session) return <div className="app"><header><h1>Bear Tracker</h1><p>{courseName} Saturday Quota Game</p></header><main className="login"><h2>Enter PIN</h2><input value={pin} onChange={e=>setPin(e.target.value)} placeholder="4-digit PIN" inputMode="numeric" autoFocus/><button onClick={login}>Log In</button><p className="muted">Default Kevin/admin PIN: 1006</p></main></div>;
  const tabs:Tab[] = ['home', ...(session.role==='admin'?['players','groups'] as Tab[]:[]), 'score','leaderboard','skins','results','backup'];
  return <div className="app"><header><h1>Bear Tracker</h1><p>{session.name} · {session.role}</p></header><nav>{tabs.map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}<button onClick={()=>setSession(null)}>Log Out</button></nav><main>{tab==='home'&&<Home players={activePlayers.length} holesComplete={Object.values(scores).reduce((n,p)=>n+Object.values(p).filter(v=>typeof v==='number').length,0)} groups={groups.length} />}{tab==='players'&&<Players players={players} save={persistPlayers}/>} {tab==='groups'&&<Groups players={activePlayers} groups={groups} save={persistGroups}/>} {tab==='score'&&<ScoreEntry players={players} groups={groupsForScorekeeper(groups,session.id,session.role==='admin')} scores={scores} save={persistScores} isAdmin={session.role==='admin'}/>} {tab==='leaderboard'&&<Leaderboard board={board}/>} {tab==='skins'&&<Skins skins={skins}/>} {tab==='results'&&<Results board={board} payouts={payouts} placeMoney={placeMoney} savePlaceMoney={persistPlaceMoney} finalizeRound={finalizeRound} isAdmin={session.role==='admin'} history={history} players={players} skins={skins}/>} {tab==='backup'&&<Backup players={players} scores={scores} groups={groups} placeMoney={placeMoney} history={history} setPlayers={persistPlayers} setScores={persistScores} setGroups={persistGroups} setPlaceMoney={persistPlaceMoney} setHistory={(h)=>{setHistory(h); saveJson(HISTORY_KEY,h)}} board={board} payouts={payouts} skins={skins}/>}</main></div>;
}
function Home({players,holesComplete,groups}:{players:number;holesComplete:number;groups:number}){return <div className="grid"><section className="card"><h2>Saturday Round</h2><p><b>{players}</b> active players</p><p><b>{groups}</b> groups set up</p><p><b>{holesComplete}</b> scores entered</p><p>Sprint 4 adds payout preview, quota changes, and finalization.</p></section><section className="card"><h2>Rules</h2><p>Net skins only. Ties cancel. Quota leaderboard sorts by Stableford points minus quota.</p></section></div>}
function Players({players,save}:{players:Player[];save:(p:Player[])=>void}){ const [draft,setDraft]=useState(players); function update(id:string, patch:Partial<Player>){setDraft(draft.map(p=>p.id===id?{...p,...patch}:p));} function add(){setDraft([...draft,{id:crypto.randomUUID(),name:'New Golfer',handicap:0,quota:0,pin:String(Math.floor(1000+Math.random()*9000)),active:true,role:'player'}]);} return <section className="card wide"><h2>Player Admin</h2><button onClick={add}>Add Golfer</button><div className="table">{draft.map(p=><div className="row" key={p.id}><input value={p.name} onChange={e=>update(p.id,{name:e.target.value})}/><label>HDCP <input type="number" value={p.handicap} onChange={e=>update(p.id,{handicap:+e.target.value})}/></label><label>Quota <input type="number" value={p.quota} onChange={e=>update(p.id,{quota:+e.target.value})}/></label><label>PIN <input value={p.pin} onChange={e=>update(p.id,{pin:e.target.value})}/></label><label><input type="checkbox" checked={p.active} onChange={e=>update(p.id,{active:e.target.checked})}/> Active</label><label><input type="checkbox" checked={p.role==='admin'} onChange={e=>update(p.id,{role:e.target.checked?'admin':'player'})}/> Admin</label></div>)}</div><button onClick={()=>save(draft)}>Save Player Changes</button></section>}
function Groups({players,groups,save}:{players:Player[];groups:Group[];save:(g:Group[])=>void}){ const [draft,setDraft]=useState(groups); const byId=new Map(players.map(p=>[p.id,p])); const unassigned=unassignedPlayers(players,draft); function dropTo(target:string|'unassigned', playerId:string){setDraft(movePlayerToGroup(draft,playerId,target));} function addGroup(){setDraft([...draft,{id:crypto.randomUUID(),name:`Group ${draft.length+1}`,playerIds:[],scorekeeperIds:[]}]);} function removeGroup(id:string){setDraft(draft.filter(g=>g.id!==id));} function toggleScorekeeper(gid:string,pid:string){setDraft(draft.map(g=>g.id!==gid?g:{...g,scorekeeperIds:g.scorekeeperIds.includes(pid)?g.scorekeeperIds.filter(x=>x!==pid):[...g.scorekeeperIds,pid]}));} const chip=(p:Player)=><div className="chip" draggable onDragStart={e=>e.dataTransfer.setData('playerId',p.id)}>{p.name}</div>; return <section className="card wide"><h2>Group Assignment</h2><p className="muted">Drag players into threesomes/foursomes. Check one or more scorekeepers in each group.</p><button onClick={addGroup}>Add Group</button><div className="group-board"><div className="group-card unassigned" onDragOver={e=>e.preventDefault()} onDrop={e=>dropTo('unassigned',e.dataTransfer.getData('playerId'))}><h3>Unassigned</h3>{unassigned.map(chip)}</div>{draft.map(g=><div className="group-card" key={g.id} onDragOver={e=>e.preventDefault()} onDrop={e=>dropTo(g.id,e.dataTransfer.getData('playerId'))}><div className="group-title"><input value={g.name} onChange={e=>setDraft(draft.map(x=>x.id===g.id?{...x,name:e.target.value}:x))}/><button onClick={()=>removeGroup(g.id)}>Delete</button></div>{g.playerIds.map(id=>{const p=byId.get(id); if(!p) return null; return <div className="group-player" key={id}>{chip(p)}<label><input type="checkbox" checked={g.scorekeeperIds.includes(id)} onChange={()=>toggleScorekeeper(g.id,id)}/> Scorekeeper</label></div>})}</div>)}</div><button onClick={()=>save(draft)}>Save Groups</button></section>}
function ScoreEntry({players,groups,scores,save,isAdmin}:{players:Player[];groups:Group[];scores:ScoreMap;save:(s:ScoreMap)=>void;isAdmin:boolean}){ const [hole,setHole]=useState(1); const [groupId,setGroupId]=useState(groups[0]?.id??''); const group=groups.find(g=>g.id===groupId)??groups[0]; const h=holes.find(x=>x.number===hole)!; const byId=new Map(players.map(p=>[p.id,p])); const groupPlayers=(group?.playerIds??[]).map(id=>byId.get(id)).filter(Boolean) as Player[]; function setScore(pid:string,gross:number){save({...scores,[pid]:{...(scores[pid]??{}),[hole]:gross}});} if(!groups.length) return <section className="card"><h2>Score Entry</h2><p>No groups assigned to you yet.</p>{!isAdmin && <p className="muted">Ask the admin to make you a scorekeeper.</p>}</section>; return <section className="card wide"><h2>Group Score Entry · Hole {hole}</h2><label>Group <select value={group?.id??''} onChange={e=>setGroupId(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label><p>Par {h.par} · Hole Handicap {h.strokeIndex}</p><div className="score-grid">{groupPlayers.map(p=>{const g=scores[p.id]?.[hole]; const n=typeof g==='number'?netScore(g,p.handicap,h):undefined; const pts=typeof n==='number'?stablefordPoints(n,h.par):undefined; return <div className="score-card" key={p.id}><h3>{p.name}</h3><div>{[2,3,4,5,6,7,8,9,10].map(x=><button key={x} className={g===x?'active':''} onClick={()=>setScore(p.id,x)}>{x}</button>)}</div><p>{typeof n==='number'?`Net ${n}, ${pts} pts`: 'No score'}</p></div>})}</div><div className="pager"><button disabled={hole===1} onClick={()=>setHole(hole-1)}>Previous</button><button disabled={hole===18} onClick={()=>setHole(hole+1)}>Next</button></div></section>}
function Leaderboard({board}:{board:ReturnType<typeof leaderboard>}){return <section className="card wide"><h2>Leaderboard</h2><table><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Projected</th></tr></thead><tbody>{board.map((b,i)=><tr key={b.player.id}><td>{i+1}</td><td>{b.player.name}</td><td>{b.thru}</td><td>{b.points}</td><td>{b.quota}</td><td className={b.plusMinus>=0?'good':'bad'}>{b.plusMinus}</td><td>{b.projectedPlusMinus}</td></tr>)}</tbody></table></section>}
function Skins({skins}:{skins:ReturnType<typeof calculateSkins>}){return <section className="card wide"><h2>Net Skins</h2><div className="skins">{skins.map(s=><div className="skin" key={s.hole}><b>Hole {s.hole}</b><p>{s.status==='won'?`${s.winnerName} net ${s.netScore}`:s.status==='cancelled'?`No skin: tied at net ${s.netScore}`:'Pending'}</p></div>)}</div></section>}
createRoot(document.getElementById('root')!).render(<App/>);


function Backup({players,scores,groups,placeMoney,history,setPlayers,setScores,setGroups,setPlaceMoney,setHistory,board,payouts,skins}:{players:Player[];scores:ScoreMap;groups:Group[];placeMoney:number[];history:FinalizedRound[];setPlayers:(p:Player[])=>void;setScores:(s:ScoreMap)=>void;setGroups:(g:Group[])=>void;setPlaceMoney:(m:number[])=>void;setHistory:(h:FinalizedRound[])=>void;board:ReturnType<typeof leaderboard>;payouts:ReturnType<typeof calculatePlacePayouts>;skins:ReturnType<typeof calculateSkins>}){
  const [importText,setImportText]=useState('');
  const wonSkins = skins.filter(s=>s.status==='won');
  const report = [
    `Bear Tracker Results - ${new Date().toLocaleDateString()}`,
    '',
    'Leaderboard',
    ...board.map((b,i)=>`${i+1}. ${b.player.name} ${b.plusMinus>=0?'+':''}${b.plusMinus} (${b.points} pts / quota ${b.quota})`),
    '',
    'Place Payouts',
    ...payouts.payouts.map(p=>`${p.playerName}: $${p.amount} (${p.placeStart===p.placeEnd ? `${p.placeStart}` : `${p.placeStart}-${p.placeEnd}`})`),
    '',
    'Skins',
    ...(wonSkins.length ? wonSkins.map(s=>`Hole ${s.hole}: ${s.winnerName} net ${s.netScore}`) : ['No skins awarded yet.'])
  ].join('\n');
  function exportBackup(){
    const payload={version:5,exportedAt:new Date().toISOString(),players,scores,groups,placeMoney,history};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`bear-tracker-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  async function copyReport(){
    await navigator.clipboard.writeText(report);
    alert('Results copied to clipboard.');
  }
  function printReport(){
    const w=window.open('','','width=800,height=900');
    if(!w) return alert('Pop-up blocked. Copy the report instead.');
    w.document.write(`<pre style="font-family:Arial,sans-serif;font-size:16px;white-space:pre-wrap">${report.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c] as string))}</pre>`);
    w.document.close(); w.focus(); w.print();
  }
  function restore(){
    try{
      const payload=JSON.parse(importText);
      if(!payload.players || !payload.scores || !payload.groups) throw new Error('Missing required backup fields.');
      if(!confirm('Restore this backup? Current local Bear Tracker data on this device will be replaced.')) return;
      setPlayers(payload.players); setScores(payload.scores); setGroups(payload.groups); setPlaceMoney(payload.placeMoney??[100,75,50,35,25]); setHistory(payload.history??[]);
      alert('Backup restored.');
    }catch(err){ alert(`Restore failed: ${err instanceof Error ? err.message : 'Invalid backup JSON'}`); }
  }
  return <div className="grid"><section className="card wide"><h2>Backup & Restore</h2><p>Export a JSON backup before every Saturday round and immediately after finalizing results.</p><button onClick={exportBackup}>Download Backup</button><h3>Restore Backup</h3><textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Paste backup JSON here" rows={8}/><button className="danger" onClick={restore}>Restore From Pasted Backup</button></section><section className="card wide"><h2>Shareable Results Summary</h2><textarea readOnly value={report} rows={14}/><div className="pager"><button onClick={copyReport}>Copy Results</button><button onClick={printReport}>Print Results</button></div></section></div>
}

function Results({board,payouts,placeMoney,savePlaceMoney,finalizeRound,isAdmin,history,players,skins}:{board:ReturnType<typeof leaderboard>;payouts:ReturnType<typeof calculatePlacePayouts>;placeMoney:number[];savePlaceMoney:(m:number[])=>void;finalizeRound:()=>void;isAdmin:boolean;history:FinalizedRound[];players:Player[];skins:ReturnType<typeof calculateSkins>}){
  const inMoney = new Set(payouts.payouts.filter(p=>p.inMoney).map(p=>p.playerId));
  const byId = new Map(players.map(p=>[p.id,p]));
  const skinTotals = totalSkinsWonByPlayer(players.map(p=>p.id), skins);
  const skinRows = Object.entries(skinTotals).filter(([,count])=>count>0).map(([id,count])=>({name:byId.get(id)?.name??id,count}));
  function updateMoney(index:number, value:number){ const next=[...placeMoney]; next[index]=value; savePlaceMoney(next); }
  return <div className="grid"><section className="card wide"><h2>Payout Preview</h2><p><b>{payouts.placesPaid}</b> places paid based on active player count. Ties split the places involved and round down.</p>{isAdmin&&<div className="money-grid">{placeMoney.map((m,i)=><label key={i}>{i+1}{i===0?'st':i===1?'nd':i===2?'rd':'th'} <input type="number" value={m} onChange={e=>updateMoney(i,+e.target.value)}/></label>)}</div>}<table><thead><tr><th>Player</th><th>Place</th><th>+/-</th><th>Place $</th></tr></thead><tbody>{payouts.payouts.map(p=><tr key={p.playerId}><td>{p.playerName}</td><td>{p.placeStart===p.placeEnd?p.placeStart:`${p.placeStart}-${p.placeEnd}`}</td><td>{p.plusMinus}</td><td>${p.amount}</td></tr>)}</tbody></table><p><b>Total place money:</b> ${payouts.totalPaid}</p></section><section className="card wide"><h2>Quota Change Preview</h2><table><thead><tr><th>Player</th><th>+/-</th><th>In Money?</th><th>Change</th><th>Next Quota</th></tr></thead><tbody>{board.map(b=>{const change=quotaChange(b.plusMinus,inMoney.has(b.player.id)); return <tr key={b.player.id}><td>{b.player.name}</td><td>{b.plusMinus}</td><td>{inMoney.has(b.player.id)?'Yes':'No'}</td><td className={change>0?'bad':change<0?'good':''}>{change>0?`+${change}`:change}</td><td>{Math.max(0,b.player.quota+change)}</td></tr>})}</tbody></table>{isAdmin&&<button className="danger" onClick={finalizeRound}>Finalize Round & Update Quotas</button>}<p className="muted">Quota increases only apply to golfers who won place money. Quota decreases still apply outside the money.</p></section><section className="card"><h2>Skins Count</h2>{skinRows.length?skinRows.map(r=><p key={r.name}>{r.name}: <b>{r.count}</b></p>):<p>No skins won yet.</p>}</section><section className="card"><h2>Round Archive</h2>{history.length?<ul>{history.map(h=><li key={h.id}>{new Date(h.date).toLocaleString()} · ${h.payouts.reduce((s,p)=>s+p.amount,0)} paid</li>)}</ul>:<p>No finalized rounds yet.</p>}</section></div>
}
