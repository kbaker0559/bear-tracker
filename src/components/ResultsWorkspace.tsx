import { useEffect, useMemo, useRef } from 'react';
import type { Player } from '../types';
import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import type { Scorecard } from '../types/scorecard';
import type { ResultsSettings } from '../types/resultsSettings';
import { calculatePlaces } from '../engine/placesEngine';
import { calculateSkins } from '../engine/skinsEngine';
import { validateJuly4Places } from '../engine/july4PlacesBenchmark';
import { validateJuly4Skins } from '../engine/july4SkinsBenchmark';
import GreeniesPanel from './GreeniesPanel';
import HorseAssPanel from './HorseAssPanel';
import type { NavigationSection } from '../types/navigation';
import ExcelScoreExportPanel from './ExcelScoreExportPanel';

type Props = {
  roundDate: string;
  players: Player[];
  roundPlayers: RoundPlayer[];
  scorecards: Scorecard[];
  scorecardEntries: ScorecardEntry[];
  resultsSettings: ResultsSettings;
  onUpdateResultsSettings: (
    updater: (current: ResultsSettings) => ResultsSettings
  ) => void;
  navigationSection?: NavigationSection;
  onNavigationHandled: () => void;
};

function playerName(playerId: string, players: Player[]): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

function formatQuotaResult(value: number): string {
  if (value > 0) return `+${value}`;
  if (value === 0) return 'E';
  return String(value);
}

function tieGroupKey(placeStart: number, placeEnd: number): string {
  return `${placeStart}-${placeEnd}`;
}

