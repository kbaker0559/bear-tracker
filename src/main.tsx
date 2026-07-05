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

const sampleScores: Score[] = [
  { playerId: 'kevin-baker', holeNumber: 1, gross: 5 },
  { playerId: 'kevin-baker', holeNumber: 2, gross: 6 },
  { playerId: 'cam-crollard', holeNumber: 1, gross: 4 },
  { playerId: 'cam-crollard', holeNumber: 2, gross: 5 },
  { playerId: 'fred-tucker', holeNumber: 1, gross: 4 },
  { playerId: 'fred-tucker', holeNumber: 2, gross: 5 }
];

function App() {
  const [players] = useState<Player[]>(saturdayPlayers);

  const results = useMemo(() => evaluateScores(players, blackBearCourse, sampleScores), [players]);
  const leaderboard = useMemo(() => buildLeaderboard(players, results), [players, results]);
  const skins = useMemo(() => calculateNetSkins(results), [results]);
  const payoutPlaces = useMemo(() => defaultPlaceAmounts(players.filter((p) => p.active).length), [players]);
  const payouts = useMemo(() => calculatePlacePayouts(leaderboard, payoutPlaces), [leaderboard, payoutPlaces]);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Black Bear Saturday Game</p>
        <h1>Bear Tracker</h1>
        <p>Actual implementation sprint 1: scoring engine foundation, seed data, and rule tests.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Course</h2>
          <p>Black Bear Golf Club · Par {blackBearCourse.reduce((sum, hole) => sum + hole.par, 0)}</p>
          <p>{blackBearCourse.length} holes loaded with par and hole handicap.</p>
        </div>

        <div className="card">
          <h2>Players</h2>
          <p>{players.length} Saturday players loaded.</p>
          <p>{players.filter((p) => p.active).length} active players.</p>
        </div>

        <div className="card">
          <h2>Rules Implemented</h2>
          <ul>
            <li>Stableford: 0/1/2/4/6/8</li>
            <li>Quota +/- leaderboard</li>
            <li>Net skins: lowest unique net score</li>
            <li>Place payouts with tie splits</li>
            <li>Quota increase only if in the money</li>
          </ul>
        </div>
      </section>

      <section className="card wide">
        <h2>Sample Leaderboard</h2>
        <table>
          <thead>
            <tr><th>Player</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Thru</th></tr>
          </thead>
          <tbody>
            {leaderboard.slice(0, 8).map((row) => {
              const cash = payouts.some((p) => p.playerId === row.playerId && p.amount > 0);
              const quotaChange = quotaChangeAfterMoneyRule(row.quotaDiff, cash);
              return (
                <tr key={row.playerId}>
                  <td>{row.name}</td>
                  <td>{row.stablefordPoints}</td>
                  <td>{row.quota}</td>
                  <td>{row.quotaDiff > 0 ? `+${row.quotaDiff}` : row.quotaDiff}</td>
                  <td>{row.holesPlayed}</td>
                  <td>Next quota change: {quotaChange > 0 ? `+${quotaChange}` : quotaChange}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card wide">
        <h2>Sample Skins</h2>
        <div className="chips">
          {skins.map((skin) => (
            <span className="chip" key={skin.holeNumber}>
              Hole {skin.holeNumber}: {skin.winnerPlayerId ? skin.winnerPlayerId : 'No skin'}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
