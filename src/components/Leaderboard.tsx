import type { PlayerResult } from '../types';

type Props = { results: PlayerResult[] };

export function Leaderboard({ results }: Props) {
  const completedScores = results.reduce((sum, r) => sum + r.thru, 0);
  const possibleScores = results.length * 18;
  const percent = possibleScores ? Math.round((completedScores / possibleScores) * 100) : 0;

  return <section className="card full">
    <div className="sectionHeader">
      <div><h2>Live Leaderboard</h2><p>Sorted by quota +/- first. The leader is the golfer with the best plus/minus number.</p></div>
      <div className="progressPill">{completedScores}/{possibleScores} scores · {percent}%</div>
    </div>
    <table><thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Gross</th><th>Net</th><th>Pts</th><th>Quota</th><th>+/-</th><th>Projected</th></tr></thead><tbody>{results.map((r,i)=><tr key={r.player.id}><td>{i+1}</td><td>{r.player.name}</td><td>{r.thru}</td><td>{r.gross || '-'}</td><td>{r.net || '-'}</td><td>{r.points}</td><td>{r.player.quota}</td><td className={r.quotaDiff>=0?'good':'bad'}>{r.quotaDiff>0?'+':''}{r.quotaDiff}</td><td className={r.projectedDiff>=0?'good':'bad'}>{r.thru ? `${r.projectedDiff>0?'+':''}${r.projectedDiff}` : '-'}</td></tr>)}</tbody></table>
  </section>;
}
