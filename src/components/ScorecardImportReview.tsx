import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type { ScorecardImport, ScoreConfidence, ScorecardPlayerTotalsReview } from '../types/scorecardImport';

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

function sumScores(values: Array<number | null>, start: number, end: number): number | null {
  const slice = values.slice(start, end);
  return slice.every((value) => value !== null)
    ? slice.reduce((sum, value) => sum + (value ?? 0), 0)
    : null;
}

function comparisonClass(calculated: number | null, handwritten: number | null): string {
  if (calculated === null || handwritten === null) return 'total-unavailable';
  return calculated === handwritten ? 'total-match' : 'total-mismatch';
}

function totalTitle(calculated: number | null, handwritten: number | null): string {
  if (handwritten === null) return `Calculated: ${calculated ?? 'unavailable'}; no handwritten total was read.`;
  return `Calculated: ${calculated ?? 'unavailable'}; handwritten: ${handwritten}.`;
}

function totalsForPlayer(scorecardImport: ScorecardImport, playerId: string): ScorecardPlayerTotalsReview | undefined {
  return scorecardImport.playerTotals?.find((totals) => totals.playerId === playerId);
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
  const unresolvedIssues = scorecardImport.issues.filter((issue) => !issue.resolved);
  const automaticDecisions = scorecardImport.recognitionDecisions ?? [];

  return (
    <section className="scorecard-import-review" aria-label={`Review Card ${scorecard.cardNumber} score import`}>
      <div className="scorecard-import-review-header">
        <div>
          <h4>Review Card {scorecard.cardNumber}</h4>
          <p>
            AI results are loaded below. High-confidence scores are confirmed automatically. OUT, IN, and Total compare Bear Tracker&apos;s arithmetic with the handwritten card totals.
          </p>
        </div>
        <button type="button" onClick={onClose}>Close Review</button>
      </div>

      <div className="scorecard-import-progress">
        <strong>{confirmedCount} of {totalCount}</strong> hole scores confirmed
        {unresolvedIssues.length > 0 && <span> · {unresolvedIssues.length} item{unresolvedIssues.length === 1 ? '' : 's'} flagged</span>}
      </div>

      {automaticDecisions.length > 0 && (
        <div className="rve-summary">
          <strong>Golf validation resolved {automaticDecisions.length} score{automaticDecisions.length === 1 ? '' : 's'} automatically</strong>
          <p>Corrections used NET/stroke allocation and, when uniquely decisive, handwritten OUT or IN totals.</p>
          <details>
            <summary>Explain automatic corrections</summary>
            <ul>
              {automaticDecisions.map((decision) => (
                <li key={decision.id}>
                  <strong>{playerName(players, decision.playerId)}, hole {decision.holeNumber}: {decision.originalScore ?? 'unreadable'} → {decision.recommendedScore}</strong>
                  <ul>{decision.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      <div className="scorecard-import-table-wrap">
        <table className="scorecard-import-table">
          <thead>
            <tr>
              <th>Player</th>
              {HOLES.map((hole) => <th key={hole}>{hole}</th>)}
              <th>OUT</th>
              <th>IN</th>
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
              const currentScores = cells.map((cell) => cell?.confirmedScore ?? cell?.extractedScore ?? null);
              const frontNine = sumScores(currentScores, 0, 9);
              const backNine = sumScores(currentScores, 9, 18);
              const total = frontNine !== null && backNine !== null ? frontNine + backNine : null;
              const recognizedTotals = totalsForPlayer(scorecardImport, scorecardPlayer.playerId);

              return (
                <tr key={scorecardPlayer.playerId}>
                  <th>{playerName(players, scorecardPlayer.playerId)}</th>
                  {cells.map((cell, index) => {
                    const confidence = cell?.confidence ?? 'missing';
                    const explanation = [
                      cell?.reviewReason,
                      ...(cell?.validationNotes ?? []),
                      cell?.extractedNetScore !== null && cell?.extractedNetScore !== undefined ? `NET read: ${cell.extractedNetScore}` : undefined
                    ].filter(Boolean).join(' ');
                    return (
                      <td
                        key={index}
                        className={`score-confidence-${confidence}${cell?.correctedByValidation ? ' rve-corrected-cell' : ''}`}
                        title={explanation}
                      >
                        {cell?.correctedByValidation && <span className="rve-corrected-badge" aria-label="Corrected by golf validation">RVE</span>}
                        <input
                          aria-label={`${playerName(players, scorecardPlayer.playerId)} hole ${index + 1}`}
                          type="number"
                          min={1}
                          max={15}
                          inputMode="numeric"
                          value={cell?.confirmedScore ?? cell?.extractedScore ?? ''}
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
                  <td
                    className={`scorecard-import-total ${comparisonClass(frontNine, recognizedTotals?.handwrittenFrontNine ?? null)}`}
                    title={totalTitle(frontNine, recognizedTotals?.handwrittenFrontNine ?? null)}
                  >
                    {frontNine ?? '—'}
                    {recognizedTotals?.handwrittenFrontNine !== null && recognizedTotals?.handwrittenFrontNine !== undefined && (
                      <small>card {recognizedTotals.handwrittenFrontNine}</small>
                    )}
                  </td>
                  <td
                    className={`scorecard-import-total ${comparisonClass(backNine, recognizedTotals?.handwrittenBackNine ?? null)}`}
                    title={totalTitle(backNine, recognizedTotals?.handwrittenBackNine ?? null)}
                  >
                    {backNine ?? '—'}
                    {recognizedTotals?.handwrittenBackNine !== null && recognizedTotals?.handwrittenBackNine !== undefined && (
                      <small>card {recognizedTotals.handwrittenBackNine}</small>
                    )}
                  </td>
                  <td
                    className={`scorecard-import-total ${comparisonClass(total, recognizedTotals?.handwrittenTotal ?? null)}`}
                    title={totalTitle(total, recognizedTotals?.handwrittenTotal ?? null)}
                  >
                    {total ?? '—'}
                    {recognizedTotals?.handwrittenTotal !== null && recognizedTotals?.handwrittenTotal !== undefined && (
                      <small>card {recognizedTotals.handwrittenTotal}</small>
                    )}
                  </td>
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
        <span><i className="confidence-swatch total-match" /> Total agrees</span>
        <span><i className="confidence-swatch total-mismatch" /> Total disagrees</span>
      </div>

      {unresolvedIssues.length > 0 && (
        <div className="scorecard-import-issues">
          <strong>Review notes</strong>
          <ul>
            {unresolvedIssues.map((issue) => <li key={issue.id}>{issue.message}</li>)}
          </ul>
        </div>
      )}

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
