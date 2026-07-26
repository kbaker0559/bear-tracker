import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type { ScorecardImport, ScoreConfidence } from '../types/scorecardImport';

type Props = {
  scorecard: Scorecard;
  players: Player[];
  scorecardImport: ScorecardImport;
  onChangeCell: (
    playerId: string,
    holeNumber: number,
    score: number | null,
    confidence: ScoreConfidence
  ) => void;
  onImportConfirmedScores: () => void;
  onClose: () => void;
};

const HOLES = Array.from({ length: 18 }, (_, index) => index + 1);

function playerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

export default function ScorecardImportReview({
  scorecard,
  players,
  scorecardImport,
  onChangeCell,
  onImportConfirmedScores,
  onClose
}: Props) {
  const confirmedCount = scorecardImport.cells.filter(
    (cell) => cell.confirmedScore !== null
  ).length;
  const totalCount = scorecardImport.cells.length;
  const readyToImport = totalCount > 0 && confirmedCount === totalCount;

  return (
    <section className="scorecard-import-review" aria-label={`Review Card ${scorecard.cardNumber} score import`}>
      <div className="scorecard-import-review-header">
        <div>
          <h4>Review Card {scorecard.cardNumber}</h4>
          <p>
            The image-reading service is not connected yet. This review grid is the working shell it will populate.
            Enter or correct every score before importing.
          </p>
        </div>
        <button type="button" onClick={onClose}>Close Review</button>
      </div>

      <div className="scorecard-import-progress">
        <strong>{confirmedCount} of {totalCount}</strong> hole scores confirmed
      </div>

      <div className="scorecard-import-table-wrap">
        <table className="scorecard-import-table">
          <thead>
            <tr>
              <th>Player</th>
              {HOLES.map((hole) => <th key={hole}>{hole}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {scorecard.players.map((scorecardPlayer) => {
              const cells = HOLES.map((holeNumber) =>
                scorecardImport.cells.find(
                  (cell) => cell.playerId === scorecardPlayer.playerId && cell.holeNumber === holeNumber
                )
              );
              const total = cells.every((cell) => cell?.confirmedScore !== null && cell?.confirmedScore !== undefined)
                ? cells.reduce((sum, cell) => sum + (cell?.confirmedScore ?? 0), 0)
                : null;

              return (
                <tr key={scorecardPlayer.playerId}>
                  <th>{playerName(players, scorecardPlayer.playerId)}</th>
                  {cells.map((cell, index) => {
                    const confidence = cell?.confidence ?? 'missing';
                    return (
                      <td key={index} className={`score-confidence-${confidence}`}>
                        <input
                          aria-label={`${playerName(players, scorecardPlayer.playerId)} hole ${index + 1}`}
                          type="number"
                          min={1}
                          max={15}
                          inputMode="numeric"
                          value={cell?.confirmedScore ?? ''}
                          onChange={(event) => {
                            const value = event.target.value === '' ? null : Number(event.target.value);
                            onChangeCell(
                              scorecardPlayer.playerId,
                              index + 1,
                              Number.isFinite(value) ? value : null,
                              value === null ? 'missing' : 'high'
                            );
                          }}
                        />
                      </td>
                    );
                  })}
                  <td className="scorecard-import-total">{total ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="scorecard-import-legend">
        <span><i className="confidence-swatch high" /> Confirmed</span>
        <span><i className="confidence-swatch medium" /> Verify</span>
        <span><i className="confidence-swatch low" /> Low confidence</span>
        <span><i className="confidence-swatch missing" /> Missing</span>
      </div>

      <div className="scorecard-import-actions">
        <button
          type="button"
          disabled={!readyToImport}
          onClick={onImportConfirmedScores}
        >
          Import Confirmed Scores
        </button>
        {!readyToImport && <small>All {totalCount} hole scores must be confirmed first.</small>}
      </div>
    </section>
  );
}
