import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { initialPlayers } from './data/players';
import { blackBearCourse } from './data/course';
import { calculateNetSkins, calculateStandings, netScore, stablefordPoints } from './engine/scoring';
import type { Group, Player, ScoreEntry } from './types/models';
import { loadFromStorage, saveToStorage } from './utils/storage';
import './styles.css';

const STORAGE_KEY = 'bear-tracker-sprint2';

type AppState = {
  players: Player[];
  groups: Group[];
  scores: ScoreEntry[];
};

const defaultState: AppState = {
  players: initialPlayers,
  groups: [
    { id: 'group-1', name: 'Group 1', playerIds: ['kevin-baker','fred-tucker','cam-crollard','neal-self'], scorekeeperIds: ['kevin-baker'] },
    { id: 'group-2', name: 'Group 2', playerIds: ['paul-tucker-jr','paul-tucker-sr','steve-robin','george-heider'], scorekeeperIds: ['paul-tucker-jr'] },
  ],
  scores: [],
};

function App() {
  const [state, setState] = useState<AppState>(() => loadFromStorage(STORAGE_KEY, defaultState));
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [tab, setTab] = useState<'leaderboard' | 'score' | 'players' | 'groups' | 'skins'>('leaderboard');
  const [holeNumber, setHoleNumber] = useState(1);

  const currentPlayer = state.players.find((p) => p.id === currentPlayerId);
  const isAdmin = currentPlayer?.role === 'admin';
  const standings = useMemo(() => calculateStandings(state.players, blackBearCourse, state.scores), [state.players, state.scores]);
  const skins = useMemo(() => calculateNetSkins(state.players, blackBearCourse, state.scores), [state.players, state.scores]);

  function updateState(next: AppState) {
    setState(next);
    saveToStorage(STORAGE_KEY, next);
  }

  function login() {
    const player = state.players.find((p) => p.id === currentPlayerId && p.pin === pin);
    if (!player) {
      alert('PIN does not match that golfer. Try Kevin Baker / 0559 for admin in this demo.');
      return;
    }
    setPin('');
  }

  const loggedIn = Boolean(currentPlayer && pin === '');

  if (!loggedIn) {
    return <main className="login-page">
      <div className="hero">
        <h1>Bear Tracker</h1>
        <p>Saturday Stableford, quota, skins, and scoring for Black Bear.</p>
      </div>
      <section className="card login-card">
        <h2>PIN Login</h2>
        <label>Golfer</label>
        <select value={currentPlayerId} onChange={(e) => setCurrentPlayerId(e.target.value)}>
          <option value="">Choose golfer...</option>
          {state.players.filter(p => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>PIN</label>
        <input value={pin} onChange={(e) => setPin(e.target.value)} inputMode="numeric" placeholder="4 digits" />
        <button onClick={login}>Open Bear Tracker</button>
        <p className="hint">Demo admin: Kevin Baker / 0559</p>
      </section>
    </main>;
  }

  function saveScore(playerId: string, gross: number) {
    const scores = state.scores.filter((s) => !(s.playerId === playerId && s.hole === holeNumber));
    updateState({ ...state, scores: [...scores, { playerId, hole: holeNumber, gross }] });
  }

  function resetDemoScores() {
    if (confirm('Clear all entered scores?')) updateState({ ...state, scores: [] });
  }

  return <main>
    <header className="topbar">
      <div><h1>Bear Tracker</h1><p>Black Bear Saturday Game · Sprint 2</p></div>
      <div className="user-pill">{currentPlayer?.name}</div>
    </header>
    <nav className="tabs">
      <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
      <button className={tab === 'score' ? 'active' : ''} onClick={() => setTab('score')}>Score Entry</button>
      <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')}>Skins</button>
      {isAdmin && <button className={tab === 'players' ? 'active' : ''} onClick={() => setTab('players')}>Players</button>}
      {isAdmin && <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>Groups</button>}
    </nav>

    {tab === 'leaderboard' && <section className="card">
      <h2>Live Quota Leaderboard</h2>
      <table><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th></tr></thead><tbody>
        {standings.map((s, i) => <tr key={s.player.id}><td>{i+1}</td><td>{s.player.name}</td><td>{s.holesPlayed}</td><td>{s.stableford}</td><td>{s.player.quota}</td><td className={s.quotaPlusMinus >= 0 ? 'positive' : 'negative'}>{s.quotaPlusMinus > 0 ? '+' : ''}{s.quotaPlusMinus}</td></tr>)}
      </tbody></table>
      {isAdmin && <button className="danger" onClick={resetDemoScores}>Clear Scores</button>}
    </section>}

    {tab === 'score' && <section className="card">
      <h2>Group Score Entry</h2>
      <div className="hole-picker">
        <button disabled={holeNumber === 1} onClick={() => setHoleNumber(holeNumber - 1)}>Previous</button>
        <strong>Hole {holeNumber}</strong>
        <button disabled={holeNumber === 18} onClick={() => setHoleNumber(holeNumber + 1)}>Next</button>
      </div>
      <p>{blackBearCourse.find(h => h.number === holeNumber)?.par && `Par ${blackBearCourse.find(h => h.number === holeNumber)?.par} · Handicap ${blackBearCourse.find(h => h.number === holeNumber)?.handicapRank}`}</p>
      {state.groups.filter(g => isAdmin || g.scorekeeperIds.includes(currentPlayer!.id)).map((group) => <div key={group.id} className="group-card">
        <h3>{group.name}</h3>
        {group.playerIds.map((pid) => {
          const player = state.players.find(p => p.id === pid);
          const hole = blackBearCourse.find(h => h.number === holeNumber)!;
          const existing = state.scores.find(s => s.playerId === pid && s.hole === holeNumber);
          if (!player) return null;
          const grossOptions = [hole.par-2,hole.par-1,hole.par,hole.par+1,hole.par+2,hole.par+3,hole.par+4].filter(n => n > 0);
          return <div className="score-row" key={pid}>
            <span>{player.name}</span>
            <div className="score-buttons">{grossOptions.map((g) => <button key={g} className={existing?.gross === g ? 'selected' : ''} onClick={() => saveScore(pid, g)}>{g}</button>)}</div>
            {existing && <small>Net {netScore(existing.gross, player.handicap, hole.handicapRank)} · {stablefordPoints(netScore(existing.gross, player.handicap, hole.handicapRank), hole.par)} pts</small>}
          </div>;
        })}
      </div>)}
    </section>}

    {tab === 'skins' && <section className="card"><h2>Net Skins Preview</h2><div className="skin-grid">
      {skins.map((skin) => {
        const winner = state.players.find(p => p.id === skin.winnerId);
        return <div key={skin.hole} className="skin-card"><strong>Hole {skin.hole}</strong><span>{winner ? winner.name : skin.pendingPlayers > 0 ? `${skin.pendingPlayers} pending` : skin.tied ? 'No skin - tied' : 'No score'}</span>{skin.winningNet !== null && <small>Best net {skin.winningNet}</small>}</div>;
      })}
    </div></section>}

    {tab === 'players' && isAdmin && <PlayerAdmin state={state} updateState={updateState} />}
    {tab === 'groups' && isAdmin && <GroupAdmin state={state} updateState={updateState} />}
  </main>;
}

function PlayerAdmin({ state, updateState }: { state: AppState; updateState: (s: AppState) => void }) {
  function updatePlayer(id: string, patch: Partial<Player>) {
    updateState({ ...state, players: state.players.map(p => p.id === id ? { ...p, ...patch } : p) });
  }
  return <section className="card"><h2>Player Admin</h2><table><thead><tr><th>Name</th><th>HDCP</th><th>Quota</th><th>PIN</th><th>Active</th></tr></thead><tbody>
    {state.players.map(p => <tr key={p.id}><td>{p.name}</td><td><input type="number" value={p.handicap} onChange={e => updatePlayer(p.id, { handicap: Number(e.target.value) })} /></td><td><input type="number" value={p.quota} onChange={e => updatePlayer(p.id, { quota: Number(e.target.value) })} /></td><td><input value={p.pin} onChange={e => updatePlayer(p.id, { pin: e.target.value })} /></td><td><input type="checkbox" checked={p.active} onChange={e => updatePlayer(p.id, { active: e.target.checked })} /></td></tr>)}
  </tbody></table></section>;
}

function GroupAdmin({ state, updateState }: { state: AppState; updateState: (s: AppState) => void }) {
  function togglePlayer(groupId: string, playerId: string) {
    updateState({ ...state, groups: state.groups.map(g => g.id === groupId ? { ...g, playerIds: g.playerIds.includes(playerId) ? g.playerIds.filter(id => id !== playerId) : [...g.playerIds, playerId] } : g) });
  }
  function toggleScorekeeper(groupId: string, playerId: string) {
    updateState({ ...state, groups: state.groups.map(g => g.id === groupId ? { ...g, scorekeeperIds: g.scorekeeperIds.includes(playerId) ? g.scorekeeperIds.filter(id => id !== playerId) : [...g.scorekeeperIds, playerId] } : g) });
  }
  return <section className="card"><h2>Groups</h2><p className="hint">Sprint 2 uses checkboxes. True drag-and-drop comes next.</p>
    {state.groups.map(group => <div className="group-card" key={group.id}><h3>{group.name}</h3>{state.players.filter(p => p.active).map(p => <label className="check-row" key={p.id}><input type="checkbox" checked={group.playerIds.includes(p.id)} onChange={() => togglePlayer(group.id, p.id)} /> {p.name} <span className="spacer"/> Scorekeeper <input type="checkbox" checked={group.scorekeeperIds.includes(p.id)} onChange={() => toggleScorekeeper(group.id, p.id)} /></label>)}</div>)}
  </section>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
