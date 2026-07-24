import { useMemo } from 'react';
import type { Player } from '../types';
import type { RoundPlayer } from '../types/roundPlayer';
import type {
  ContestPayoutOverride,
  GreenieSelection,
  ResultsSettings
} from '../types/resultsSettings';
import {
  calculateGreenies,
  getGreenieEligiblePlayerIds,
  GREENIE_HOLES
} from '../engine/greeniesEngine';
import { validateJuly4Greenies } from '../engine/july4GreeniesBenchmark';
import { sortPlayersByLastName } from '../utils/playerSort';

const NO_WINNER = '__NO_WINNER__';

type Props = {
  roundDate: string;
  players: Player[];
  roundPlayers: RoundPlayer[];
  resultsSettings: ResultsSettings;
  onUpdateResultsSettings: (
    updater: (current: ResultsSettings) => ResultsSettings
  ) => void;
};

function playerName(playerId: string, players: Player[]): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

function officialAmount(
  holeNumber: number,
  calculated: number,
  overrides: Record<string, ContestPayoutOverride>
): number {
  return Math.max(
    0,
    Math.floor(overrides[String(holeNumber)]?.amount ?? calculated)
  );
}

export default function GreeniesPanel({
  roundDate,
  players,
  roundPlayers,
  resultsSettings,
  onUpdateResultsSettings
}: Props) {
  const selections = resultsSettings.greenieSelections ?? {};
  const overrides = resultsSettings.greenieAwardOverrides ?? {};

  const result = useMemo(
    () => calculateGreenies(roundPlayers, selections),
    [roundPlayers, selections]
  );

  const eligiblePlayers = useMemo(() => {
    const eligibleIds = getGreenieEligiblePlayerIds(roundPlayers);

    return sortPlayersByLastName(
      players.filter((player) => eligibleIds.has(player.id))
    );
  }, [players, roundPlayers]);

  const benchmark = useMemo(
    () => validateJuly4Greenies(roundDate, result, players),
    [roundDate, result, players]
  );

  const officialDistributed = result.holes.reduce((total, hole) => {
    if (hole.status !== 'winner') {
      return total;
    }

    return total + officialAmount(hole.holeNumber, hole.calculatedAward, overrides);
  }, 0);

  function updateSelection(
    holeNumber: number,
    patch: Partial<GreenieSelection>
  ) {
    onUpdateResultsSettings((current) => {
      const currentSelections = current.greenieSelections ?? {};
      const existing = currentSelections[String(holeNumber)] ?? {
        decided: false,
        winnerId: null
      };

      return {
        ...current,
        greenieSelections: {
          ...currentSelections,
          [String(holeNumber)]: {
            ...existing,
            ...patch
          }
        }
      };
    });
  }

  function selectWinner(holeNumber: number, value: string) {
    if (value === '') {
      updateSelection(holeNumber, {
        decided: false,
        winnerId: null
      });
      return;
    }

    updateSelection(holeNumber, {
      decided: true,
      winnerId: value === NO_WINNER ? null : value
    });
  }

  function updateOfficialAmount(
    holeNumber: number,
    calculatedAmount: number,
    value: string
  ) {
    const parsed = Number(value);

    onUpdateResultsSettings((current) => {
      const currentOverrides = current.greenieAwardOverrides ?? {};
      const updated = { ...currentOverrides };
      const key = String(holeNumber);

      if (
        !Number.isFinite(parsed) ||
        parsed < 0 ||
        Math.floor(parsed) === calculatedAmount
      ) {
        delete updated[key];
      } else {
        updated[key] = {
          amount: Math.floor(parsed),
          reason: updated[key]?.reason
        };
      }

      return {
        ...current,
        greenieAwardOverrides: updated
      };
    });
  }

  function updateOfficialReason(
    holeNumber: number,
    amount: number,
    reason: string
  ) {
    onUpdateResultsSettings((current) => ({
      ...current,
      greenieAwardOverrides: {
        ...(current.greenieAwardOverrides ?? {}),
        [String(holeNumber)]: {
          amount,
          reason
        }
      }
    }));
  }

  return (
    <section className="card" style={{ marginTop: '1.5rem' }}>
      <h3>Greenies</h3>

      <div className="score-grid">
        <div className="score-row">
          <strong>Greenies Pot</strong>
          <span>${result.greeniesPot}</span>
        </div>
        <div className="score-row">
          <strong>Greenie Holes Completed</strong>
          <span>{result.completedHoleCount} of {GREENIE_HOLES.length}</span>
        </div>
        <div className="score-row">
          <strong>Winning Greenie Holes</strong>
          <span>{result.winningHoleCount}</span>
        </div>
      </div>

      <p style={{ marginTop: '1rem' }}>
        Select the closest-to-the-pin winner for each Greenie hole, or choose No Winner.
        Unwon money carries to the next Greenie. If Hole 15 has no winner, its available
        money is divided by winning hole among the earlier Greenies.
      </p>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {result.holes.map((hole) => {
          const selection = selections[String(hole.holeNumber)];
          const override = overrides[String(hole.holeNumber)];
          const official = officialAmount(
            hole.holeNumber,
            hole.calculatedAward,
            overrides
          );

          return (
            <div
              key={hole.holeNumber}
              style={{
                padding: '0.85rem',
                border: '1px solid rgba(0, 0, 0, 0.14)',
                borderRadius: '0.5rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <strong>Hole {hole.holeNumber}</strong>
                  <div style={{ marginTop: '0.25rem' }}>
                    Base ${hole.baseValue}
                    {hole.carryIn > 0 ? ` + $${hole.carryIn} carry = $${hole.availableValue}` : ''}
                  </div>
                </div>
                <div>
                  {hole.status === 'pending' && <strong>Waiting for Result</strong>}
                  {hole.status === 'no-winner' && <strong>No Winner</strong>}
                  {hole.status === 'winner' && (
                    <strong>
                      {playerName(hole.winnerId ?? '', players)} — Calculated ${hole.calculatedAward}
                    </strong>
                  )}
                </div>
              </div>

              <label style={{ display: 'block', marginTop: '0.75rem' }}>
                Winner
                <select
                  value={
                    !selection?.decided
                      ? ''
                      : selection.winnerId === null
                        ? NO_WINNER
                        : selection.winnerId
                  }
                  onChange={(event) =>
                    selectWinner(hole.holeNumber, event.target.value)
                  }
                  style={selectStyle}
                >
                  <option value="">Select result...</option>
                  <option value={NO_WINNER}>No Winner</option>
                  {eligiblePlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
                  gap: '0.75rem',
                  marginTop: '0.75rem'
                }}
              >
                <label>
                  Distance (optional)
                  <input
                    type="text"
                    value={selection?.distance ?? ''}
                    placeholder={'Example: 8\' 4"'}
                    onChange={(event) =>
                      updateSelection(hole.holeNumber, {
                        distance: event.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </label>
                <label>
                  Notes (optional)
                  <input
                    type="text"
                    value={selection?.notes ?? ''}
                    onChange={(event) =>
                      updateSelection(hole.holeNumber, {
                        notes: event.target.value
                      })
                    }
                    style={inputStyle}
                  />
                </label>
              </div>

              {hole.status === 'no-winner' && hole.holeNumber !== 15 && (
                <div className="status-box" style={{ marginTop: '0.75rem' }}>
                  ${hole.availableValue} carries forward to the next Greenie hole.
                </div>
              )}

              {hole.status === 'winner' && (
                <div style={{ marginTop: '0.75rem' }}>
                  {hole.carryIn > 0 && (
                    <p>
                      {playerName(hole.winnerId ?? '', players)} receives the ${hole.baseValue}
                      base value plus ${hole.carryIn} carried from earlier unwon Greenies.
                    </p>
                  )}
                  {hole.finalHoleRedistribution > 0 && (
                    <p>
                      This winning hole also receives ${hole.finalHoleRedistribution} from the
                      unwon final Greenie. Redistribution is by winning hole, so one golfer may
                      receive more than one share.
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'end',
                      flexWrap: 'wrap'
                    }}
                  >
                    <label>
                      Calculated payout
                      <input
                        type="number"
                        value={hole.calculatedAward}
                        disabled
                        style={smallInputStyle}
                      />
                    </label>
                    <label>
                      Official payout
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={official}
                        onChange={(event) =>
                          updateOfficialAmount(
                            hole.holeNumber,
                            hole.calculatedAward,
                            event.target.value
                          )
                        }
                        style={smallInputStyle}
                      />
                    </label>
                    <label style={{ flex: '1 1 20rem' }}>
                      Adjustment reason
                      <input
                        type="text"
                        value={override?.reason ?? ''}
                        placeholder="Example: Rounded for easier cash distribution"
                        onChange={(event) =>
                          updateOfficialReason(
                            hole.holeNumber,
                            official,
                            event.target.value
                          )
                        }
                        style={inputStyle}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {result.finalHoleRedistributionPool > 0 && (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          Hole 15 had no winner. ${result.finalHoleRedistributionPool} was divided among
          the earlier winning Greenie holes at ${result.finalHoleRedistributionEach} per
          winning hole. Any whole-dollar rounding remainder remains undistributed.
        </div>
      )}

      <div className="score-grid" style={{ marginTop: '1rem' }}>
        <div className="score-row">
          <strong>Calculated Distribution</strong>
          <span>${result.calculatedDistributed}</span>
        </div>
        <div className="score-row">
          <strong>Official Distribution</strong>
          <span>${officialDistributed}</span>
        </div>
        <div className="score-row">
          <strong>Official Difference</strong>
          <span>${result.greeniesPot - officialDistributed}</span>
        </div>
      </div>

      {!result.ready && (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          Select a winner or No Winner for all four Greenie holes before finalizing results.
        </div>
      )}

      {benchmark.applies && (
        <div style={{ marginTop: '1rem' }}>
          {benchmark.passed ? (
            <div className="status-box">
              ✓ Greenie winners and calculated payouts match the official July 4 results.
            </div>
          ) : (
            <div>
              <div className="status-box">
                ⚠ The Greenies do not yet match the official July 4 results.
              </div>
              <ul>
                {benchmark.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const selectStyle = {
  display: 'block',
  width: '100%',
  maxWidth: '28rem',
  marginTop: '0.35rem',
  padding: '0.65rem',
  fontSize: '1rem'
};

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: '0.35rem',
  padding: '0.6rem',
  fontSize: '1rem'
};

const smallInputStyle = {
  display: 'block',
  width: '7rem',
  marginTop: '0.35rem',
  padding: '0.55rem',
  fontSize: '1rem'
};
