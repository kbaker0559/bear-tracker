import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { blackBearCourse } from './data/course';
import { saturdayPlayers } from './data/players';
import { buildLeaderboard, evaluateScores } from './engine/scoring';
import { calculateNetSkins } from './engine/skins';
import { calculatePlacePayouts, defaultPlaceAmounts } from './engine/payouts';
import { quotaChangeAfterMoneyRule } from './engine/quota';
import type { Player, Score } from './types/domain';
import './styles.css';

const STORAGE_KEY = 'bear-tracker:sprint2';
const ADMIN_PIN = '0559';

type Session =
  | { role: 'guest' }
  | { role: 'admin'; name: 'Commissioner' }
  | { role: 'player'; playerId: string; name: string };

type AppState = {
  players: Player[];
  scores: Score[];
};

const defaultScores: Score[] = [
  { playerId: 'kevin-baker', holeNumber: 1, gross: 5 },
  { playerId: 'kevin-baker', holeNumber: 2, gross: 6 },
  { playerId: 'cam-crollard', holeNumber: 1, gross: 4 },
  { playerId: 'cam-crollard', holeNumber: 2, gross: 5 },
  { playerId: 'fred-tucker', holeNumber: 1, gross: 4 },
  { playerId: 'fred-tucker', holeNumber: 2, gross: 5 }
];

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // fall back to seed data
  }
  return {
    players: saturdayPlayers.map((player, index) => ({ ...player, pin: player.pin ?? String(1000 + index) })),
    scores: defaultScores
  };
}

