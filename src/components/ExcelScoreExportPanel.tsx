import { useMemo, useState } from 'react';
import type { Player } from '../types';
import type { RoundPlayer } from '../types/roundPlayer';
import type { Scorecard } from '../types/scorecard';
import type { ScorecardEntry } from '../types/scoreEntry';
import { buildExcelScoreExport } from '../engine/excelScoreExportEngine';

type Props = {
  players: Player[];
  roundPlayers: RoundPlayer[];
  scorecards: Scorecard[];
  scorecardEntries: ScorecardEntry[];
};

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!copied) throw new Error('Clipboard copy was not available.');
}

export default function ExcelScoreExportPanel({
  players,
  roundPlayers,
  scorecards,
  scorecardEntries
}: Props) {
  const [message, setMessage] = useState<string>();
  const exportData = useMemo(
    () => buildExcelScoreExport(players, roundPlayers, scorecards, scorecardEntries),
    [players, roundPlayers, scorecards, scorecardEntries]
  );
  const allCardsVerified =
    scorecardEntries.length > 0 &&
    scorecardEntries.every((entry) => entry.status === 'verified');

  if (!allCardsVerified) return null;

  return (
    <section className="card" style={{ marginTop: '1.5rem' }}>
      <p className="eyebrow">Excel Double-Check</p>
      <h3>Copy All League Data for Excel</h3>
      <p>
        Copies the entire league roster with played golfers first in final
        scorecard order. Each row contains exactly 24 columns: play order,
        first name, last name, played indicator, handicap, pre-round quota,
        and Holes 1–18. No header row or fields beyond Hole 18 are copied.
      </p>
      <div className="status-box" style={{ marginTop: '1rem' }}>
        <strong>{exportData.playedCount} played · {exportData.playerCount} roster rows</strong>
        <div>Paste into Column A. The copied data ends in Column X, leaving Columns Y and beyond untouched.</div>
      </div>

      {exportData.errors.length > 0 ? (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          <strong>Cannot copy yet</strong>
          <ul style={{ marginBottom: 0 }}>
            {exportData.errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          style={{ marginTop: '1rem' }}
          onClick={async () => {
            try {
              await copyText(exportData.text);
              setMessage(`Copied ${exportData.playerCount} rows × 24 columns to the clipboard.`);
            } catch (error) {
              setMessage(error instanceof Error ? error.message : 'Could not copy to the clipboard.');
            }
          }}
        >
          Copy All League Data for Excel
        </button>
      )}

      {message && <div className="status-box" style={{ marginTop: '1rem' }}>{message}</div>}
    </section>
  );
}