export default function ResultsWorkspace({
  roundDate,
  players,
  roundPlayers,
  scorecards,
  scorecardEntries,
  resultsSettings,
  onUpdateResultsSettings,
  navigationSection,
  onNavigationHandled
}: Props) {
  const greeniesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (navigationSection !== 'results-greenies') return;
    window.setTimeout(() => {
      greeniesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      greeniesRef.current?.classList.add('navigation-highlight');
      window.setTimeout(() => greeniesRef.current?.classList.remove('navigation-highlight'), 1400);
      onNavigationHandled();
    }, 100);
  }, [navigationSection, onNavigationHandled]);
  const places = useMemo(
    () => calculatePlaces(roundPlayers, scorecardEntries),
    [roundPlayers, scorecardEntries]
  );

  const skins = useMemo(
    () =>
      calculateSkins(
        roundPlayers,
        scorecardEntries,
        resultsSettings.skinsPerWinnerOverride?.amount
      ),
    [
      roundPlayers,
      scorecardEntries,
      resultsSettings.skinsPerWinnerOverride?.amount
    ]
  );

  const placesBenchmark = useMemo(
    () => validateJuly4Places(roundDate, places, players),
    [roundDate, places, players]
  );

  const skinsBenchmark = useMemo(
    () => validateJuly4Skins(roundDate, skins, players),
    [roundDate, skins, players]
  );

  const verifiedScorecards = scorecardEntries.filter(
    (entry) => entry.status === 'verified'
  ).length;
  const allCardsVerified =
    scorecardEntries.length > 0 &&
    verifiedScorecards === scorecardEntries.length;

  const officialPlacePayoutByPlayer = useMemo(() => {
    const payouts = new Map<string, number>();

    for (const group of places.tieGroups) {
      const key = tieGroupKey(group.placeStart, group.placeEnd);
      const official =
        resultsSettings.placeTieGroupOverrides[key]?.amount ??
        group.payoutEach;

      for (const playerId of group.playerIds) {
        payouts.set(playerId, Math.max(0, Math.floor(official)));
      }
    }

    return payouts;
  }, [places.tieGroups, resultsSettings.placeTieGroupOverrides]);

  const officialPlacesDistributed = Array.from(
    officialPlacePayoutByPlayer.values()
  ).reduce((total, payout) => total + payout, 0);

  function updatePlaceOverride(
    key: string,
    calculatedAmount: number,
    value: string
  ) {
    const parsed = Number(value);

    onUpdateResultsSettings((current) => {
      const overrides = { ...current.placeTieGroupOverrides };

      if (!Number.isFinite(parsed) || parsed < 0 || parsed === calculatedAmount) {
        delete overrides[key];
      } else {
        overrides[key] = {
          amount: Math.floor(parsed),
          reason: overrides[key]?.reason
        };
      }

      return {
        ...current,
        placeTieGroupOverrides: overrides
      };
    });
  }

  function updatePlaceReason(key: string, amount: number, reason: string) {
    onUpdateResultsSettings((current) => ({
      ...current,
      placeTieGroupOverrides: {
        ...current.placeTieGroupOverrides,
        [key]: {
          amount,
          reason
        }
      }
    }));
  }

  function updateSkinsPayout(value: string) {
    const parsed = Number(value);

    onUpdateResultsSettings((current) => {
      if (
        !Number.isFinite(parsed) ||
        parsed < 0 ||
        parsed === skins.calculatedPayoutPerSkin
      ) {
        return {
          ...current,
          skinsPerWinnerOverride: undefined
        };
      }

      return {
        ...current,
        skinsPerWinnerOverride: {
          amount: Math.floor(parsed),
          reason: current.skinsPerWinnerOverride?.reason
        }
      };
    });
  }

  function updateSkinsReason(reason: string) {
    onUpdateResultsSettings((current) => ({
      ...current,
      skinsPerWinnerOverride: {
        amount:
          current.skinsPerWinnerOverride?.amount ??
          skins.calculatedPayoutPerSkin,
        reason
      }
    }));
  }

  return (
    <section className="card">
      <p className="eyebrow">Official Results</p>
      <h2>Results</h2>

      <div className="score-grid">
        <div className="score-row">
          <strong>Eligible Players</strong>
          <span>{places.playerCount}</span>
        </div>
        <div className="score-row">
          <strong>Verified Scorecards</strong>
          <span>
            {verifiedScorecards} of {scorecardEntries.length}
          </span>
        </div>
        <div className="score-row">
          <strong>Places Paid</strong>
          <span>{places.placesPaid}</span>
        </div>
      </div>

      {!allCardsVerified && (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          Results are preliminary until every scorecard is verified.
        </div>
      )}

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Places</h3>

        {places.playerCount < 4 && (
          <div className="status-box" style={{ marginTop: '1rem' }}>
            At least four completed, eligible golfers are required for the payout table.
          </div>
        )}

        {places.standings.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table
              style={{
                width: '100%',
                minWidth: '800px',
                borderCollapse: 'collapse'
              }}
            >
              <thead>
                <tr>
                  <th style={leftHeaderStyle}>Place</th>
                  <th style={leftHeaderStyle}>Player</th>
                  <th style={numberHeaderStyle}>Points</th>
                  <th style={numberHeaderStyle}>Quota</th>
                  <th style={numberHeaderStyle}>+/-</th>
                  <th style={numberHeaderStyle}>Calculated</th>
                  <th style={numberHeaderStyle}>Official</th>
                </tr>
              </thead>
              <tbody>
                {places.standings.map((standing) => {
                  const official =
                    officialPlacePayoutByPlayer.get(standing.playerId) ?? 0;

                  return (
                    <tr key={standing.playerId}>
                      <td style={placeCellStyle}>{standing.displayPlace}</td>
                      <th style={playerCellStyle}>
                        {playerName(standing.playerId, players)}
                      </th>
                      <td style={numberCellStyle}>{standing.stablefordPoints}</td>
                      <td style={numberCellStyle}>
                        {standing.stablefordPoints - standing.quotaResult}
                      </td>
                      <td style={{ ...numberCellStyle, fontWeight: 700 }}>
                        {formatQuotaResult(standing.quotaResult)}
                      </td>
                      <td style={numberCellStyle}>
                        {standing.inMoney ? `$${standing.payout}` : '—'}
                      </td>
                      <td style={{ ...numberCellStyle, fontWeight: official > 0 ? 700 : 400 }}>
                        {official > 0 ? `$${official}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {places.tieGroups
          .filter((group) => group.prizePool > 0)
          .map((group) => {
            const key = tieGroupKey(group.placeStart, group.placeEnd);
            const override = resultsSettings.placeTieGroupOverrides[key];
            const official = override?.amount ?? group.payoutEach;

            return (
              <div
                key={key}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  border: '1px solid rgba(0, 0, 0, 0.14)',
                  borderRadius: '0.5rem'
                }}
              >
                <strong>
                  {group.playerIds.length > 1
                    ? `Tie occupying places ${group.placeStart}–${group.placeEnd}`
                    : `Place ${group.placeStart}`}
                </strong>
                <div style={{ marginTop: '0.25rem' }}>
                  {group.playerIds
                    .map((playerId) => playerName(playerId, players))
                    .join(', ')}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'end',
                    marginTop: '0.75rem'
                  }}
                >
                  <label>
                    Calculated each
                    <input
                      type="number"
                      value={group.payoutEach}
                      disabled
                      style={smallInputStyle}
                    />
                  </label>
                  <label>
                    Official each
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={official}
                      onChange={(event) =>
                        updatePlaceOverride(
                          key,
                          group.payoutEach,
                          event.target.value
                        )
                      }
                      style={smallInputStyle}
                    />
                  </label>
                  <label style={{ flex: '1 1 18rem' }}>
                    Adjustment reason
                    <input
                      type="text"
                      value={override?.reason ?? ''}
                      placeholder="Example: Rounded for easier cash distribution"
                      onChange={(event) =>
                        updatePlaceReason(key, official, event.target.value)
                      }
                      style={reasonInputStyle}
                    />
                  </label>
                </div>
              </div>
            );
          })}

        {places.placesPot > 0 && (
          <div className="score-grid" style={{ marginTop: '1rem' }}>
            <div className="score-row">
              <strong>Places Pot</strong>
              <span>${places.placesPot}</span>
            </div>
            <div className="score-row">
              <strong>Calculated Distribution</strong>
              <span>${places.distributed}</span>
            </div>
            <div className="score-row">
              <strong>Official Distribution</strong>
              <span>${officialPlacesDistributed}</span>
            </div>
            <div className="score-row">
              <strong>Official Difference</strong>
              <span>${places.placesPot - officialPlacesDistributed}</span>
            </div>
          </div>
        )}

        {placesBenchmark.applies && (
          <div style={{ marginTop: '1rem' }}>
            {placesBenchmark.passed ? (
              <div className="status-box">
                ✓ Calculated places match the official July 4 results.
              </div>
            ) : (
              <div>
                <div className="status-box">
                  ⚠ The calculated places do not yet match the official July 4 results.
                </div>
                <ul>
                  {placesBenchmark.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Net Skins</h3>

        <div className="score-grid">
          <div className="score-row">
            <strong>Skins Pot</strong>
            <span>${skins.skinsPot}</span>
          </div>
          <div className="score-row">
            <strong>Holes Evaluated</strong>
            <span>{skins.holesEvaluated} of 18</span>
          </div>
          <div className="score-row">
            <strong>Skins Awarded</strong>
            <span>{skins.winningSkins.length}</span>
          </div>
          <div className="score-row">
            <strong>Calculated Per Skin</strong>
            <span>${skins.calculatedPayoutPerSkin}</span>
          </div>
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
            Official payout per skin
            <input
              type="number"
              min="0"
              step="1"
              value={skins.officialPayoutPerSkin}
              onChange={(event) => updateSkinsPayout(event.target.value)}
              style={smallInputStyle}
            />
          </label>
          <label style={{ flex: '1 1 20rem' }}>
            Adjustment reason
            <input
              type="text"
              value={resultsSettings.skinsPerWinnerOverride?.reason ?? ''}
              placeholder="Example: Rounded from $19 to $20"
              onChange={(event) => updateSkinsReason(event.target.value)}
              style={reasonInputStyle}
            />
          </label>
        </div>

        {skins.winningSkins.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            {skins.winningSkins.map((hole) => {
              const winner = hole.players.find(
                (player) => player.playerId === hole.winnerId
              );

              return (
                <details
                  key={hole.holeNumber}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid rgba(0, 0, 0, 0.14)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                    Hole {hole.holeNumber}: {playerName(hole.winnerId ?? '', players)} — Net {hole.winningNetScore} — ${skins.officialPayoutPerSkin}
                  </summary>

                  {winner && (
                    <p>
                      {playerName(winner.playerId, players)}’s {winner.courseHandicap} handicap
                      {winner.handicapStrokes > 0
                        ? ` gave ${winner.handicapStrokes === 1 ? 'one stroke' : `${winner.handicapStrokes} strokes`} on Hole ${hole.holeNumber}, turning a gross ${winner.grossScore} into a net ${winner.netScore}.`
                        : ` did not give a stroke on Hole ${hole.holeNumber}, so the gross ${winner.grossScore} remained a net ${winner.netScore}.`}
                    </p>
                  )}

                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        minWidth: '620px',
                        borderCollapse: 'collapse'
                      }}
                    >
                      <thead>
                        <tr>
                          <th style={leftHeaderStyle}>Player</th>
                          <th style={numberHeaderStyle}>Handicap</th>
                          <th style={numberHeaderStyle}>Gross</th>
                          <th style={numberHeaderStyle}>Strokes</th>
                          <th style={numberHeaderStyle}>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hole.players.map((detail) => (
                          <tr key={detail.playerId}>
                            <th style={playerCellStyle}>
                              {playerName(detail.playerId, players)}
                              {detail.playerId === hole.winnerId ? ' ✓' : ''}
                            </th>
                            <td style={numberCellStyle}>{detail.courseHandicap}</td>
                            <td style={numberCellStyle}>{detail.grossScore}</td>
                            <td style={numberCellStyle}>{detail.handicapStrokes}</td>
                            <td style={{ ...numberCellStyle, fontWeight: detail.playerId === hole.winnerId ? 700 : 400 }}>
                              {detail.netScore}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        )}

        <div className="score-grid" style={{ marginTop: '1rem' }}>
          <div className="score-row">
            <strong>Calculated Distribution</strong>
            <span>${skins.calculatedDistributed}</span>
          </div>
          <div className="score-row">
            <strong>Official Distribution</strong>
            <span>${skins.officialDistributed}</span>
          </div>
          <div className="score-row">
            <strong>Official Difference</strong>
            <span>${skins.officialDifference}</span>
          </div>
        </div>

        {skinsBenchmark.applies && (
          <div style={{ marginTop: '1rem' }}>
            {skinsBenchmark.passed ? (
              <div className="status-box">
                ✓ Skins winners and calculated payout match the official July 4 results.
              </div>
            ) : (
              <div>
                <div className="status-box">
                  ⚠ The calculated skins do not yet match the official July 4 results.
                </div>
                <ul>
                  {skinsBenchmark.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <div ref={greeniesRef}>
      <GreeniesPanel
        roundDate={roundDate}
        players={players}
        roundPlayers={roundPlayers}
        resultsSettings={resultsSettings}
        onUpdateResultsSettings={onUpdateResultsSettings}
      />
      </div>

      <HorseAssPanel
        roundDate={roundDate}
        players={players}
        roundPlayers={roundPlayers}
        scorecardEntries={scorecardEntries}
        resultsSettings={resultsSettings}
        onUpdateResultsSettings={onUpdateResultsSettings}
      />

      <ExcelScoreExportPanel
        players={players}
        roundPlayers={roundPlayers}
        scorecards={scorecards}
        scorecardEntries={scorecardEntries}
      />

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h3>Results Progress</h3>
        <div className="score-grid">
          <div className="score-row">
            <strong>Places</strong>
            <span>{places.placesPot > 0 ? 'Calculated' : 'Waiting'}</span>
          </div>
          <div className="score-row">
            <strong>Skins</strong>
            <span>{skins.holesEvaluated === 18 ? 'Calculated' : 'Waiting'}</span>
          </div>
          <div className="score-row">
            <strong>Greenies</strong>
            <span>
              {Object.values(resultsSettings.greenieSelections ?? {}).filter(
                (selection) => selection.decided
              ).length === 4
                ? 'Entered'
                : 'Needs Winners'}
            </span>
          </div>
          <div className="score-row">
            <strong>Horse&apos;s Ass</strong>
            <span>Calculated</span>
          </div>
          <div className="score-row">
            <strong>Quota Updates</strong>
            <span>Not Yet Calculated</span>
          </div>
        </div>
      </section>
    </section>
  );
}

const leftHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom: '2px solid rgba(0, 0, 0, 0.18)'
};

const numberHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom: '2px solid rgba(0, 0, 0, 0.18)'
};

const placeCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
  fontWeight: 700
};

const playerCellStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
};

const numberCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
};

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
