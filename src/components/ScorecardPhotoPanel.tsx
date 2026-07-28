import { useState } from 'react';
import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type { ScorecardImport, ScoreConfidence } from '../types/scorecardImport';
import type { ScorecardIdentityReview } from '../types/aiScorecard';
import ScorecardViewer from './ScorecardViewer';
import ScorecardImportReview from './ScorecardImportReview';
import PlayerRecognitionPanel from './PlayerRecognitionPanel';

type Props = {
  scorecard: Scorecard;
  players: Player[];
  scorecardImport: ScorecardImport | null;
  onAttachPhoto: (file: File) => Promise<void>;
  onRemovePhoto: () => void;
  onBeginReview: () => void;
  onRecognizeIdentity: () => Promise<ScorecardIdentityReview>;
  onReadScorecard: () => Promise<void>;
  onChangeImportCell: (playerId: string, holeNumber: number, score: number | null, confidence: ScoreConfidence) => void;
  onImportConfirmedScores: () => void;
};

export default function ScorecardPhotoPanel({
  scorecard,
  players,
  scorecardImport,
  onAttachPhoto,
  onRemovePhoto,
  onBeginReview,
  onRecognizeIdentity,
  onReadScorecard,
  onChangeImportCell,
  onImportConfirmedScores
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [identityReading, setIdentityReading] = useState(false);
  const [identityReview, setIdentityReview] = useState<ScorecardIdentityReview | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const cardNumber = scorecard.cardNumber;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onAttachPhoto(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The photo could not be attached.');
    } finally {
      setBusy(false);
    }
  }

  const imageUrl = scorecardImport?.imageUrl;
  const originalImageUrl = scorecardImport?.originalImageUrl;
  const displayedImageUrl = showOriginal && originalImageUrl ? originalImageUrl : imageUrl;

  return (
    <div className="scorecard-photo-panel">
      <div className="scorecard-photo-heading">
        <strong>Paper Scorecard Photo</strong>
        <span>{imageUrl ? 'Attached' : 'Not attached'}</span>
      </div>

      {imageUrl ? (
        <>
          <button
            type="button"
            className="scorecard-photo-preview-button"
            onClick={() => setViewerOpen(true)}
            aria-label={`Open full-size scorecard viewer for Card ${cardNumber}`}
          >
            <img
              className="scorecard-photo-preview"
              src={displayedImageUrl}
              alt={`Paper scorecard for Card ${cardNumber}`}
            />
            <span>{showOriginal ? 'View Original Full Size' : 'View AI-Prepared Full Size'}</span>
          </button>

          {scorecardImport?.imagePreparation && (
            <div className="scorecard-image-preparation">
              <strong>AI image preparation</strong>
              <span>{scorecardImport.imagePreparation.message}</span>
              {originalImageUrl && originalImageUrl !== imageUrl && (
                <button type="button" onClick={() => setShowOriginal((current) => !current)}>
                  {showOriginal ? 'Show AI-Prepared Image' : 'Compare Original Photo'}
                </button>
              )}
            </div>
          )}

          <div className="scorecard-photo-actions">
            <button
              type="button"
              disabled={identityReading || reading}
              onClick={async () => {
                setIdentityReading(true);
                setError('');
                try {
                  const result = await onRecognizeIdentity();
                  setIdentityReview(result);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : 'The card identity could not be read.');
                } finally {
                  setIdentityReading(false);
                }
              }}
            >
              {identityReading ? 'Identifying Card…' : 'Identify Card & Players'}
            </button>
            <button
              type="button"
              disabled={reading || identityReading}
              onClick={async () => {
                setReading(true);
                setError('');
                try {
                  await onReadScorecard();
                  setReviewOpen(true);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : 'The scorecard could not be read.');
                } finally {
                  setReading(false);
                }
              }}
            >
              {reading ? 'Reading Scorecard…' : 'Read Scorecard with AI'}
            </button>
            <button type="button" onClick={() => { onBeginReview(); setReviewOpen(true); }}>Open Manual Review</button>
            <label className="button-like">
              {busy ? 'Preparing Photo…' : 'Replace Photo'}
              <input
                hidden
                type="file"
                accept="image/*"
                capture="environment"
                disabled={busy}
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <button type="button" onClick={onRemovePhoto}>Remove Photo</button>
          </div>
        </>
      ) : (
        <label className="button-like scorecard-photo-upload">
          {busy ? 'Preparing Photo…' : 'Take or Choose Photo'}
          <input
            hidden
            type="file"
            accept="image/*"
            capture="environment"
            disabled={busy}
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
      )}

      <small>
        The photo stays with this round and can be opened beside score entry for verification.
      </small>
      {error && <div className="status-box">{error}</div>}


      {identityReview && (
        <PlayerRecognitionPanel
          review={identityReview}
          onClose={() => setIdentityReview(null)}
        />
      )}

      {reviewOpen && scorecardImport && (
        <ScorecardImportReview
          scorecard={scorecard}
          players={players}
          scorecardImport={scorecardImport}
          onChangeCell={onChangeImportCell}
          onImportConfirmedScores={onImportConfirmedScores}
          onClose={() => setReviewOpen(false)}
        />
      )}

      {viewerOpen && imageUrl && (
        <ScorecardViewer
          imageUrl={displayedImageUrl ?? imageUrl}
          cardNumber={cardNumber}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
