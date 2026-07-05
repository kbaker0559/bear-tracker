import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { blackBearHoles } from '../data/course';
import { calculateNetSkins, calculateResults } from '../engine/scoring';
import { clearScores, loadPlayers, loadScores, resetPlayers, savePlayers, saveScores } from '../storage';
import type { Player, Score } from '../types/models';
import { Login } from './Login';
import { PlayerAdmin } from './PlayerAdmin';

type Tab = 'scores' | 'leaderboard' | 'skins' | 'players';

export function Dashboard() {
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [scores, setScores] = useState<Score[]>(() => loadScores());
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [selectedHole, setSelectedHole] = useState(1);
  const [tab, setTab] = useState<Tab>('scores');

  useEffect(() => savePlayers(players), [players]);
  useEffect(() => saveScores(scores), [scores]);

  const activePlayers = players.filter((p) => p.active);
  const results = useMemo(() => calculateResults(activePlayers, blackBearHoles, scores), [activePlayers, scores]);
  const skins = useMemo(() => calculateNetSkins(activePlayers, blackBearHoles, scores), [activePlayers, scores]);

  if (!currentUser) {
    return <Login players={players} onLogin={setCurrentUser} />;
  }

  function updatePlayers(nextPlayers: Player[]) {
    setPlayers(nextPlayers);
    const refreshedUser = currentUser ? nextPlayers.find((p) => p.id === currentUser.id) : null;
    if (refreshedUser) setCurrentUser(refreshedUser);
  }

  function saveScore(playerId: string, gross: number) {
    if (!Number.isFinite(gross) || gross <= 0) return;
    setScores((current) => [
      ...current.filter((s) => !(s.playerId === playerId && s.hole === selectedHole)),
      { playerId, hole: selectedHole, gross }
    ]);
  }

  function resetAllPlayers() {
    if (!confirm('Reset all players to the original Saturday list?')) return;
    const restored = resetPlayers();
    setPlayers(restored);
    const kevin = restored.find((p) => p.isAdmin) ?? restored[0];
    setCurrentUser(kevin);
  }

  function resetScores() {
    if (!confirm('Clear all entered scores for this round?')) return;
    clearScores();
    setScores([]);
  }

  const visibleScorePlayers = currentUser.isAdmin ? activePlayers : [currentUser];

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Black Bear Saturday Game</p>
          <h1>Bear Tracker</h1>
          <p>Signed in as <strong>{currentUser.name}</strong>{currentUser.isAdmin ? ' · Admin' : ''}</p>
        </div>
        <div className="hero-actions">
          <button onClick={resetScores}>Reset scores</button>
          <button className="secondary" onClick={() => setCurrentUser(null)}>Sign out</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'scores' ? 'active' : ''} onClick={() => setTab('scores')}>Scores</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')}>Skins</button>
        {currentUser.isAdmin && <button className={tab === 'players' ? 'active' : ''} onClick={() => setTab('players')}>Admin · Players</button>}
      </nav>

      {tab === 'scores' && (
        <div className="grid two">
          <Card title={currentUser.isAdmin ? 'Admin Score Entry' : 'My Score Entry'}>
            <label>
              Hole
              <select value={selectedHole} onChange={(e) => setSelectedHole(Number(e.target.value))}>
                {blackBearHoles.map((hole) => (
                  <option key={hole.number} value={hole.number}>Hole {hole.number} · Par {hole.par} · HDCP {hole.strokeIndex}</option>
                ))}
              </select>
            </label>
            <div className="score-list">
              {visibleScorePlayers.map((player) => {
                const existing = scores.find((s) => s.playerId === player.id && s.hole === selectedHole)?.gross ?? '';
                return (
                  <div className="score-row" key={player.id}>
                    <span>{player.name}</span>
                    <input type="number" min="1" value={existing} onChange={(e) => saveScore(player.id, Number(e.target.value))} />
                  </div>
                );
              })}
            </div>
            <p className="muted">Sprint 2 supports admin scoring for everyone and player self-scoring. Group scorekeeper mode is next.</p>
          </Card>
          <LeaderboardCard results={results} />
        </div>
      )}

      {tab === 'leaderboard' && <LeaderboardCard results={results} />}

      {tab === 'skins' && (
        <Card title="Net Skins Preview">
          <div className="skins-grid">
            {skins.map((skin) => {
              const winner = players.find((p) => p.id === skin.winnerPlayerId);
              return (
                <div className="skin" key={skin.hole}>
                  <strong>Hole {skin.hole}</strong>
                  <span>{winner ? `${winner.name} · Net ${skin.winningNetScore}` : skin.tied ? 'No skin — tied' : 'Pending'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'players' && currentUser.isAdmin && (
        <div className="grid">
          <PlayerAdmin players={players} onChange={updatePlayers} />
          <Card title="Admin Utilities">
            <button className="danger" onClick={resetAllPlayers}>Reset original player list</button>
          </Card>
        </div>
      )}
    </main>
  );
}

function LeaderboardCard({ results }: { results: ReturnType<typeof calculateResults> }) {
  return (
    <Card title="Quota Leaderboard">
      <table>
        <thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th></tr></thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={result.player.id}>
              <td>{index + 1}</td>
              <td>{result.player.name}</td>
              <td>{result.thru}</td>
              <td>{result.stablefordPoints}</td>
              <td>{result.player.quota}</td>
              <td className={result.quotaPlusMinus >= 0 ? 'positive' : 'negative'}>{result.quotaPlusMinus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
