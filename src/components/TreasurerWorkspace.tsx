import { useMemo, useState } from 'react';
import type { Player } from '../types';
import type { AwardEntry } from '../types/awardEntry';
import type { RoundPlayer } from '../types/roundPlayer';
import type { TreasuryTransaction } from '../types/treasuryTransaction';
import type { PlayerAccount } from '../types/playerAccount';
import type { TreasuryReconciliation } from '../types/treasuryReconciliation';

type Props = {
  players: Player[];
  roundPlayers: RoundPlayer[];
  awardEntries: AwardEntry[];
  treasuryTransactions: TreasuryTransaction[];
  playerAccounts: PlayerAccount[];
  treasuryReconciliation: TreasuryReconciliation;
  onUpdateTreasuryReconciliation: (value: TreasuryReconciliation) => void;
  onSettleAward: (awardEntryId: string, destination: 'paid-cash' | 'moved-to-owe-envelope') => void;
  onSettleCategoryCash: (category: 'greenie' | 'places-ha' | 'skin') => void;
};

type ViewMode = 'award' | 'player';

function playerName(playerId: string, players: Player[]): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}

function categoryLabel(category: AwardEntry['category']): string {
  if (category === 'place') return 'Places';
  if (category === 'skin') return 'Skins';
  if (category === 'greenie') return 'Greenies';
  return "Horse's Ass";
}

