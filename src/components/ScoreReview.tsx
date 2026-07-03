import type { Hole, Player, Score, ScoreAuditEntry } from '../types';
import { holeScoreDetail } from '../lib/scoring';

type Props = {
  players: Player[];
  holes: Hole[];
  scores: Score[];
  auditLog: ScoreAuditEntry[];
  onSetScore: (playerId: string, hole: number, gross: number) => void;
  onDeleteScore: (playerId: string, hole: number) => void;
  onClearAuditLog: () => void;
};

export function ScoreReview({ players, holes, scores, auditLog, onSetScore, onDeleteScore, onClearAuditLog }: Props) {
  const activePlayers = players.filter(p => p.active);
  const missingScores = activePlayers.flatMap(player =>
    holes
      .filter(hole => !scores.some(score => score.playerId === player.id && score.hole === hole.hole))
      .map(hole => ({ player, hole }))
  );

  const enteredCount = scores.filter(score => activePlayers.some(player => player.id === score.playerId)).length;
  const expectedCount = activePlayers.length * 18;

  return <section className="card full">
    <div className="sectionHeader">
      <div>
        <h2>Score Review & Corrections</h2>
        <p>Admin-only screen for checking missing scores, correcting mistakes, and reviewing the correction log before finalizing.</p>
      </div>
      <span className="progressPill">{enteredCount}/{expectedCount} scores entered</span>
    </div>

    {missingScores.length > 0 ? <div className="warning">
      <b>{missingScores.length} scores still missing.</b> Finalization should wait until every active golfer has 18 holes entered.
    </div> : <div className="latestBox"><b>All active golfers have 18 scores entered.</b> The round is ready for payout preview and finalization.</div>}

    <h3>Missing Scores</h3>
    {missingScores.length === 0 ? <p className="muted">No missing scores.</p> : <div className="reviewGrid">
      {missingScores.slice(0, 72).map(({ player, hole }) => <div className="reviewMissing" key={`${player.id}-${hole.hole}`}>
        <b>{player.name}</b>
        <span>Hole {hole.hole} · Par {hole.par}</span>
        <div className="buttons smallButtons">{[2,3,4,5,6,7,8,9,10].map(gross => <button key={gross} onClick={() => onSetScore(player.id, hole.hole, gross)}>{gross}</button>)}</div>
      </div>)}
      {missingScores.length > 72 && <p className="muted">Showing the first 72 missing scores.</p>}
    </div>}

    <h3>Entered Scorecard</h3>
    <div className="scoreReviewTableWrap">
      <table className="scoreReviewTable">
        <thead><tr><th>Player</th>{holes.map(h => <th key={h.hole}>{h.hole}</th>)}</tr></thead>
        <tbody>{activePlayers.map(player => <tr key={player.id}>
          <td><b>{player.name}</b><br/><small>HDCP {player.handicap} · Quota {player.quota}</small></td>
          {holes.map(hole => {
            const detail = holeScoreDetail(player, hole, scores);
            return <td key={hole.hole}>
              <select value={detail.gross ?? ''} onChange={e => {
                const value = Number(e.target.value);
                if (value) onSetScore(player.id, hole.hole, value);
                else onDeleteScore(player.id, hole.hole);
              }}>
                <option value="">—</option>
                {[2,3,4,5,6,7,8,9,10].map(gross => <option key={gross} value={gross}>{gross}</option>)}
              </select>
              {detail.gross && <small>Net {detail.net}<br/>{detail.points} pts</small>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>

    <div className="sectionHeader">
      <div>
        <h3>Correction Log</h3>
        <p>Tracks score changes made on this device. This is especially useful after a round is reviewed in the clubhouse.</p>
      </div>
      <button disabled={auditLog.length === 0} onClick={onClearAuditLog}>Clear Log</button>
    </div>
    {auditLog.length === 0 ? <p className="muted">No corrections logged yet.</p> : <div className="roundList">
      {auditLog.map(entry => {
        const player = players.find(p => p.id === entry.playerId);
        return <div className="roundCard" key={entry.id}>
          <b>{player?.name ?? entry.playerId}</b> · Hole {entry.hole}
          <p>{entry.oldGross ?? 'blank'} → {entry.newGross ?? 'blank'} by {entry.changedByName} on {new Date(entry.changedAt).toLocaleString()}</p>
        </div>;
      })}
    </div>}
  </section>;
}
