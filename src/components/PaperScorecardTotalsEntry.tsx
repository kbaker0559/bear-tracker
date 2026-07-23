import { useMemo, useRef, useState } from 'react';
import type { Player } from '../types';
import type { ScorecardEntry } from '../types/scoreEntry';
import type { PaperPlayerTotals } from '../types/paperScorecardTotals';

type Props = {
  scorecardEntry: ScorecardEntry;
  players: Player[];

  onSavePlayerTotals: (
    paperTotals: PaperPlayerTotals
  ) => void;
};

type DraftTotals = {
  frontNineGross: string;
  backNineGross: string;
  grossTotal: string;

  frontNinePoints: string;
  backNinePoints: string;
  totalPoints: string;

  quota: string;
  quotaResult: string;
};

function emptyDraft(): DraftTotals {
  return {
    frontNineGross: '',
    backNineGross: '',
    grossTotal: '',

    frontNinePoints: '',
    backNinePoints: '',
    totalPoints: '',

    quota: '',
    quotaResult: ''
  };
}

function numberOrNull(
  value: string
): number | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  const normalized =
    trimmed.toUpperCase() === 'E'
      ? '0'
      : trimmed;

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function stringValue(
  value: number | null | undefined
): string {
  return value === null || value === undefined
    ? ''
    : String(value);
}

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

export default function PaperScorecardTotalsEntry({
  scorecardEntry,
  players,
  onSavePlayerTotals
}: Props) {
  const inputRefs = useRef<
    Partial<
      Record<keyof DraftTotals, HTMLInputElement | null>
    >
  >({});

  const [selectedPlayerId, setSelectedPlayerId] =
    useState(
      scorecardEntry.players[0]?.playerId ?? ''
    );

  const selectedPaperTotals = useMemo(
    () =>
      (scorecardEntry.paperTotals ?? []).find(
        (entry) =>
          entry.playerId === selectedPlayerId
      ) ?? null,
    [
      scorecardEntry.paperTotals,
      selectedPlayerId
    ]
  );

  const [draft, setDraft] =
    useState<DraftTotals>(() =>
      selectedPaperTotals
        ? {
            frontNineGross: stringValue(
              selectedPaperTotals.frontNineGross
            ),
            backNineGross: stringValue(
              selectedPaperTotals.backNineGross
            ),
            grossTotal: stringValue(
              selectedPaperTotals.grossTotal
            ),
            frontNinePoints: stringValue(
              selectedPaperTotals.frontNinePoints
            ),
            backNinePoints: stringValue(
              selectedPaperTotals.backNinePoints
            ),
            totalPoints: stringValue(
              selectedPaperTotals.totalPoints
            ),
            quota: stringValue(
              selectedPaperTotals.quota
            ),
            quotaResult: stringValue(
              selectedPaperTotals.quotaResult
            )
          }
        : emptyDraft()
    );

  function loadPlayer(
    playerId: string
  ) {
    setSelectedPlayerId(playerId);

    const existing =
      (scorecardEntry.paperTotals ?? []).find(
        (entry) =>
          entry.playerId === playerId
      );

    setDraft(
      existing
        ? {
            frontNineGross: stringValue(
              existing.frontNineGross
            ),
            backNineGross: stringValue(
              existing.backNineGross
            ),
            grossTotal: stringValue(
              existing.grossTotal
            ),
            frontNinePoints: stringValue(
              existing.frontNinePoints
            ),
            backNinePoints: stringValue(
              existing.backNinePoints
            ),
            totalPoints: stringValue(
              existing.totalPoints
            ),
            quota: stringValue(
              existing.quota
            ),
            quotaResult: stringValue(
              existing.quotaResult
            )
          }
        : emptyDraft()
    );
  }

  function focusField(
    field: keyof DraftTotals
  ) {
    window.setTimeout(() => {
      const input = inputRefs.current[field];

      input?.focus();
      input?.select();
    }, 0);
  }

  function updateDraft(
    field: keyof DraftTotals,
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));

    const numericCharacters =
      value.replace(/\D/g, '');

    if (numericCharacters.length < 2) {
      return;
    }

    if (field === 'frontNineGross') {
      focusField('backNineGross');
    } else if (field === 'backNineGross') {
      focusField('grossTotal');
    } else if (field === 'grossTotal') {
      focusField('frontNinePoints');
    }
  }

  function savePlayerTotals() {
    if (!selectedPlayerId) {
      return;
    }

    onSavePlayerTotals({
      playerId: selectedPlayerId,

      frontNineGross:
        numberOrNull(draft.frontNineGross),

      backNineGross:
        numberOrNull(draft.backNineGross),

      grossTotal:
        numberOrNull(draft.grossTotal),

      frontNinePoints:
        numberOrNull(draft.frontNinePoints),

      backNinePoints:
        numberOrNull(draft.backNinePoints),

      totalPoints:
        numberOrNull(draft.totalPoints),

      quota:
        numberOrNull(draft.quota),

      quotaResult:
        numberOrNull(draft.quotaResult)
    });
  }

  if (scorecardEntry.players.length === 0) {
    return null;
  }

  return (
    <section className="card">
      <h3>Investigate Paper Discrepancy</h3>

      <p>
        Enter only the paper values you want Bear Tracker
        to compare. Blank fields are ignored.
      </p>

      <label>
        <strong>Player</strong>

        <select
          value={selectedPlayerId}
          onChange={(event) =>
            loadPlayer(event.target.value)
          }
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '24rem',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }}
        >
          {scorecardEntry.players.map(
            (playerEntry) => (
              <option
                key={playerEntry.playerId}
                value={playerEntry.playerId}
              >
                {playerName(
                  playerEntry.playerId,
                  players
                )}
              </option>
            )
          )}
        </select>
      </label>

      <div
        style={{
          overflowX: 'auto'
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
                {playerName(
                  selectedPlayerId,
                  players
                )}
              </th>

              <th style={rowLabelStyle}>
                Score
              </th>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.frontNineGross = element;
                  }}
                  value={draft.frontNineGross}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'frontNineGross',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.backNineGross = element;
                  }}
                  value={draft.backNineGross}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'backNineGross',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.grossTotal = element;
                  }}
                  value={draft.grossTotal}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'grossTotal',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                —
              </td>

              <td style={numberCellStyle}>
                —
              </td>
            </tr>

            <tr>
              <th style={rowLabelStyle}>
                Points
              </th>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.frontNinePoints = element;
                  }}
                  value={draft.frontNinePoints}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'frontNinePoints',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.backNinePoints = element;
                  }}
                  value={draft.backNinePoints}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'backNinePoints',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.totalPoints = element;
                  }}
                  value={draft.totalPoints}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'totalPoints',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                <input
                  type="number"
                  ref={(element) => {
                    inputRefs.current.quota = element;
                  }}
                  value={draft.quota}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateDraft(
                      'quota',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>

              <td style={numberCellStyle}>
                <input
                  type="text"
                  ref={(element) => {
                    inputRefs.current.quotaResult = element;
                  }}
                  value={draft.quotaResult}
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  placeholder="E, +3, -2"
                  onChange={(event) =>
                    updateDraft(
                      'quotaResult',
                      event.target.value
                    )
                  }
                  style={inputStyle}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '1rem'
        }}
      >
        <button
          type="button"
          onClick={savePlayerTotals}
        >
          Save Paper Totals
        </button>
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
  padding: '0.45rem',
  textAlign: 'center' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.14)'
};

const inputStyle = {
  width: '4.5rem',
  padding: '0.5rem',
  textAlign: 'center' as const,
  fontSize: '1rem'
};