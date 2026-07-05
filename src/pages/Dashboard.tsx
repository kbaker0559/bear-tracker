import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { blackBearHoles } from '../data/course';
import { initialPlayers } from '../data/players';
import { leaderboard, netScore, stablefordPoints } from '../engine/scoring';
import { calculateNetSkins } from '../engine/skins';
import type { Score } from '../types/domain';

const demoScores: Score[] = [
  { playerId: 'kevin-baker', holeNumber: 1, gross: 5 },
  { playerId: 'kevin-baker', holeNumber: 2, gross: 6 },
  { playerId: 'cam-crollard', holeNumber: 1, gross: 4 },
  { playerId: 'cam-crollard', holeNumber: 2, gross: 5 },
  { playerId: 'fred-tucker', holeNumber: 1, gross: 4 },
  { playerId: 'fred-tucker', holeNumber: 2, gross: 6 },
  { playerId: 'neal-self', holeNumber: 1, gross: 5 },
  { playerId: 'neal-self', holeNumber: 2, gross: 6 }
];

export function Dashboard() {
  const [scores] = useState<Score[]>(demoScores);
  const board = useMemo(() => leaderboard(initialPlayers, blackBearHoles, scores), [scores]);
  const skins = useMemo(() => calculateNetSkins(initialPlayers, blackBearHoles, scores), [scores]);

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Sprint 1</p>
          <h1>Bear Tracker</h1>
          <p>Saturday Stableford quota scoring foundation for Black Bear Golf Club.</p>
        </div>
        <div className="badge">Black Bear GC</div>
      </header>

      <div className="grid">
        <Card title="Course Data">
          <p>18 holes loaded with par and stroke index.</p>
          <div className="hole-grid">
            {blackBearHoles.map(hole => (
              <div key={hole.number} className="hole-pill">
                <strong>{hole.number}</strong>
                <span>Par {hole.par}</span>
                <span>SI {hole.strokeIndex}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Player Data">
          <p>{initialPlayers.length} starting players loaded with handicap and quota.</p>
          <ul className="compact-list">
            {initialPlayers.slice(0, 8).map(player => (
              <li key={player.id}>{player.name}: HDCP {player.handicap}, Quota {player.quota}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Demo Leaderboard">
        <table>
          <thead>
            <tr>
              <th>Player</th><th>Thru</th><th>Gross</th><th>Net</th><th>Pts</th><th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {board.slice(0, 8).map(row => (
              <tr key={row.player.id}>
                <td>{row.player.name}</td>
                <td>{row.holesPlayed}</td>
                <td>{row.grossTotal || '-'}</td>
                <td>{row.netTotal || '-'}</td>
                <td>{row.stablefordPoints}</td>
                <td className={row.quotaPlusMinus >= 0 ? 'positive' : 'negative'}>{row.quotaPlusMinus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Demo Skins Preview">
        <div className="skin-list">
          {skins.slice(0, 4).map(skin => (
            <div key={skin.holeNumber} className="skin-row">
              <strong>Hole {skin.holeNumber}</strong>
              <span>{skin.winnerPlayerId ? `Winner: ${initialPlayers.find(p => p.id === skin.winnerPlayerId)?.name}` : skin.tiedPlayerIds.length ? 'No skin — tied' : 'Awaiting scores'}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Scoring Example">
        <p>Kevin on Hole 1 gross 5: net {netScore(5, 12, 5)}, Stableford {stablefordPoints(netScore(5, 12, 5), 4)} point(s).</p>
      </Card>
    </main>
  );
}
