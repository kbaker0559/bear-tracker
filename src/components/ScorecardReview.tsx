import { Fragment } from 'react';
import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type {
  PlayerScoreEntry,
  ScorecardEntry
} from '../types/scoreEntry';

type Props = {
  scorecard: Scorecard;
  scorecardEntry: ScorecardEntry;
  players: Player[];

  onEditPlayer: (playerIndex: number) => void;
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
  onVerify,
  onClose
}: Props) {
  const cardComplete =
    scorecardEntry.players.every(
      isPlayerComplete
    );

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
            Compare these totals with the paper scorecard
            before verification.
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
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom:
                    '2px solid rgba(0, 0, 0, 0.18)'
                }}
              >
                Player
              </th>

              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom:
                    '2px solid rgba(0, 0, 0, 0.18)'
                }}
              >
                Type
              </th>

              <th style={headerNumberStyle}>
                Out
              </th>

              <th style={headerNumberStyle}>
                In
              </th>

              <th style={headerNumberStyle}>
                Total
              </th>

              <th style={headerNumberStyle}>
                Quota
              </th>

              <th style={headerNumberStyle}>
                +/-
              </th>

              <th
                style={{
                  padding: '0.75rem',
                  borderBottom:
                    '2px solid rgba(0, 0, 0, 0.18)'
                }}
              >
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
                        style={{
                          padding: '0.75rem',
                          textAlign: 'left',
                          verticalAlign: 'middle',
                          borderBottom:
                            '1px solid rgba(0, 0, 0, 0.14)'
                        }}
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

                      <th
                        style={rowLabelStyle}
                      >
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
                        style={{
                          ...numberCellStyle,
                          verticalAlign: 'middle'
                        }}
                      >
                        {playerEntry.quota}
                      </td>

                      <td
                        rowSpan={2}
                        style={{
                          ...numberCellStyle,
                          verticalAlign: 'middle',
                          fontWeight: 700
                        }}
                      >
                        {formatQuotaResult(
                          playerEntry.quotaResult
                        )}
                      </td>

                      <td
                        rowSpan={2}
                        style={{
                          padding: '0.75rem',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          borderBottom:
                            '1px solid rgba(0, 0, 0, 0.14)'
                        }}
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
                      <th
                        style={{
                          ...rowLabelStyle,
                          borderBottom:
                            '1px solid rgba(0, 0, 0, 0.14)'
                        }}
                      >
                        Points
                      </th>

                      <td
                        style={{
                          ...numberCellStyle,
                          borderBottom:
                            '1px solid rgba(0, 0, 0, 0.14)'
                        }}
                      >
                        {playerEntry.frontNinePoints ??
                          '—'}
                      </td>

                      <td
                        style={{
                          ...numberCellStyle,
                          borderBottom:
                            '1px solid rgba(0, 0, 0, 0.14)'
                        }}
                      >
                        {playerEntry.backNinePoints ??
                          '—'}
                      </td>

                      <td
                        style={{
                          ...numberCellStyle,
                          borderBottom:
                            '1px solid rgba(0, 0, 0, 0.14)',
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
            {cardComplete
              ? 'Ready to verify'
              : 'Scores are incomplete'}
          </strong>
        </div>

        <button
          type="button"
          disabled={!cardComplete}
          onClick={onVerify}
        >
          Verify Scorecard
        </button>
      </div>
    </section>
  );
}

const headerNumberStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const rowLabelStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const
};

const numberCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const
};