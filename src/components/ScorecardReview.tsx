import { Fragment, useMemo, useState } from 'react';
import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type {
  PlayerScoreEntry,
  ScorecardEntry
} from '../types/scoreEntry';
import type { PaperPlayerTotals } from '../types/paperScorecardTotals';
import {
  hasPaperTotals,
  validateScorecardEntry
} from '../engine/scorecardValidationEngine';
import PaperScorecardTotalsEntry from './PaperScorecardTotalsEntry';

type Props = {
  scorecard: Scorecard;
  scorecardEntry: ScorecardEntry;
  players: Player[];

  onEditPlayer: (playerIndex: number) => void;

  onSavePaperTotals: (
    paperTotals: PaperPlayerTotals
  ) => void;

  onVerify: () => void;
  onClose: () => void;
};

function playerName(
  playerId: string,
  players: Player[]
): string {
  return (
    players.find(
      (player) => player.id === playerId
    )?.name ?? playerId
  );
}

function formatQuotaResult(
  value: number | null
): string {
  if (value === null) {
    return '—';
  }

  if (value > 0) {
    return `+${value}`;
  }

  if (value === 0) {
    return 'E';
  }

  return String(value);
}

function isPlayerComplete(
  entry: PlayerScoreEntry
): boolean {
  return entry.scores.every(
    (score) => score.grossScore !== null
  );
}

