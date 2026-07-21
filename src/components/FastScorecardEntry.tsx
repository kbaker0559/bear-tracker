import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type {
  HoleScore,
  ScorecardEntry
} from '../types/scoreEntry';

type Props = {
  scorecard: Scorecard;
  scorecardEntry: ScorecardEntry;
  players: Player[];
  initialPlayerIndex?: number;

  onUpdateScore: (
    playerId: string,
    holeNumber: number,
    grossScore: number | null
  ) => void;

  onReview: () => void;
  onClose: () => void;
};

type NineSummaryProps = {
  label: string;
  grossTotal: number | null;
  pointsTotal: number | null;
};

function NineSummary({
  label,
  grossTotal,
  pointsTotal
}: NineSummaryProps) {
  return (
    <div className="score-grid">
      <div className="score-row">
        <strong>{label} Gross</strong>
        <span>{grossTotal ?? '—'}</span>
      </div>

      <div className="score-row">
        <strong>{label} Points</strong>
        <span>{pointsTotal ?? '—'}</span>
      </div>
    </div>
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

  return String(value);
}

export default function FastScorecardEntry({
  scorecard,
  scorecardEntry,
  players,
  initialPlayerIndex = 0,
  onUpdateScore,
  onReview,
  onClose
}: Props) {
  const [activePlayerIndex, setActivePlayerIndex] =
    useState(initialPlayerIndex);

  const inputRefs = useRef<
    Record<number, HTMLInputElement | null>
  >({});

  const entryTopRef =
    useRef<HTMLElement | null>(null);

  const confirmationPanelRef =
    useRef<HTMLElement | null>(null);

  const previousCompletionRef = useRef<
    Record<string, boolean>
  >({});

  const orderedPlayers = useMemo(
    () =>
      scorecard.players.map((scorecardPlayer) => ({
        scorecardPlayer,

        player:
          players.find(
            (candidate) =>
              candidate.id ===
              scorecardPlayer.playerId
          ) ?? null,

        entry:
          scorecardEntry.players.find(
            (candidate) =>
              candidate.playerId ===
              scorecardPlayer.playerId
          ) ?? null
      })),
    [scorecard, scorecardEntry, players]
  );

  const activePlayerRecord =
    orderedPlayers[activePlayerIndex] ?? null;

  const activePlayer =
    activePlayerRecord?.player ?? null;

  const activePlayerEntry =
    activePlayerRecord?.entry ?? null;

  const activePlayerId =
    activePlayerRecord?.scorecardPlayer.playerId ??
    '';

  const isLastPlayer =
    activePlayerIndex ===
    orderedPlayers.length - 1;

  const playerComplete =
    activePlayerEntry?.scores.every(
      (score) => score.grossScore !== null
    ) ?? false;

  const cardComplete =
    scorecardEntry.players.every(
      (playerEntry) =>
        playerEntry.scores.every(
          (score) =>
            score.grossScore !== null
        )
    );

  useEffect(() => {
    setActivePlayerIndex(initialPlayerIndex);
  }, [initialPlayerIndex]);

  useEffect(() => {
    if (
      activePlayerIndex >= orderedPlayers.length &&
      orderedPlayers.length > 0
    ) {
      setActivePlayerIndex(
        orderedPlayers.length - 1
      );
    }
  }, [
    activePlayerIndex,
    orderedPlayers.length
  ]);

  useEffect(() => {
    if (!activePlayerId) {
      return;
    }

    const firstEmptyHole =
      activePlayerEntry?.scores.find(
        (score) => score.grossScore === null
      )?.holeNumber ?? 1;

    entryTopRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    window.setTimeout(() => {
      inputRefs.current[firstEmptyHole]?.focus({
        preventScroll: true
      });
    }, 350);
  }, [activePlayerId]);

  useEffect(() => {
  if (!activePlayerId) {
    return;
  }

  previousCompletionRef.current[
    activePlayerId
  ] = playerComplete;
}, [activePlayerId, playerComplete]);

  function getHoleScore(
    holeNumber: number
  ): HoleScore | null {
    return (
      activePlayerEntry?.scores.find(
        (score) =>
          score.holeNumber === holeNumber
      ) ?? null
    );
  }

  function handleScoreChange(
    holeNumber: number,
    rawValue: string
  ) {
    if (!activePlayerId) {
      return;
    }

    if (rawValue === '') {
      onUpdateScore(
        activePlayerId,
        holeNumber,
        null
      );

      return;
    }

    const parsedScore = Number(rawValue);

    if (
      !Number.isInteger(parsedScore) ||
      parsedScore < 1 ||
      parsedScore > 9
    ) {
      return;
    }

    onUpdateScore(
      activePlayerId,
      holeNumber,
      parsedScore
    );

    window.setTimeout(() => {
      focusNextHole(holeNumber);
    }, 0);
  }

  function focusHole(holeNumber: number) {
    inputRefs.current[holeNumber]?.focus();
  }

  function focusNextHole(holeNumber: number) {
    if (holeNumber < 18) {
      focusHole(holeNumber + 1);
    }
  }

  function focusPreviousHole(
    holeNumber: number
  ) {
    if (holeNumber > 1) {
      focusHole(holeNumber - 1);
      return;
    }

    if (activePlayerIndex > 0) {
      setActivePlayerIndex(
        (current) => current - 1
      );
    }
  }

  function goToPreviousPlayer() {
    if (activePlayerIndex === 0) {
      return;
    }

    setActivePlayerIndex(
      (current) => current - 1
    );
  }

  function goToNextPlayer() {
    if (isLastPlayer || !playerComplete) {
      return;
    }

    setActivePlayerIndex(
      (current) => current + 1
    );
  }

  function editScores() {
    entryTopRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    window.setTimeout(() => {
      inputRefs.current[1]?.focus({
        preventScroll: true
      });
    }, 350);
  }

  function scoreLabel(
    points: number | null
  ): string {
    if (points === null) {
      return '';
    }

    if (points === 0) {
      return 'Double bogey or worse';
    }

    if (points === 1) {
      return 'Bogey';
    }

    if (points === 2) {
      return 'Par';
    }

    if (points === 4) {
      return 'Birdie';
    }

    if (points === 6) {
      return 'Eagle';
    }

    if (points === 8) {
      return 'Double eagle';
    }

    return '';
  }

  function renderNine(
    startHole: number,
    endHole: number
  ) {
    const holeNumbers = Array.from(
      {
        length: endHole - startHole + 1
      },
      (_, index) => startHole + index
    );

    return (
      <div
        style={{
          overflowX: 'auto',
          marginTop: '1rem'
        }}
      >
        <table
          style={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '0.5rem',
                  textAlign: 'left',
                  minWidth: '6rem'
                }}
              >
                Hole
              </th>

              {holeNumbers.map((holeNumber) => (
                <th
                  key={holeNumber}
                  style={{
                    padding: '0.5rem',
                    minWidth: '4rem',
                    textAlign: 'center'
                  }}
                >
                  {holeNumber}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <tr>
              <th
                style={{
                  padding: '0.5rem',
                  textAlign: 'left'
                }}
              >
                Gross
              </th>

              {holeNumbers.map((holeNumber) => {
                const holeScore =
                  getHoleScore(holeNumber);

                return (
                  <td
                    key={holeNumber}
                    style={{
                      padding: '0.25rem',
                      textAlign: 'center'
                    }}
                  >
                    <input
                      ref={(element) => {
                        inputRefs.current[
                          holeNumber
                        ] = element;
                      }}
                      type="number"
                      min={1}
                      max={9}
                      inputMode="numeric"
                      value={
                        holeScore?.grossScore ?? ''
                      }
                      onChange={(event) =>
                        handleScoreChange(
                          holeNumber,
                          event.target.value
                        )
                      }
                      onFocus={(event) =>
                        event.currentTarget.select()
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === 'ArrowRight'
                        ) {
                          event.preventDefault();
                          focusNextHole(holeNumber);
                        }

                        if (
                          event.key === 'ArrowLeft'
                        ) {
                          event.preventDefault();
                          focusPreviousHole(
                            holeNumber
                          );
                        }
                      }}
                      style={{
                        width: '3.25rem',
                        padding: '0.5rem',
                        textAlign: 'center',
                        fontSize: '1rem'
                      }}
                    />
                  </td>
                );
              })}
            </tr>

            <tr>
              <th
                style={{
                  padding: '0.5rem',
                  textAlign: 'left'
                }}
              >
                Stroke
              </th>

              {holeNumbers.map((holeNumber) => {
                const holeScore =
                  getHoleScore(holeNumber);

                return (
                  <td
                    key={holeNumber}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'center'
                    }}
                  >
                    {holeScore?.handicapStrokes ??
                      '—'}
                  </td>
                );
              })}
            </tr>

            <tr>
              <th
                style={{
                  padding: '0.5rem',
                  textAlign: 'left'
                }}
              >
                Net
              </th>

              {holeNumbers.map((holeNumber) => {
                const holeScore =
                  getHoleScore(holeNumber);

                return (
                  <td
                    key={holeNumber}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'center',
                      fontWeight: 600
                    }}
                  >
                    {holeScore?.netScore ?? '—'}
                  </td>
                );
              })}
            </tr>

            <tr>
              <th
                style={{
                  padding: '0.5rem',
                  textAlign: 'left'
                }}
              >
                Points
              </th>

              {holeNumbers.map((holeNumber) => {
                const holeScore =
                  getHoleScore(holeNumber);

                return (
                  <td
                    key={holeNumber}
                    title={scoreLabel(
                      holeScore?.stablefordPoints ??
                        null
                    )}
                    style={{
                      padding: '0.5rem',
                      textAlign: 'center',
                      fontWeight: 700
                    }}
                  >
                    {holeScore?.stablefordPoints ??
                      '—'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (
    !activePlayerRecord ||
    !activePlayerEntry
  ) {
    return (
      <section className="card">
        <h2>Score Entry Unavailable</h2>

        <p>
          No players are currently assigned to this
          scorecard.
        </p>

        <button
          type="button"
          onClick={onClose}
        >
          Close Scorecard
        </button>
      </section>
    );
  }

  return (
    <section
      ref={entryTopRef}
      className="card"
    >
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

          <h2>
            {activePlayer?.name ??
              activePlayerId}
          </h2>

          <p>
            Player {activePlayerIndex + 1} of{' '}
            {orderedPlayers.length}
          </p>

          <p>
            Course Handicap:{' '}
            <strong>
              {activePlayerEntry.courseHandicap}
            </strong>
            {' · '}
            Quota:{' '}
            <strong>
              {activePlayerEntry.quota}
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          Close Scorecard
        </button>
      </div>

      <div
        style={{
  position: 'sticky',
  top: '0.5rem',
  zIndex: 15,
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginTop: '1rem',
  marginBottom: '1.25rem',
  padding: '0.75rem',
  background: 'white',
  border: '1px solid rgba(0, 0, 0, 0.12)',
  borderRadius: '0.5rem',
  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.12)'
}}
      >
        {orderedPlayers.map((record, playerIndex) => {
          const complete =
            record.entry?.scores.every(
              (score) => score.grossScore !== null
            ) ?? false;

          const started =
            record.entry?.scores.some(
              (score) => score.grossScore !== null
            ) ?? false;

          const current =
            playerIndex === activePlayerIndex;

          const symbol = current
            ? '►'
            : complete
              ? '✓'
              : started
                ? '◐'
                : '○';

          return (
            <button
              key={record.scorecardPlayer.playerId}
              type="button"
              aria-pressed={current}
              onClick={() =>
                setActivePlayerIndex(playerIndex)
              }
              style={{
                fontWeight: current ? 700 : 400
              }}
            >
              {symbol}{' '}
              {record.player?.name ??
                record.scorecardPlayer.playerId}
            </button>
          );
        })}
      </div>

      <h3>Front Nine</h3>

      {renderNine(1, 9)}

      <NineSummary
        label="Front Nine"
        grossTotal={
          activePlayerEntry.frontNineGrossTotal
        }
        pointsTotal={
          activePlayerEntry.frontNinePoints
        }
      />

      <h3
        style={{
          marginTop: '2rem'
        }}
      >
        Back Nine
      </h3>

      {renderNine(10, 18)}

      <NineSummary
        label="Back Nine"
        grossTotal={
          activePlayerEntry.backNineGrossTotal
        }
        pointsTotal={
          activePlayerEntry.backNinePoints
        }
      />

      {playerComplete && (
        <section
          ref={confirmationPanelRef}
          className="card"
          style={{
  position: 'sticky',
  bottom: '1rem',
  zIndex: 20,
  marginTop: '1.5rem',
  boxShadow: '0 -4px 18px rgba(0, 0, 0, 0.18)',
  background: 'white'
}}
        >
          <h3>Confirm Player Totals</h3>

          <p>
            Compare this line directly with the paper
            scorecard before continuing.
          </p>

          <div
            style={{
              overflowX: 'auto'
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: '720px',
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
                    Pts. Needed
                  </th>

                  <th style={numberHeaderStyle}>
                    Plus/Minus
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <th
                    rowSpan={2}
                    style={playerCellStyle}
                  >
                    {activePlayer?.name ??
                      activePlayerId}
                  </th>

                  <th style={rowLabelStyle}>
                    Score
                  </th>

                  <td style={numberCellStyle}>
                    {
                      activePlayerEntry
                        .frontNineGrossTotal
                    }
                  </td>

                  <td style={numberCellStyle}>
                    {
                      activePlayerEntry
                        .backNineGrossTotal
                    }
                  </td>

                  <td style={numberCellStyle}>
                    {activePlayerEntry.grossTotal}
                  </td>

                  <td style={numberCellStyle}>
                    {' '}
                  </td>

                  <td style={numberCellStyle}>
                    {' '}
                  </td>
                </tr>

                <tr>
                  <th style={rowLabelStyle}>
                    Points
                  </th>

                  <td style={numberCellStyle}>
                    {
                      activePlayerEntry
                        .frontNinePoints
                    }
                  </td>

                  <td style={numberCellStyle}>
                    {
                      activePlayerEntry
                        .backNinePoints
                    }
                  </td>

                  <td style={numberCellStyle}>
                    {
                      activePlayerEntry
                        .stablefordPoints
                    }
                  </td>

                  <td style={numberCellStyle}>
                    {activePlayerEntry.quota}
                  </td>

                  <td
                    style={{
                      ...numberCellStyle,
                      fontWeight: 700
                    }}
                  >
                    {formatQuotaResult(
                      activePlayerEntry.quotaResult
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={editScores}
            >
              Edit Scores
            </button>

            {!isLastPlayer && (
              <button
                type="button"
                onClick={goToNextPlayer}
              >
                Next Player
              </button>
            )}

            {isLastPlayer && (
              <button
                type="button"
                disabled={!cardComplete}
                onClick={onReview}
              >
                Review Full Scorecard
              </button>
            )}
          </div>
        </section>
      )}

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
        <button
          type="button"
          disabled={activePlayerIndex === 0}
          onClick={goToPreviousPlayer}
        >
          Previous Player
        </button>

        <div>
          {playerComplete
            ? 'Review the confirmation line before continuing.'
            : 'Enter all 18 gross scores.'}
        </div>
      </div>
    </section>
  );
}

const leftHeaderStyle = {
  padding: '0.65rem',
  textAlign: 'left' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const numberHeaderStyle = {
  padding: '0.65rem',
  textAlign: 'center' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const playerCellStyle = {
  padding: '0.65rem',
  textAlign: 'left' as const,
  verticalAlign: 'middle' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const rowLabelStyle = {
  padding: '0.65rem',
  textAlign: 'left' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const numberCellStyle = {
  padding: '0.65rem',
  textAlign: 'center' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};