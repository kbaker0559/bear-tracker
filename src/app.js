const { useEffect, useMemo, useState } = React;
const course = window.BEAR_COURSE;
const defaultPlayers = window.BEAR_PLAYERS;
const S = window.BearScoring;
const STORAGE_KEY = 'bear-tracker-v02-state';

function slugify(name){return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || `player-${Date.now()}`;}
function seedScores(players){const scores={}; players.forEach(p=>scores[p.id]={}); return scores;}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY));}catch{return null;}}
function saveState(state){localStorage.setItem(STORAGE_KEY, JSON.stringify(state));}
function nextPin(players){const pins=players.map(p=>Number(p.pin)).filter(Boolean); return String(Math.max(1024,...pins)+1);}

function App(){
  const saved = loadState();
  const [players,setPlayers] = useState(saved?.players || defaultPlayers);
  const [scores,setScores] = useState(saved?.scores || seedScores(defaultPlayers));
  const [tab,setTab] = useState('home');
  const [hole,setHole] = useState(1);
  const [group,setGroup] = useState(saved?.group || defaultPlayers.slice(0,4).map(p=>p.id));
  const [currentUser,setCurrentUser] = useState(saved?.currentUser || null);
  const activePlayers = players.filter(p=>p.active !== false);
  const leaders = useMemo(()=>S.leaderboard(activePlayers,scores,course),[activePlayers,scores]);
  const skins = useMemo(()=>S.netSkins(activePlayers,scores,course),[activePlayers,scores]);
  useEffect(()=>saveState({players,scores,group,currentUser}),[players,scores,group,currentUser]);
  function logout(){setCurrentUser(null); setTab('home');}
  if(!currentUser) return <Login players={players} onLogin={setCurrentUser}/>;
  const user = players.find(p=>p.id===currentUser) || {name:'Guest'};
  return <>
    <header><div className="topbar"><div><h1>Bear Tracker</h1><p>Black Bear Saturday Game · v0.2 Player/Admin Management</p></div><div className="userbox"><b>{user.name}</b><br/><span className="muted">{user.admin?'Admin':'Player'}</span> <button className="btn light" onClick={logout}>Log out</button></div></div></header>
    <nav className="tabs">{['home','score','leaderboard','skins','admin'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</nav>
    <main>
      {tab==='home' && <Home players={activePlayers} leaders={leaders} skins={skins}/>} 
      {tab==='score' && <Score hole={hole} setHole={setHole} course={course} players={players} group={group} scores={scores} setScores={setScores}/>} 
      {tab==='leaderboard' && <Leaderboard leaders={leaders}/>} 
      {tab==='skins' && <Skins skins={skins}/>} 
      {tab==='admin' && (user.admin ? <Admin players={players} setPlayers={setPlayers} scores={scores} setScores={setScores} group={group} setGroup={setGroup}/> : <div className="card"><h2>Admin</h2><p className="danger-text">Admin access required.</p></div>)} 
    </main>
  </>;
}

function Login({players,onLogin}){
  const [playerId,setPlayerId]=useState(players.find(p=>p.admin)?.id || players[0]?.id);
  const [pin,setPin]=useState('');
  const [err,setErr]=useState('');
  const player=players.find(p=>p.id===playerId);
  function submit(e){e.preventDefault(); if(player && String(player.pin)===String(pin)){onLogin(player.id);} else setErr('PIN does not match. Kevin Baker demo admin PIN is 1234.');}
  return <div className="login"><form className="login-card" onSubmit={submit}><h1>Bear Tracker</h1><p>Saturday quota scoring for Black Bear.</p><div className="notice">Demo login is active. Select <b>Kevin Baker</b> and use PIN <b>1234</b> for admin.</div><div className="field"><label>Player</label><select value={playerId} onChange={e=>setPlayerId(e.target.value)}>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="field"><label>4-digit PIN</label><input inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} placeholder="1234" autoFocus/></div>{err && <p className="danger-text">{err}</p>}<button className="btn" type="submit">Log in</button></form></div>;
}

function Home({players,leaders,skins}){const leader=leaders[0]; const awarded=skins.filter(s=>s.winner).length; return <div className="grid cards"><div className="card"><h2>Saturday Round</h2><p className="muted">Course</p><div className="stat">Black Bear</div><p>{players.length} active players</p></div><div className="card"><h2>Current Leader</h2><div className={leader?.plusMinus>=0?'positive stat':'negative stat'}>{leader ? `${leader.plusMinus>0?'+':''}${leader.plusMinus}` : '-'}</div><p>{leader?.player.name}</p></div><div className="card"><h2>Skins</h2><div className="stat">{awarded}</div><p>Awarded so far</p></div><div className="card"><h2>v0.2 Complete</h2><p>PIN login, add/edit players, active list, and local save are now working. Next: drag-and-drop group assignment.</p></div></div>}

function Score({hole,setHole,course,players,group,scores,setScores}){const activeHole=course.holes.find(h=>h.hole===hole); const groupPlayers=players.filter(p=>group.includes(p.id)); const options=[2,3,4,5,6,7,8,9]; function setScore(playerId,h,gross){setScores(prev=>({...prev,[playerId]:{...(prev[playerId]||{}),[h]:gross}}));} return <div className="card"><h2>Group Scorer · Hole {hole}</h2><p><span className="pill">Par {activeHole.par}</span><span className="pill">Stroke {activeHole.strokeIndex}</span></p>{groupPlayers.map(p=><div className="score-row" key={p.id}><span><b>{p.name}</b> <span className="muted">HDCP {p.handicap} · Quota {p.quota}</span></span>{options.map(o=><button key={o} className={scores[p.id]?.[hole]===o?'sel':''} onClick={()=>setScore(p.id,hole,o)}>{o}</button>)}</div>)}<div className="button-row"><button className="btn secondary" onClick={()=>setHole(Math.max(1,hole-1))}>Previous</button><button className="btn" onClick={()=>setHole(Math.min(18,hole+1))}>Save Hole / Next</button></div></div>}

function Leaderboard({leaders}){return <div className="card"><h2>Quota Leaderboard</h2><div className="table-wrap"><table className="table"><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Gross</th><th>Net</th></tr></thead><tbody>{leaders.map((r,i)=><tr key={r.player.id}><td>{i+1}</td><td>{r.player.name}</td><td>{r.thru}</td><td>{r.points}</td><td>{r.player.quota}</td><td className={r.plusMinus>=0?'positive':'negative'}>{r.plusMinus>0?'+':''}{r.plusMinus}</td><td>{r.gross||''}</td><td>{r.net||''}</td></tr>)}</tbody></table></div></div>}
function Skins({skins}){return <div className="card"><h2>Net Skins</h2><div className="table-wrap"><table className="table"><thead><tr><th>Hole</th><th>Status</th><th>Net</th></tr></thead><tbody>{skins.map(s=><tr key={s.hole}><td>{s.hole}</td><td>{s.winner ? `Skin: ${s.winner}` : s.status}</td><td>{s.net ?? ''}</td></tr>)}</tbody></table></div></div>}

function Admin({players,setPlayers,scores,setScores,group,setGroup}){
  const [draft,setDraft]=useState({name:'',handicap:10,quota:20,pin:nextPin(players)});
  function updatePlayer(id,field,value){setPlayers(prev=>prev.map(p=>p.id===id?{...p,[field]: field==='name'||field==='pin'?value:Number(value)}:p));}
  function addPlayer(e){e.preventDefault(); if(!draft.name.trim()) return; const id=slugify(draft.name); const uniqueId=players.some(p=>p.id===id)?`${id}-${Date.now()}`:id; const p={id:uniqueId,name:draft.name.trim(),handicap:Number(draft.handicap)||0,quota:Number(draft.quota)||0,pin:String(draft.pin||nextPin(players)),active:true}; setPlayers(prev=>[...prev,p]); setScores(prev=>({...prev,[p.id]:{}})); setDraft({name:'',handicap:10,quota:20,pin:String(Number(p.pin)+1)});}
  function resetDemo(){if(confirm('Reset all Bear Tracker demo data on this browser?')){localStorage.removeItem(STORAGE_KEY); location.reload();}}
  return <div className="grid"><div className="card"><h2>Admin · Player Management</h2><p>This version saves changes to this browser using localStorage. Live shared database comes in a later build.</p><div className="button-row"><button className="btn danger" onClick={resetDemo}>Reset Demo Data</button></div></div><div className="card"><h3>Add Golfer</h3><form className="form-grid" onSubmit={addPlayer}><div className="field"><label>Name</label><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></div><div className="field"><label>HDCP</label><input type="number" value={draft.handicap} onChange={e=>setDraft({...draft,handicap:e.target.value})}/></div><div className="field"><label>Quota</label><input type="number" value={draft.quota} onChange={e=>setDraft({...draft,quota:e.target.value})}/></div><div className="field"><label>PIN</label><input value={draft.pin} onChange={e=>setDraft({...draft,pin:e.target.value})}/></div><button className="btn" type="submit">Add Golfer</button></form></div><div className="grid two"><div className="card"><h3>Group 1 Demo</h3><p className="muted">Temporary checkbox setup; drag-and-drop is v0.3.</p>{players.filter(p=>p.active!==false).map(p=><label className="group-member" key={p.id}><input type="checkbox" checked={group.includes(p.id)} onChange={e=>setGroup(e.target.checked?[...group,p.id]:group.filter(id=>id!==p.id))}/> {p.name}</label>)}</div><div className="card"><h3>Players</h3><div className="table-wrap"><table className="table"><thead><tr><th>Active</th><th>Player</th><th>HDCP</th><th>Quota</th><th>PIN</th><th>Admin</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td><input type="checkbox" checked={p.active!==false} onChange={e=>updatePlayer(p.id,'active',e.target.checked)}/></td><td><input value={p.name} onChange={e=>updatePlayer(p.id,'name',e.target.value)}/></td><td><input type="number" value={p.handicap} onChange={e=>updatePlayer(p.id,'handicap',e.target.value)}/></td><td><input type="number" value={p.quota} onChange={e=>updatePlayer(p.id,'quota',e.target.value)}/></td><td><input value={p.pin} onChange={e=>updatePlayer(p.id,'pin',e.target.value)}/></td><td>{p.admin?'Yes':''}</td></tr>)}</tbody></table></div></div></div></div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