export default function TreasurerWorkspace({
  players,
  roundPlayers,
  awardEntries,
  treasuryTransactions,
  playerAccounts,
  treasuryReconciliation,
  onUpdateTreasuryReconciliation,
  onSettleAward,
  onSettleCategoryCash
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('award');

  const officialTotal = awardEntries.reduce((sum, entry) => sum + entry.officialAmount, 0);
  const paidCash = awardEntries
    .filter((entry) => entry.settlementStatus === 'paid-cash')
    .reduce((sum, entry) => sum + entry.officialAmount, 0);
  const oweCreated = awardEntries
    .filter((entry) => entry.settlementStatus === 'moved-to-owe-envelope')
    .reduce((sum, entry) => sum + entry.officialAmount, 0);
  const unresolved = awardEntries
    .filter((entry) => entry.settlementStatus === 'unsettled')
    .reduce((sum, entry) => sum + entry.officialAmount, 0);
  const paidRoundPlayers = roundPlayers.filter(
    (player) =>
      player.paid &&
      player.checkedIn &&
      player.status !== 'dns' &&
      player.status !== 'withdrawn' &&
      player.status !== 'no-show' &&
      player.status !== 'removed'
  );
  const paidEntryCount = paidRoundPlayers.length;
  const newCashReceived = paidRoundPlayers.reduce(
    (sum, player) => sum + (player.cashPaid ?? 0),
    0
  );
  const creditsApplied = paidRoundPlayers.reduce(
    (sum, player) => sum + (player.creditApplied ?? 0),
    0
  );
  const totalEntryFunding = newCashReceived + creditsApplied;
  const tournamentPrizeFunding = paidEntryCount * 24;
  const holeInOneFunding = paidEntryCount;
  const calculatedPrizeCashRemaining =
    tournamentPrizeFunding - paidCash - oweCreated;
  const prizeFundingShortfall = Math.max(0, -calculatedPrizeCashRemaining);
  const currentRoundPot = Math.max(0, calculatedPrizeCashRemaining);
  const entryFundingDifference =
    totalEntryFunding - paidEntryCount * 25;
  const allocationDifference =
    totalEntryFunding -
    tournamentPrizeFunding -
    holeInOneFunding;
  const oweEnvelopeBalance = treasuryTransactions.reduce((sum, tx) => {
    if (tx.destination === 'owe-envelope') return sum + tx.amount;
    if (tx.source === 'owe-envelope') return sum - tx.amount;
    return sum;
  }, 0);
  const outstandingCredits = playerAccounts.filter((account) => account.balance > 0).length;
  const playersRemaining = new Set(
    awardEntries.filter((entry) => entry.settlementStatus === 'unsettled').map((entry) => entry.playerId)
  ).size;
  const progress = officialTotal > 0
    ? Math.round(((paidCash + oweCreated) / officialTotal) * 100)
    : 0;

  const expectedBalances = {
    tournamentPrizePot: currentRoundPot,
    holeInOnePot: holeInOneFunding,
    oweEnvelope: oweEnvelopeBalance
  };

  function countDifference(count: number | null, expected: number): number | null {
    return count === null ? null : count - expected;
  }

  const prizePotDifference = countDifference(
    treasuryReconciliation.tournamentPrizePotCount,
    expectedBalances.tournamentPrizePot
  );
  const holeInOneDifference = countDifference(
    treasuryReconciliation.holeInOnePotCount,
    expectedBalances.holeInOnePot
  );
  const oweEnvelopeDifference = countDifference(
    treasuryReconciliation.oweEnvelopeCount,
    expectedBalances.oweEnvelope
  );

  const countsComplete =
    (expectedBalances.tournamentPrizePot === 0 || treasuryReconciliation.tournamentPrizePotCount !== null) &&
    (expectedBalances.holeInOnePot === 0 || treasuryReconciliation.holeInOnePotCount !== null) &&
    (expectedBalances.oweEnvelope === 0 || treasuryReconciliation.oweEnvelopeCount !== null);

  const treasuryBalanced =
    unresolved === 0 &&
    entryFundingDifference === 0 &&
    allocationDifference === 0 &&
    prizeFundingShortfall === 0 &&
    countsComplete &&
    (prizePotDifference ?? 0) === 0 &&
    (holeInOneDifference ?? 0) === 0 &&
    (oweEnvelopeDifference ?? 0) === 0;

  function updateCount(
    field: 'tournamentPrizePotCount' | 'holeInOnePotCount' | 'oweEnvelopeCount',
    rawValue: string
  ) {
    const nextValue = rawValue.trim() === '' ? null : Number(rawValue);

    if (nextValue !== null && (!Number.isFinite(nextValue) || nextValue < 0)) {
      return;
    }

    onUpdateTreasuryReconciliation({
      ...treasuryReconciliation,
      [field]: nextValue,
      reconciledAt: undefined
    });
  }

  function confirmReconciliation() {
    if (!treasuryBalanced) {
      window.alert('The treasury cannot be marked balanced until every award is settled and all physical cash counts match.');
      return;
    }

    onUpdateTreasuryReconciliation({
      ...treasuryReconciliation,
      reconciledAt: new Date().toISOString()
    });

    window.alert('Treasury balanced. The tournament is ready for Finalize.');
  }

  const groups = useMemo(() => [
    {
      id: 'greenie' as const,
      title: 'Greenies',
      entries: awardEntries.filter((entry) => entry.category === 'greenie')
    },
    {
      id: 'places-ha' as const,
      title: "Places / Horse's Ass",
      entries: awardEntries.filter(
        (entry) => entry.category === 'place' || entry.category === 'horse-ass'
      )
    },
    {
      id: 'skin' as const,
      title: 'Skins',
      entries: awardEntries.filter((entry) => entry.category === 'skin')
    }
  ], [awardEntries]);

  const nextUnsettledAward = useMemo(() => {
    const categoryOrder: AwardEntry['category'][] = [
      'greenie',
      'place',
      'horse-ass',
      'skin'
    ];

    return [...awardEntries]
      .filter((entry) => entry.settlementStatus === 'unsettled')
      .sort((first, second) => {
        const categoryDifference =
          categoryOrder.indexOf(first.category) -
          categoryOrder.indexOf(second.category);

        if (categoryDifference !== 0) {
          return categoryDifference;
        }

        return first.label.localeCompare(second.label);
      })[0];
  }, [awardEntries]);

  const settledAwardCount = awardEntries.filter(
    (entry) => entry.settlementStatus !== 'unsettled'
  ).length;

  const playerGroups = useMemo(() => {
    const grouped = new Map<string, AwardEntry[]>();
    for (const entry of awardEntries) {
      grouped.set(entry.playerId, [...(grouped.get(entry.playerId) ?? []), entry]);
    }
    return [...grouped.entries()].sort((a, b) =>
      playerName(a[0], players).localeCompare(playerName(b[0], players))
    );
  }, [awardEntries, players]);

  return (
    <section className="card">
      <p className="eyebrow">Saturday Treasurer</p>
      <h2>Treasurer Workspace</h2>

      <div className="status-box" style={{ marginTop: '1rem' }}>
        <strong>Next Action</strong>
        {nextUnsettledAward ? (
          <>
            <div style={{ marginTop: '0.35rem' }}>
              Pay {playerName(nextUnsettledAward.playerId, players)}
            </div>
            <div>
              {nextUnsettledAward.label} — ${nextUnsettledAward.officialAmount}
            </div>
          </>
        ) : awardEntries.length > 0 ? (
          <div style={{ marginTop: '0.35rem' }}>
            ✓ All awards are settled. Proceed to Treasury Reconciliation.
          </div>
        ) : (
          <div style={{ marginTop: '0.35rem' }}>
            Complete Results before beginning settlement.
          </div>
        )}
      </div>

      <h3>Today's Financial Summary</h3>

      <div className="score-grid">
        <div className="score-row"><strong>Paid Entries</strong><span>{paidEntryCount}</span></div>
        <div className="score-row"><strong>New Cash Received</strong><span>${newCashReceived}</span></div>
        <div className="score-row"><strong>Credits Applied</strong><span>${creditsApplied}</span></div>
        <div className="score-row"><strong>Total Entry Funding</strong><span>${totalEntryFunding}</span></div>
      </div>

      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
          Tournament Prize Pot — ${currentRoundPot} currently remaining
        </summary>
        <div className="score-grid" style={{ marginTop: '0.75rem' }}>
          <div className="score-row">
            <strong>Entry allocation</strong>
            <span>{paidEntryCount} × $24 = ${tournamentPrizeFunding}</span>
          </div>
          <div className="score-row"><strong>Paid directly to winners</strong><span>−${paidCash}</span></div>
          <div className="score-row"><strong>Moved to Owe envelopes</strong><span>−${oweCreated}</span></div>
          <div className="score-row"><strong>Current prize cash remaining</strong><span>${currentRoundPot}</span></div>
        </div>
      </details>

      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
          Hole-in-One Pot Added Today — ${holeInOneFunding}
        </summary>
        <div className="score-grid" style={{ marginTop: '0.75rem' }}>
          <div className="score-row">
            <strong>Entry allocation</strong>
            <span>{paidEntryCount} × $1 = ${holeInOneFunding}</span>
          </div>
          <div className="score-row">
            <strong>Cash-funded entries</strong>
            <span>{paidRoundPlayers.filter((player) => (player.creditApplied ?? 0) === 0).length}</span>
          </div>
          <div className="score-row">
            <strong>Credit-funded entries</strong>
            <span>{paidRoundPlayers.filter((player) => (player.creditApplied ?? 0) > 0).length}</span>
          </div>
        </div>
      </details>

      <div className="score-grid" style={{ marginTop: '1rem' }}>
        <div className="score-row"><strong>Owe Envelope</strong><span>${oweEnvelopeBalance}</span></div>
        <div className="score-row"><strong>Outstanding Credits</strong><span>{outstandingCredits}</span></div>
        <div className="score-row"><strong>Players Remaining</strong><span>{playersRemaining}</span></div>
        <div className="score-row"><strong>Unresolved Awards</strong><span>${unresolved}</span></div>
        <div className="score-row"><strong>Awards Settled</strong><span>{settledAwardCount} of {awardEntries.length}</span></div>
        <div className="score-row"><strong>Settlement Progress</strong><span>{progress}%</span></div>
      </div>

      <div
        className="status-box"
        style={{ marginTop: '1rem' }}
      >
        <strong>Treasury Validation</strong>
        <div>
          Entry funding:{' '}
          {entryFundingDifference === 0
            ? '✓ Balanced'
            : `⚠ Difference $${entryFundingDifference}`}
        </div>
        <div>
          $24 / $1 allocation:{' '}
          {allocationDifference === 0
            ? '✓ Balanced'
            : `⚠ Difference $${allocationDifference}`}
        </div>
        <div>
          Every paid entry is explained as $24 for prizes and $1 for the Hole-in-One Pot.
        </div>
      </div>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <p className="eyebrow">Treasury Reconciliation</p>
        <h3>Count Cash</h3>
        <p>
          Count only the cash physically remaining in each location. Bear Tracker compares each count with the expected balance.
        </p>

        {unresolved > 0 && (
          <div className="status-box" style={{ marginBottom: '1rem' }}>
            ⚠ ${unresolved} in awards is still unsettled. Settle every award before completing reconciliation.
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div className="status-box">
            <strong>Tournament Prize Pot</strong>
            <div>Expected: ${expectedBalances.tournamentPrizePot}</div>
            {expectedBalances.tournamentPrizePot === 0 ? (
              <div>No count required.</div>
            ) : (
              <label style={{ display: 'block', marginTop: '0.5rem' }}>
                Counted cash
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={treasuryReconciliation.tournamentPrizePotCount ?? ''}
                  onChange={(event) => updateCount('tournamentPrizePotCount', event.target.value)}
                />
              </label>
            )}
            <div>
              Status: {expectedBalances.tournamentPrizePot === 0
                ? '✓ No cash expected'
                : prizePotDifference === null
                  ? 'Count required'
                : prizePotDifference === 0
                  ? '✓ Matches'
                  : `${prizePotDifference > 0 ? 'Over' : 'Short'} $${Math.abs(prizePotDifference)}`}
            </div>
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Explain this number</summary>
              <div className="score-grid" style={{ marginTop: '0.5rem' }}>
                <div className="score-row"><strong>Started</strong><span>{paidEntryCount} × $24 = ${tournamentPrizeFunding}</span></div>
                <div className="score-row"><strong>Paid to winners</strong><span>−${paidCash}</span></div>
                <div className="score-row"><strong>Moved to Owe envelopes</strong><span>−${oweCreated}</span></div>
                <div className="score-row"><strong>Expected remaining</strong><span>${expectedBalances.tournamentPrizePot}</span></div>
              </div>
            </details>
          </div>

          <div className="status-box">
            <strong>Hole-in-One Pot — Added Today</strong>
            <div>Expected: ${expectedBalances.holeInOnePot}</div>
            {expectedBalances.holeInOnePot === 0 ? (
              <div>No count required.</div>
            ) : (
              <label style={{ display: 'block', marginTop: '0.5rem' }}>
                Counted cash
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={treasuryReconciliation.holeInOnePotCount ?? ''}
                  onChange={(event) => updateCount('holeInOnePotCount', event.target.value)}
                />
              </label>
            )}
            <div>
              Status: {expectedBalances.holeInOnePot === 0
                ? '✓ No cash expected'
                : holeInOneDifference === null
                  ? 'Count required'
                : holeInOneDifference === 0
                  ? '✓ Matches'
                  : `${holeInOneDifference > 0 ? 'Over' : 'Short'} $${Math.abs(holeInOneDifference)}`}
            </div>
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Explain this number</summary>
              <div className="score-grid" style={{ marginTop: '0.5rem' }}>
                <div className="score-row"><strong>Paid entries</strong><span>{paidEntryCount}</span></div>
                <div className="score-row"><strong>Allocation</strong><span>{paidEntryCount} × $1 = ${holeInOneFunding}</span></div>
              </div>
            </details>
          </div>

          <div className="status-box">
            <strong>Owe Envelope</strong>
            <div>Expected: ${expectedBalances.oweEnvelope}</div>
            {expectedBalances.oweEnvelope === 0 ? (
              <div>No count required.</div>
            ) : (
              <label style={{ display: 'block', marginTop: '0.5rem' }}>
                Counted cash
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={treasuryReconciliation.oweEnvelopeCount ?? ''}
                  onChange={(event) => updateCount('oweEnvelopeCount', event.target.value)}
                />
              </label>
            )}
            <div>
              Status: {expectedBalances.oweEnvelope === 0
                ? '✓ No cash expected'
                : oweEnvelopeDifference === null
                  ? 'Count required'
                : oweEnvelopeDifference === 0
                  ? '✓ Matches'
                  : `${oweEnvelopeDifference > 0 ? 'Over' : 'Short'} $${Math.abs(oweEnvelopeDifference)}`}
            </div>
            <details style={{ marginTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Explain this number</summary>
              <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.4rem' }}>
                {treasuryTransactions.filter((transaction) => transaction.destination === 'owe-envelope' || transaction.source === 'owe-envelope').length === 0 ? (
                  <div>No Owe-envelope transactions.</div>
                ) : treasuryTransactions
                  .filter((transaction) => transaction.destination === 'owe-envelope' || transaction.source === 'owe-envelope')
                  .map((transaction) => (
                    <div key={transaction.id} className="score-row">
                      <span>{transaction.reason}</span>
                      <span>{transaction.destination === 'owe-envelope' ? '+' : '−'}${transaction.amount}</span>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        </div>

        <div className="status-box" style={{ marginTop: '1rem' }}>
          <strong>{treasuryBalanced ? '✓ Treasury Balanced' : 'Treasury Attention Required'}</strong>
          {!countsComplete && <div>Enter each required physical cash count.</div>}
          {unresolved > 0 && <div>{awardEntries.filter((entry) => entry.settlementStatus === 'unsettled').length} award entries remain unsettled.</div>}
          {entryFundingDifference !== 0 && <div>Entry funding difference: ${entryFundingDifference}</div>}
          {allocationDifference !== 0 && <div>$24 / $1 allocation difference: ${allocationDifference}</div>}
          {prizeFundingShortfall > 0 && <div>Official payouts exceed tournament prize funding by ${prizeFundingShortfall}. Record a funding adjustment before reconciliation.</div>}
          {treasuryReconciliation.reconciledAt && treasuryBalanced && (
            <div>Reconciled at {new Date(treasuryReconciliation.reconciledAt).toLocaleString()}.</div>
          )}
        </div>

        <button
          type="button"
          style={{ marginTop: '1rem' }}
          disabled={!treasuryBalanced}
          onClick={confirmReconciliation}
        >
          Confirm Treasury Balanced
        </button>
      </section>

      {awardEntries.length === 0 && (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          No awards are ready yet. Complete Results before beginning settlement.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <button type="button" className={viewMode === 'award' ? 'active' : ''} onClick={() => setViewMode('award')}>
          By Award Category
        </button>
        <button type="button" className={viewMode === 'player' ? 'active' : ''} onClick={() => setViewMode('player')}>
          By Player
        </button>
      </div>

      {viewMode === 'award' && groups.map((group) => {
        const remaining = group.entries.filter((entry) => entry.settlementStatus === 'unsettled');
        const total = group.entries.reduce((sum, entry) => sum + entry.officialAmount, 0);
        return (
          <section key={group.id} className="card" style={{ marginTop: '1.25rem' }}>
            <h3>
              {group.title}{' '}
              {group.entries.length > 0 && remaining.length === 0 ? '✓ Complete' : ''}
            </h3>
            {group.entries.length === 0 ? <p>No awards in this category.</p> : (
              <>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="score-row" style={{ alignItems: 'center' }}>
                      <div>
                        <strong>{playerName(entry.playerId, players)}</strong>
                        <div>{entry.label}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.75 }}>
                          {entry.settlementStatus === 'paid-cash' && 'Paid cash'}
                          {entry.settlementStatus === 'moved-to-owe-envelope' && 'In Owe envelope'}
                          {entry.settlementStatus === 'unsettled' && 'Not settled'}
                        </div>
                      </div>
                      <strong>${entry.officialAmount}</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button type="button" disabled={entry.settlementStatus !== 'unsettled'} onClick={() => onSettleAward(entry.id, 'paid-cash')}>
                          Paid Cash
                        </button>
                        <button type="button" disabled={entry.settlementStatus !== 'unsettled'} onClick={() => onSettleAward(entry.id, 'moved-to-owe-envelope')}>
                          Player Left — Owe Envelope
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <strong>Total: ${total}</strong>
                  <button type="button" disabled={remaining.length === 0} onClick={() => onSettleCategoryCash(group.id)}>
                    Mark {remaining.length} Remaining {group.title} Paid
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })}

      {viewMode === 'player' && (
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.25rem' }}>
          {playerGroups.map(([playerId, entries]) => {
            const total = entries.reduce((sum, entry) => sum + entry.officialAmount, 0);
            const cash = entries.filter((entry) => entry.settlementStatus === 'paid-cash').reduce((sum, entry) => sum + entry.officialAmount, 0);
            const credit = entries.filter((entry) => entry.settlementStatus === 'moved-to-owe-envelope').reduce((sum, entry) => sum + entry.officialAmount, 0);
            const stillOwed = total - cash - credit;
            return (
              <details key={playerId} className="card">
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                  {playerName(playerId, players)} — Total ${total} — Still owed ${stillOwed}
                </summary>
                <div className="score-grid" style={{ marginTop: '1rem' }}>
                  <div className="score-row"><strong>Paid in Cash</strong><span>${cash}</span></div>
                  <div className="score-row"><strong>Added to Credit</strong><span>${credit}</span></div>
                  <div className="score-row"><strong>Still Unresolved</strong><span>${stillOwed}</span></div>
                </div>
                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
                  {entries.map((entry) => (
                    <div key={entry.id} className="score-row">
                      <span>{categoryLabel(entry.category)} — {entry.label}</span>
                      <span>${entry.officialAmount} — {entry.settlementStatus}</span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
