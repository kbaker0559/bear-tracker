import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { blackBearCourse } from './data/course';
import { initialPlayers } from './data/players';
import { leaderboard } from './engine/scoring';
import { skins } from './engine/skins';
import { loadJson, saveJson } from './storage/localStore';
import type { Group, Player, ScoreMap } from './types';
import './styles.css';

const STORAGE_KEY = 'bear-tracker-sprint6';

type AppState = {
  players: Player[];
  scores: ScoreMap;
  groups: Group[];
  currentHole: number;
};

const defaultGroups: Group[] = [
  { id: 'g1', name: 'Group 1', playerIds: ['7','1','5','13'], scorekeeperIds: ['7'] },
  { id: 'g2', name: 'Group 2', playerIds: ['2','6','16','11'], scorekeeperIds: ['2'] }
];

function App() {
  const [state, setState] = useState<AppState>(() => loadJson(STORAGE_KEY, {
    players: initialPlayers,
    scores: {},
    groups: defaultGroups,
    currentHole: 1
  }));
  const [activeTab, setActiveTab] = useState<'score'|'leaderboard'|'skins'|'admin'>('score');
  const [groupId, setGroupId] = useState(state.groups[0]?.id ?? 'g1');

  function patch(next: Partial<AppState>) {
    setState((current) => {
      const updated = { ...current, ...next };
      saveJson(STORAGE_KEY, updated);
      return updated;
    });
  }

  const activeGroup = state.groups.find((g) => g.id === groupId) ?? state.groups[0];
  const activePlayers = state.players.filter((p) => activeGroup?.playerIds.includes(p.id));
  const board = useMemo(() => leaderboard(state.players, blackBearCourse, state.scores), [state.players, state.scores]);
  const skinRows = useMemo(() => skins(state.players, blackBearCourse, state.scores), [state.players, state.scores]);
  const hole = blackBearCourse.find((h) => h.number === state.currentHole) ?? blackBearCourse[0];

  function setScore(playerId: string, gross: number) {
    const scores = {
      ...state.scores,
      [playerId]: {
        ...(state.scores[playerId] ?? {}),
        [hole.number]: gross
      }
    };
    patch({ scores });
  }

  return <main className="app">
    <header className="hero">
      <div>
        <p className="eyebrow">Black Bear Saturday Game</p>
        <h1>Bear Tracker</h1>
        <p>Live scoring foundation · Hole {state.currentHole} · {state.players.filter(p => p.active).length} active players</p>
      </div>
      <button onClick={() => patch({ scores: {}, currentHole: 1 })}>Reset Test Round</button>
    </header>

    <nav className="tabs">
      {(['score','leaderboard','skins','admin'] as const).map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
    </nav>

    {activeTab === 'score' && <section className="card">
      <div className="row">
        <h2>Group Score Entry</h2>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <h3>Hole {hole.number} · Par {hole.par} · Stroke Index {hole.strokeIndex}</h3>
      <div className="score-grid">
        {activePlayers.map((player) => <div className="score-row" key={player.id}>
          <strong>{player.name}</strong>
          <span>HDCP {player.handicap} · Quota {player.quota}</span>
          <div className="score-buttons">
            {[2,3,4,5,6,7,8,9].map((gross) => <button
              key={gross}
              className={state.scores[player.id]?.[hole.number] === gross ? 'selected' : ''}
              onClick={() => setScore(player.id, gross)}>{gross}</button>)}
          </div>
        </div>)}
      </div>
      <div className="row footer-actions">
        <button disabled={state.currentHole <= 1} onClick={() => patch({ currentHole: state.currentHole - 1 })}>Previous Hole</button>
        <button disabled={state.currentHole >= 18} onClick={() => patch({ currentHole: state.currentHole + 1 })}>Next Hole</button>
      </div>
    </section>}

    {activeTab === 'leaderboard' && <section className="card">
      <h2>Live Leaderboard</h2>
      <table>
        <thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th></tr></thead>
        <tbody>{board.map((r, index) => <tr key={r.playerId}><td>{index+1}</td><td>{r.name}</td><td>{r.thru}</td><td>{r.points}</td><td>{r.quota}</td><td className={r.quotaDelta >= 0 ? 'good' : 'bad'}>{r.quotaDelta > 0 ? '+' : ''}{r.quotaDelta}</td></tr>)}</tbody>
      </table>
    </section>}

    {activeTab === 'skins' && <section className="card">
      <h2>Net Skins</h2>
      <table>
        <thead><tr><th>Hole</th><th>Status</th><th>Winner</th><th>Net</th></tr></thead>
        <tbody>{skinRows.map((s) => <tr key={s.hole}><td>{s.hole}</td><td>{s.status}</td><td>{s.winnerName ?? '—'}</td><td>{s.netScore ?? '—'}</td></tr>)}</tbody>
      </table>
    </section>}

    {activeTab === 'admin' && <section className="card">
      <h2>Admin Snapshot</h2>
      <p>This sprint focuses on live local scoring. Drag-and-drop group editing and Supabase sync are next.</p>
      <pre>{JSON.stringify({ groups: state.groups, scoresEntered: Object.values(state.scores).reduce((sum, holes) => sum + Object.values(holes).filter(v => typeof v === 'number').length, 0) }, null, 2)}</pre>
    </section>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