export default function ScorecardReview({
  scorecard,
  scorecardEntry,
  players,
  onEditPlayer,
  onSavePaperTotals,
  onVerify,
  onClose
}: Props) {
  const cardComplete =
    scorecardEntry.players.every(
      isPlayerComplete
    );

  const validation = useMemo(
    () =>
      validateScorecardEntry(
        scorecardEntry
      ),
    [scorecardEntry]
  );

  const paperTotalsStarted =
    hasPaperTotals(scorecardEntry);

  const [showPaperTotals, setShowPaperTotals] =
    useState(paperTotalsStarted);

  const readyToVerify =
    cardComplete && validation.passed;

  return (
    <section className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <p className="eyebrow">
            Card {scorecard.cardNumber}
          </p>

          <h2>Review Scorecard</h2>

          <p>
            Review Bear Tracker’s calculated totals. Paper
            totals are optional and only needed when you
            are investigating a discrepancy.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          Back to Scorecard Queue
        </button>
      </div>

      <div
        style={{
          overflowX: 'auto',
          marginTop: '1.5rem'
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '760px',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr>
              <th style={leftHeaderStyle}>
                Player
              </th>

              <th style={leftHeaderStyle}>
                Type
              </th>

              <th style={numberHeaderStyle}>
                Out
              </th>

              <th style={numberHeaderStyle}>
                In
              </th>

              <th style={numberHeaderStyle}>
                Total
              </th>

              <th style={numberHeaderStyle}>
                Quota
              </th>

              <th style={numberHeaderStyle}>
                +/-
              </th>

              <th style={actionHeaderStyle}>
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {scorecardEntry.players.map(
              (playerEntry, playerIndex) => {
                const complete =
                  isPlayerComplete(playerEntry);

                return (
                  <Fragment
                    key={playerEntry.playerId}
                  >
                    <tr>
                      <th
                        rowSpan={2}
                        style={playerCellStyle}
                      >
                        <div>
                          {playerName(
                            playerEntry.playerId,
                            players
                          )}
                        </div>

                        <div
                          style={{
                            marginTop: '0.25rem',
                            fontWeight: 400,
                            fontSize: '0.9rem'
                          }}
                        >
                          {complete
                            ? 'Complete'
                            : 'Incomplete'}
                        </div>
                      </th>

                      <th style={rowLabelStyle}>
                        Score
                      </th>

                      <td style={numberCellStyle}>
                        {playerEntry.frontNineGrossTotal ??
                          '—'}
                      </td>

                      <td style={numberCellStyle}>
                        {playerEntry.backNineGrossTotal ??
                          '—'}
                      </td>

                      <td
                        style={{
                          ...numberCellStyle,
                          fontWeight: 700
                        }}
                      >
                        {playerEntry.grossTotal ??
                          '—'}
                      </td>

                      <td
                        rowSpan={2}
                        style={combinedCellStyle}
                      >
                        {playerEntry.quota}
                      </td>

                      <td
                        rowSpan={2}
                        style={{
                          ...combinedCellStyle,
                          fontWeight: 700
                        }}
                      >
                        {formatQuotaResult(
                          playerEntry.quotaResult
                        )}
                      </td>

                      <td
                        rowSpan={2}
                        style={actionCellStyle}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onEditPlayer(playerIndex)
                          }
                        >
                          Edit Player
                        </button>
                      </td>
                    </tr>

                    <tr>
                      <th style={bottomRowLabelStyle}>
                        Points
                      </th>

                      <td style={bottomNumberCellStyle}>
                        {playerEntry.frontNinePoints ??
                          '—'}
                      </td>

                      <td style={bottomNumberCellStyle}>
                        {playerEntry.backNinePoints ??
                          '—'}
                      </td>

                      <td
                        style={{
                          ...bottomNumberCellStyle,
                          fontWeight: 700
                        }}
                      >
                        {playerEntry.stablefordPoints ??
                          '—'}
                      </td>
                    </tr>
                  </Fragment>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: '1.5rem'
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowPaperTotals(
              (current) => !current
            )
          }
        >
          {showPaperTotals
            ? 'Hide Paper Discrepancy Review'
            : 'Investigate Paper Discrepancy (Optional)'}
        </button>
      </div>

      {showPaperTotals && (
        <PaperScorecardTotalsEntry
          scorecardEntry={scorecardEntry}
          players={players}
          onSavePlayerTotals={
            onSavePaperTotals
          }
        />
      )}

      <section
        className="card"
        style={{
          marginTop: '1.5rem'
        }}
      >
        <h3>Scorecard Validation</h3>

        {!paperTotalsStarted && (
          <div className="status-box">
            ✓ Calculated totals are ready for review. Paper
            totals are optional.
          </div>
        )}

        {paperTotalsStarted &&
          validation.passed && (
            <div className="status-box">
              ✓ The entered paper totals match Bear
              Tracker’s calculations.
            </div>
          )}

        {validation.issues.length > 0 && (
          <div>
            <div className="status-box">
              ⚠ Validation differences were found. Review
              them before verifying the scorecard.
            </div>

            <div
              style={{
                marginTop: '1rem',
                display: 'grid',
                gap: '0.75rem'
              }}
            >
              {validation.issues.map(
                (issue, index) => (
                  <div
                    key={`${issue.playerId}-${issue.field}-${index}`}
                    style={{
                      padding: '0.75rem',
                      border:
                        '1px solid rgba(0, 0, 0, 0.16)',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <strong>
                      {playerName(
                        issue.playerId,
                        players
                      )}
                    </strong>

                    <div
                      style={{
                        marginTop: '0.25rem'
                      }}
                    >
                      {issue.message}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>

      <div
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          Status:{' '}
          <strong>
            {!cardComplete
              ? 'Scores are incomplete'
              : validation.passed
                ? 'Ready to verify'
                : 'Validation differences require review'}
          </strong>
        </div>

        <button
          type="button"
          disabled={!readyToVerify}
          onClick={onVerify}
        >
          Verify Scorecard
        </button>
      </div>
    </section>
  );
}

const leftHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const numberHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const actionHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const playerCellStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const rowLabelStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const
};

const numberCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const
};

const combinedCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  verticalAlign: 'middle' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const actionCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  verticalAlign: 'middle' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const bottomRowLabelStyle = {
  ...rowLabelStyle,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const bottomNumberCellStyle = {
  ...numberCellStyle,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};