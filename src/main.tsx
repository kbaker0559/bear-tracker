import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Login } from './components/Login';
import { PlayerAdmin } from './components/PlayerAdmin';
import { blackBearHoles } from './data/course';
import type { Player, Score } from './types/models';
import { leaderboard, netSkins } from './engine/scoring';
import { loadPlayers, savePlayers } from './services/storage';
import './style.css';

type Tab = 'score' | 'leaderboard' | 'skins' | 'admin';

function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [holeNumber, setHoleNumber] = useState(1);
  const [tab, setTab] = useState<Tab>('score');

  useEffect(() => savePlayers(players), [players]);

  const activePlayers = useMemo(() => players.filter(player => player.active), [players]);
  const visibleScoreGroup = useMemo(() => activePlayers.slice(0, 4), [activePlayers]);
  const board = useMemo(() => leaderboard(players, blackBearHoles, scores), [players, scores]);
  const skins = useMemo(() => netSkins(activePlayers, blackBearHoles, scores), [activePlayers, scores]);

  const activeCurrentUser = useMemo(
    () => currentUser ? players.find(player => player.id === currentUser.id) ?? null : null,
    [currentUser, players]
  );

  function handlePlayersChange(nextPlayers: Player[]) {
    setPlayers(nextPlayers);
    if (activeCurrentUser) {
      const updatedUser = nextPlayers.find(player => player.id === activeCurrentUser.id);
      setCurrentUser(updatedUser ?? null);
    }
  }

  function saveScore(playerId: string, gross: number) {
    setScores(prev => [
      ...prev.filter(score => !(score.playerId === playerId && score.holeNumber === holeNumber)),
      { playerId, holeNumber, gross },
    ]);
  }

  if (!activeCurrentUser) {
    return (
      <main>
        <header>
          <h1>Bear Tracker</h1>
          <p>Option 1 Sprint 2 · PIN login and player administration</p>
        </header>
        <Login players={players} onLogin={(player) => setCurrentUser(player)} />
      </main>
    );
  }

  return (
    <main>
      <header>
        <div>
          <h1>Bear Tracker</h1>
          <p>Black Bear Saturday Game · Signed in as {activeCurrentUser.name}</p>
        </div>
        <button className="secondary inverse" onClick={() => setCurrentUser(null)}>Sign Out</button>
      </header>

      <nav className="tabs">
        <button className={tab === 'score' ? 'active' : ''} onClick={() => setTab('score')}>Scores</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')}>Skins</button>
        {activeCurrentUser.isAdmin && <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Admin</button>}
      </nav>

      {tab === 'score' && (
        <section className="card">
          <h2>Group Score Entry</h2>
          <p>This sprint still uses the first four active players as a sample score group. Drag-and-drop groups come next.</p>
          <label>
            Hole
            <select value={holeNumber} onChange={event => setHoleNumber(Number(event.target.value))}>
              {blackBearHoles.map(hole => (
                <option key={hole.number} value={hole.number}>Hole {hole.number} · Par {hole.par} · HDCP {hole.handicapRank}</option>
              ))}
            </select>
          </label>
          {visibleScoreGroup.map(player => (
            <div className="score-row" key={player.id}>
              <div>
                <strong>{player.name}</strong>
                <span>HDCP {player.handicap} · Quota {player.quota}</span>
              </div>
              <div>{[3, 4, 5, 6, 7, 8, 9].map(gross => <button key={gross} onClick={() => saveScore(player.id, gross)}>{gross}</button>)}</div>
            </div>
          ))}
        </section>
      )}

      {tab === 'leaderboard' && (
        <section className="card">
          <h2>Quota Leaderboard</h2>
          <table>
            <thead><tr><th>Pos</th><th>Player</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Thru</th></tr></thead>
            <tbody>{board.map((row, index) => (
              <tr key={row.player.id}>
                <td>{index + 1}</td><td>{row.player.name}</td><td>{row.stablefordPoints}</td><td>{row.player.quota}</td><td>{row.quotaDiff}</td><td>{row.holesPlayed}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>
      )}

      {tab === 'skins' && (
        <section className="card">
          <h2>Net Skins Preview</h2>
          {skins.map(skin => <span className="pill" key={skin.holeNumber}>H{skin.holeNumber}: {skin.winnerId ? players.find(player => player.id === skin.winnerId)?.name : skin.tied ? 'No skin' : 'Pending'}</span>)}
        </section>
      )}

      {tab === 'admin' && activeCurrentUser.isAdmin && <PlayerAdmin players={players} onChange={handlePlayersChange} />}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
