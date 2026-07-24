import { useMemo } from 'react';
import type { Player } from '../types';
import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import type { ResultsSettings } from '../types/resultsSettings';
import { calculateHorseAss } from '../engine/horseAssEngine';
import { validateJuly4HorseAss } from '../engine/july4HorseAssBenchmark';

type Props = {
  roundDate: string;
  players: Player[];
  roundPlayers: RoundPlayer[];
  scorecardEntries: ScorecardEntry[];
  resultsSettings: ResultsSettings;
  onUpdateResultsSettings: (
    updater: (current: ResultsSettings) => ResultsSettings
  ) => void;
};

function playerName(playerId: string, players: Player[]): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

function formatQuotaResult(value: number | null): string {
  if (value === null) return '—';
  if (value > 0) return `+${value}`;
  if (value === 0) return 'E';
  return String(value);
}

export default function HorseAssPanel({
  roundDate,
  players,
  roundPlayers,
  scorecardEntries,
  resultsSettings,
  onUpdateResultsSettings
}: Props) {
  const result = useMemo(
    () =>
      calculateHorseAss(
        roundPlayers,
        scorecardEntries,
        resultsSettings.horseAssPerWinnerOverride?.amount
      ),
    [
      roundPlayers,
      scorecardEntries,
      resultsSettings.horseAssPerWinnerOverride?.amount
    ]
  );

  const benchmark = useMemo(
    () => validateJuly4HorseAss(roundDate, result, players),
    [roundDate, result, players]
  );

  function updateOfficialPayout(value: string) {
    const parsed = Number(value);

    onUpdateResultsSettings((current) => {
      if (
        !Number.isFinite(parsed) ||
        parsed < 0 ||
        Math.floor(parsed) === result.calculatedPayoutEach
      ) {
        return {
          ...current,
          horseAssPerWinnerOverride: undefined
        };
      }

      return {
        ...current,
        horseAssPerWinnerOverride: {
          amount: Math.floor(parsed),
          reason: current.horseAssPerWinnerOverride?.reason
        }
      };
    });
  }

  function updateReason(reason: string) {
    onUpdateResultsSettings((current) => ({
      ...current,
      horseAssPerWinnerOverride: {
        amount:
          current.horseAssPerWinnerOverride?.amount ??
          result.calculatedPayoutEach,
        reason
      }
    }));
  }

  return (
    <section className="card" style={{ marginTop: '1.5rem' }}>
      <h3>Horse&apos;s Ass</h3>

      <div className="score-grid">
        <div className="score-row">
          <strong>Eligible Completed Golfers</strong>
          <span>{result.eligiblePlayerCount}</span>
        </div>
        <div className="score-row">
          <strong>Prize Pot</strong>
          <span>${result.pot}</span>
        </div>
        <div className="score-row">
          <strong>Lowest Quota Result</strong>
          <span>{formatQuotaResult(result.lowestQuotaResult)}</span>
        </div>
        <div className="score-row">
          <strong>Winners</strong>
          <span>{result.winners.length}</span>
        </div>
      </div>

      {!result.ready && (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          Horse&apos;s Ass cannot be calculated until eligible golfers have completed rounds.
        </div>
      )}

      {result.ready && (
        <>
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            {result.winners.map((winner) => (
              <div
                key={winner.playerId}
                style={{
                  padding: '0.75rem',
                  border: '1px solid rgba(0, 0, 0, 0.14)',
                  borderRadius: '0.5rem'
                }}
              >
                <strong>{playerName(winner.playerId, players)}</strong>
                <div style={{ marginTop: '0.25rem' }}>
                  Quota result: {formatQuotaResult(winner.quotaResult)}
                </div>
                <div>Calculated payout: ${winner.calculatedPayout}</div>
                <div>Official payout: ${winner.officialPayout}</div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'end',
              marginTop: '1rem'
            }}
          >
            <label>
              Official payout per winner
              <input
                type="number"
                min="0"
                step="1"
                value={result.officialPayoutEach}
                onChange={(event) => updateOfficialPayout(event.target.value)}
                style={smallInputStyle}
              />
            </label>
            <label style={{ flex: '1 1 20rem' }}>
              Adjustment reason
              <input
                type="text"
                value={resultsSettings.horseAssPerWinnerOverride?.reason ?? ''}
                placeholder="Example: Rounded down for cash distribution"
                onChange={(event) => updateReason(event.target.value)}
                style={reasonInputStyle}
              />
            </label>
          </div>

          <div className="score-grid" style={{ marginTop: '1rem' }}>
            <div className="score-row">
              <strong>Calculated Distribution</strong>
              <span>${result.calculatedDistributed}</span>
            </div>
            <div className="score-row">
              <strong>Calculated Remainder</strong>
              <span>${result.calculatedRemainder}</span>
            </div>
            <div className="score-row">
              <strong>Official Distribution</strong>
              <span>${result.officialDistributed}</span>
            </div>
            <div className="score-row">
              <strong>Official Difference</strong>
              <span>${result.officialDifference}</span>
            </div>
          </div>
        </>
      )}

      {benchmark.applies && (
        <div style={{ marginTop: '1rem' }}>
          {benchmark.passed ? (
            <div className="status-box">
              ✓ Horse&apos;s Ass matches the official July 4 result.
            </div>
          ) : (
            <div>
              <div className="status-box">
                ⚠ Horse&apos;s Ass does not yet match the official July 4 result.
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

const smallInputStyle = {
  display: 'block',
  width: '7rem',
  marginTop: '0.35rem',
  padding: '0.55rem',
  fontSize: '1rem'
};

const reasonInputStyle = {
  display: 'block',
  width: '100%',
  marginTop: '0.35rem',
  padding: '0.55rem',
  fontSize: '1rem'
};