function saveState(next: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function formatDiff(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [session, setSession] = useState<Session>({ role: 'guest' });
  const [activeTab, setActiveTab] = useState<'home' | 'leaderboard' | 'skins' | 'players'>('home');
  const [pinInput, setPinInput] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  function updateState(updater: (current: AppState) => AppState) {
    setState((current) => {
      const next = updater(current);
      saveState(next);
      return next;
    });
  }

  const activePlayers = useMemo(() => state.players.filter((p) => p.active), [state.players]);
  const results = useMemo(() => evaluateScores(activePlayers, blackBearCourse, state.scores), [activePlayers, state.scores]);
  const leaderboard = useMemo(() => buildLeaderboard(activePlayers, results), [activePlayers, results]);
  const skins = useMemo(() => calculateNetSkins(results), [results]);
  const payoutPlaces = useMemo(() => defaultPlaceAmounts(activePlayers.length), [activePlayers.length]);
  const payouts = useMemo(() => calculatePlacePayouts(leaderboard, payoutPlaces), [leaderboard, payoutPlaces]);

  function login() {
    const pin = pinInput.trim();
    if (pin === ADMIN_PIN) {
      setSession({ role: 'admin', name: 'Commissioner' });
      setPinInput('');
      setLoginMessage('Logged in as admin.');
      setActiveTab('players');
      return;
    }
    const player = state.players.find((p) => p.pin === pin && p.active);
    if (player) {
      setSession({ role: 'player', playerId: player.id, name: player.name });
      setPinInput('');
      setLoginMessage(`Logged in as ${player.name}.`);
      setActiveTab('leaderboard');
      return;
    }
    setLoginMessage('PIN not found. Admin PIN is currently 0559 for testing.');
  }

  function updatePlayer(playerId: string, patch: Partial<Player>) {
    updateState((current) => ({
      ...current,
      players: current.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p))
    }));
  }

  function addPlayer() {
    const id = `player-${Date.now()}`;
    updateState((current) => ({
      ...current,
      players: [
        ...current.players,
        { id, name: 'New Golfer', handicap: 0, quota: 0, pin: String(Math.floor(1000 + Math.random() * 9000)), active: true }
      ]
    }));
  }

  function resetLocalData() {
    localStorage.removeItem(STORAGE_KEY);
    const next = loadState();
    setState(next);
    setSession({ role: 'guest' });
    setActiveTab('home');
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Black Bear Saturday Game</p>
        <h1>Bear Tracker</h1>
        <p>Actual implementation sprint 2: PIN login, roles, and player administration.</p>
      </section>

      <section className="card wide loginbar">
        <div>
          <strong>Session:</strong> {session.role === 'guest' ? 'Not logged in' : session.name}
          {loginMessage && <p className="muted">{loginMessage}</p>}
        </div>
        <div className="loginControls">
          <input
            value={pinInput}
            onChange={(event) => setPinInput(event.target.value)}
            placeholder="Enter 4-digit PIN"
            inputMode="numeric"
          />
          <button onClick={login}>Log in</button>
          {session.role !== 'guest' && <button className="secondary" onClick={() => setSession({ role: 'guest' })}>Log out</button>}
        </div>
      </section>

      <nav className="tabs">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>Home</button>
        <button className={activeTab === 'leaderboard' ? 'active' : ''} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
        <button className={activeTab === 'skins' ? 'active' : ''} onClick={() => setActiveTab('skins')}>Skins</button>
        <button className={activeTab === 'players' ? 'active' : ''} onClick={() => setActiveTab('players')}>Player Admin</button>
      </nav>

      {activeTab === 'home' && (
        <section className="grid">
          <div className="card">
            <h2>Course</h2>
            <p>Black Bear Golf Club · Par {blackBearCourse.reduce((sum, hole) => sum + hole.par, 0)}</p>
            <p>{blackBearCourse.length} holes loaded with par and hole handicap.</p>
          </div>
          <div className="card">
            <h2>Players</h2>
            <p>{state.players.length} players in the roster.</p>
            <p>{activePlayers.length} active for the Saturday game.</p>
          </div>
          <div className="card">
            <h2>Admin Test PIN</h2>
            <p>Use <strong>0559</strong> to test commissioner features.</p>
            <p>Player PINs are editable in Player Admin.</p>
          </div>
        </section>
      )}

      {activeTab === 'leaderboard' && (
        <section className="card wide">
          <h2>Quota Leaderboard</h2>
          <table>
            <thead>
              <tr><th>Pos</th><th>Player</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Thru</th><th>Projected quota change</th></tr>
            </thead>
            <tbody>
              {leaderboard.map((row, index) => {
                const cash = payouts.some((p) => p.playerId === row.playerId && p.amount > 0);
                const quotaChange = quotaChangeAfterMoneyRule(row.quotaDiff, cash);
                return (
                  <tr key={row.playerId}>
                    <td>{index + 1}</td>
                    <td>{row.name}</td>
                    <td>{row.stablefordPoints}</td>
                    <td>{row.quota}</td>
                    <td className={row.quotaDiff >= 0 ? 'positive' : 'negative'}>{formatDiff(row.quotaDiff)}</td>
                    <td>{row.holesPlayed}</td>
                    <td>{cash ? formatDiff(quotaChange) : row.quotaDiff > 0 ? 'No increase unless in money' : formatDiff(quotaChange)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'skins' && (
        <section className="card wide">
          <h2>Net Skins Preview</h2>
          <div className="chips">
            {skins.map((skin) => {
              const winner = skin.winnerPlayerId ? state.players.find((p) => p.id === skin.winnerPlayerId)?.name : null;
              return (
                <span className="chip" key={skin.holeNumber}>
                  Hole {skin.holeNumber}: {winner ? `${winner} · Net ${skin.winningNet}` : skin.tied ? 'Tied / no skin' : 'No scores'}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'players' && (
        <section className="card wide">
          <div className="sectionHeader">
            <div>
              <h2>Player Admin</h2>
              <p className="muted">Commissioner can edit handicaps, quotas, PINs, and active status.</p>
            </div>
            <div className="actions">
              {session.role === 'admin' && <button onClick={addPlayer}>Add golfer</button>}
              <button className="danger" onClick={resetLocalData}>Reset local test data</button>
            </div>
          </div>

          {session.role !== 'admin' ? (
            <p className="warning">Log in as admin with PIN 0559 to edit players.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>HDCP</th><th>Quota</th><th>PIN</th><th>Active</th></tr>
              </thead>
              <tbody>
                {state.players.map((player) => (
                  <tr key={player.id}>
                    <td><input value={player.name} onChange={(e) => updatePlayer(player.id, { name: e.target.value })} /></td>
                    <td><input type="number" value={player.handicap} onChange={(e) => updatePlayer(player.id, { handicap: Number(e.target.value) })} /></td>
                    <td><input type="number" value={player.quota} onChange={(e) => updatePlayer(player.id, { quota: Number(e.target.value) })} /></td>
                    <td><input value={player.pin ?? ''} onChange={(e) => updatePlayer(player.id, { pin: e.target.value })} /></td>
                    <td><input type="checkbox" checked={player.active} onChange={(e) => updatePlayer(player.id, { active: e.target.checked })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
