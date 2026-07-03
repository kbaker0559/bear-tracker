const { useMemo, useState } = React;
const course = window.BEAR_COURSE;
const initialPlayers = window.BEAR_PLAYERS;
const S = window.BearScoring;

function seedScores(players) {
  const scores = {};
  players.forEach(p => scores[p.id] = {});
  return scores;
}

function App() {
  const [tab, setTab] = useState('home');
  const [players, setPlayers] = useState(initialPlayers);
  const [scores, setScores] = useState(seedScores(initialPlayers));
  const [hole, setHole] = useState(1);
  const [group, setGroup] = useState(initialPlayers.slice(0,4).map(p=>p.id));
  const leaders = useMemo(() => S.leaderboard(players, scores, course), [players, scores]);
  const skins = useMemo(() => S.netSkins(players, scores, course), [players, scores]);
  const groupPlayers = players.filter(p => group.includes(p.id));
  const activeHole = course.holes.find(h => h.hole === hole);
  function setScore(playerId, h, gross) { setScores(prev => ({ ...prev, [playerId]: { ...prev[playerId], [h]: gross }})); }
  function updatePlayer(id, field, value) { setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: Number(value) || value } : p)); }
  return <>
    <header><h1>Bear Tracker</h1><p>Black Bear Saturday Game · Foundation v0.1</p></header>
    <nav className="tabs">{['home','score','leaderboard','skins','admin'].map(t => <button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</nav>
    <main>
      {tab==='home' && <Home players={players} leaders={leaders} skins={skins}/>} 
      {tab==='score' && <Score hole={hole} setHole={setHole} activeHole={activeHole} groupPlayers={groupPlayers} scores={scores} setScore={setScore}/>} 
      {tab==='leaderboard' && <Leaderboard leaders={leaders}/>} 
      {tab==='skins' && <Skins skins={skins}/>} 
      {tab==='admin' && <Admin players={players} updatePlayer={updatePlayer} group={group} setGroup={setGroup}/>} 
    </main>
  </>;
}
function Home({players, leaders, skins}) {
  const leader = leaders[0];
  const awarded = skins.filter(s=>s.winner).length;
  return <div className="grid cards">
    <div className="card"><h2>Saturday Round</h2><p className="muted">Course</p><div className="stat">Black Bear</div><p>{players.length} active players</p></div>
    <div className="card"><h2>Current Leader</h2><div className={leader.plusMinus>=0?'positive stat':'negative stat'}>{leader.plusMinus>0?'+':''}{leader.plusMinus}</div><p>{leader.player.name}</p></div>
    <div className="card"><h2>Skins</h2><div className="stat">{awarded}</div><p>Awarded so far</p></div>
    <div className="card"><h2>Next Build</h2><p>Real database, PIN login, drag-and-drop groups, saved rounds.</p></div>
  </div>
}
function Score({hole,setHole,activeHole,groupPlayers,scores,setScore}) {
  const options = [3,4,5,6,7,8];
  return <div className="card"><h2>Group Scorer · Hole {hole}</h2><p><span className="pill">Par {activeHole.par}</span> <span className="pill">Stroke {activeHole.strokeIndex}</span></p>
    {groupPlayers.map(p => <div className="score-row" key={p.id}><span><b>{p.name}</b> <span className="muted">HDCP {p.handicap}</span></span>{options.map(o=><button key={o} className={scores[p.id]?.[hole]===o?'sel':''} onClick={()=>setScore(p.id,hole,o)}>{o}</button>)}</div>)}
    <button className="btn" onClick={()=>setHole(Math.min(18,hole+1))}>Save Hole / Next</button> <button className="btn secondary" onClick={()=>setHole(Math.max(1,hole-1))}>Previous</button>
  </div>
}
function Leaderboard({leaders}) { return <div className="card"><h2>Quota Leaderboard</h2><div className="table-wrap"><table className="table"><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Gross</th><th>Net</th></tr></thead><tbody>{leaders.map((r,i)=><tr key={r.player.id}><td>{i+1}</td><td>{r.player.name}</td><td>{r.thru}</td><td>{r.points}</td><td>{r.player.quota}</td><td className={r.plusMinus>=0?'positive':'negative'}>{r.plusMinus>0?'+':''}{r.plusMinus}</td><td>{r.gross||''}</td><td>{r.net||''}</td></tr>)}</tbody></table></div></div> }
function Skins({skins}) { return <div className="card"><h2>Net Skins</h2><div className="table-wrap"><table className="table"><thead><tr><th>Hole</th><th>Status</th><th>Net</th></tr></thead><tbody>{skins.map(s=><tr key={s.hole}><td>{s.hole}</td><td>{s.winner ? `Skin: ${s.winner}` : s.status}</td><td>{s.net ?? ''}</td></tr>)}</tbody></table></div></div> }
function Admin({players,updatePlayer,group,setGroup}) {
  return <div className="grid"><div className="card"><h2>Admin Foundation</h2><p>This version stores edits in memory only. Database save comes next.</p></div>
    <div className="card"><h3>Group 1 Setup</h3><p className="muted">Temporary checkbox setup; drag-and-drop comes next.</p>{players.map(p=><label className="group-member" key={p.id}><input type="checkbox" checked={group.includes(p.id)} onChange={e=>setGroup(e.target.checked?[...group,p.id]:group.filter(id=>id!==p.id))}/> {p.name}</label>)}</div>
    <div className="card"><h3>Players</h3><div className="table-wrap"><table className="table"><thead><tr><th>Player</th><th>HDCP</th><th>Quota</th><th>PIN</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td>{p.name}</td><td><input value={p.handicap} onChange={e=>updatePlayer(p.id,'handicap',e.target.value)} size="3"/></td><td><input value={p.quota} onChange={e=>updatePlayer(p.id,'quota',e.target.value)} size="3"/></td><td>{p.pin}</td></tr>)}</tbody></table></div></div>
  </div>
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
