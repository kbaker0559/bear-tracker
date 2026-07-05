import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { blackBearHoles } from '../data/course';
import { initialPlayers } from '../data/players';
import { calculateNetSkins, calculateResults } from '../engine/scoring';
import type { Player, Score } from '../types/models';

export function Dashboard() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedHole, setSelectedHole] = useState(1);
  const activePlayers = players.filter((p) => p.active);

  const results = useMemo(() => calculateResults(activePlayers, blackBearHoles, scores), [activePlayers, scores]);
  const skins = useMemo(() => calculateNetSkins(activePlayers, blackBearHoles, scores), [activePlayers, scores]);

  function saveScore(playerId: string, gross: number) {
    setScores((current) => [
      ...current.filter((s) => !(s.playerId === playerId && s.hole === selectedHole)),
      { playerId, hole: selectedHole, gross }
    ]);
  }

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Black Bear Saturday Game</p>
          <h1>Bear Tracker</h1>
          <p>Real React foundation: scoring engine, leaderboard, and net skins preview.</p>
        </div>
        <button onClick={() => setScores([])}>Reset scores</button>
      </header>

      <div className="grid two">
        <Card title="Score Entry">
          <label>
            Hole
            <select value={selectedHole} onChange={(e) => setSelectedHole(Number(e.target.value))}>
              {blackBearHoles.map((hole) => <option key={hole.number} value={hole.number}>Hole {hole.number} · Par {hole.par}</option>)}
            </select>
          </label>
          <div className="score-list">
            {activePlayers.slice(0, 8).map((player) => {
              const existing = scores.find((s) => s.playerId === player.id && s.hole === selectedHole)?.gross ?? '';
              return <div className="score-row" key={player.id}>
                <span>{player.name}</span>
                <input type="number" min="1" value={existing} onChange={(e) => saveScore(player.id, Number(e.target.value))} />
              </div>;
            })}
          </div>
          <p className="muted">Showing first 8 players for the initial scaffold. Group scorekeeper screens come next.</p>
        </Card>

        <Card title="Leaderboard">
          <table>
            <thead><tr><th>Player</th><th>Thru</th><th>Pts</th><th>+/-</th></tr></thead>
            <tbody>
              {results.slice(0, 10).map((result) => <tr key={result.player.id}>
                <td>{result.player.name}</td>
                <td>{result.thru}</td>
                <td>{result.stablefordPoints}</td>
                <td className={result.quotaPlusMinus >= 0 ? 'positive' : 'negative'}>{result.quotaPlusMinus}</td>
              </tr>)}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="grid two">
        <Card title="Players">
          <table>
            <thead><tr><th>Name</th><th>HDCP</th><th>Quota</th></tr></thead>
            <tbody>{players.map((player) => <tr key={player.id}><td>{player.name}</td><td>{player.handicap}</td><td>{player.quota}</td></tr>)}</tbody>
          </table>
        </Card>

        <Card title="Net Skins Preview">
          <div className="skins-grid">
            {skins.map((skin) => {
              const winner = players.find((p) => p.id === skin.winnerPlayerId);
              return <div className="skin" key={skin.hole}>
                <strong>Hole {skin.hole}</strong>
                <span>{winner ? `${winner.name} · Net ${skin.winningNetScore}` : skin.tied ? 'No skin — tied' : 'Pending'}</span>
              </div>;
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
