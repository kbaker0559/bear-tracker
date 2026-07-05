import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { blackBearHoles } from './data/course';
import { initialPlayers } from './data/players';
import type { Score } from './types/models';
import { leaderboard, netSkins } from './engine/scoring';
import './style.css';

function App() {
  const [scores, setScores] = useState<Score[]>([]);
  const board = useMemo(() => leaderboard(initialPlayers, blackBearHoles, scores), [scores]);
  const skins = useMemo(() => netSkins(initialPlayers, blackBearHoles, scores), [scores]);
  const sampleGroup = initialPlayers.slice(0, 4);
  const [holeNumber, setHoleNumber] = useState(1);

  function saveScore(playerId: string, gross: number) {
    setScores(prev => [...prev.filter(s => !(s.playerId === playerId && s.holeNumber === holeNumber)), { playerId, holeNumber, gross }]);
  }

  return <main>
    <header><h1>Bear Tracker</h1><p>Actual Sprint 1: scoring foundation</p></header>
    <section className="card">
      <h2>Group Score Entry</h2>
      <label>Hole <select value={holeNumber} onChange={e => setHoleNumber(Number(e.target.value))}>{blackBearHoles.map(h => <option key={h.number} value={h.number}>{h.number} · Par {h.par}</option>)}</select></label>
      {sampleGroup.map(player => <div className="score-row" key={player.id}><strong>{player.name}</strong><div>{[3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => saveScore(player.id, n)}>{n}</button>)}</div></div>)}
    </section>
    <section className="card"><h2>Leaderboard</h2><table><thead><tr><th>Player</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Thru</th></tr></thead><tbody>{board.slice(0,10).map(r => <tr key={r.player.id}><td>{r.player.name}</td><td>{r.stablefordPoints}</td><td>{r.player.quota}</td><td>{r.quotaDiff}</td><td>{r.holesPlayed}</td></tr>)}</tbody></table></section>
    <section className="card"><h2>Net Skins Preview</h2>{skins.slice(0,18).map(s => <span className="pill" key={s.holeNumber}>H{s.holeNumber}: {s.winnerId ? initialPlayers.find(p => p.id === s.winnerId)?.name : s.tied ? 'No skin' : 'Pending'}</span>)}</section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
