import type { ScorecardIdentityReview } from '../types/aiScorecard';

type Props = {
  review: ScorecardIdentityReview;
  onClose: () => void;
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function statusClass(ok: boolean | null): string {
  if (ok === true) return 'identity-ok';
  if (ok === false) return 'identity-warning';
  return 'identity-unknown';
}

export default function PlayerRecognitionPanel({ review, onClose }: Props) {
  return (
    <section className="player-recognition-panel" aria-label="Player recognition results">
      <div className="player-recognition-header">
        <div>
          <h4>Card Identity Check</h4>
          <p>Verify the card number, tee time, and player-name matches before reading scores.</p>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      <div className="identity-summary-grid">
        <div className={statusClass(review.cardNumberMatches)}>
          <strong>Card Number</strong>
          <span>AI read: {review.cardNumber ?? 'Unreadable'}</span>
          <span>Expected: {review.expectedCardNumber}</span>
          <small>{percent(review.cardNumberConfidence)} confidence</small>
        </div>
        <div className={statusClass(review.teeTimeMatches)}>
          <strong>Tee Time</strong>
          <span>AI read: {review.teeTime ?? 'Unreadable'}</span>
          <span>Expected: {review.expectedTeeTime || 'Not entered'}</span>
          <small>{percent(review.teeTimeConfidence)} confidence</small>
        </div>
      </div>

      <div className="player-recognition-list">
        <h5>Player Names</h5>
        {review.matchedPlayers.map((player, index) => (
          <div
            key={`${player.rawName}-${index}`}
            className={`player-recognition-row ${player.matchedPlayerId ? 'identity-ok' : 'identity-warning'}`}
          >
            <div>
              <strong>Row {index + 1}: “{player.rawName || 'Unreadable'}”</strong>
              <small>AI text confidence: {percent(player.confidence)}</small>
            </div>
            <div className="player-recognition-arrow">→</div>
            <div>
              <strong>{player.matchedPlayerName ?? 'Needs confirmation'}</strong>
              <small>
                {player.matchMethod === 'alias' ? 'Saved league alias' : player.matchMethod} · {percent(player.matchConfidence)} match
              </small>
              {!player.matchedPlayerId && player.alternatives.length > 0 && (
                <small>Possible: {player.alternatives.join(', ')}</small>
              )}
            </div>
          </div>
        ))}
      </div>

      {review.warnings.length > 0 && (
        <div className="identity-warnings">
          <strong>AI notes</strong>
          {review.warnings.map((warning, index) => <div key={index}>{warning}</div>)}
        </div>
      )}
    </section>
  );
}
