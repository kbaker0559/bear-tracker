import { useState } from 'react';
import type { Player } from '../types';
import type { QuotaUpdate } from '../types/quotaUpdate';
import { quotaRuleExplanation } from '../engine/quotaUpdateEngine';

type Props = {
  players: Player[];
  quotaUpdates: QuotaUpdate[];
  finalized: boolean;
  onSetReviewed: (playerId: string, reviewed: boolean) => void;
  onMarkAllReviewed: () => void;
  onOverride: (playerId: string, newQuota: number, reason?: string) => void;
};

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export default function QuotaWorkspace({
  players,
  quotaUpdates,
  finalized,
  onSetReviewed,
  onMarkAllReviewed,
  onOverride
}: Props) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string>();
  const reviewed = quotaUpdates.filter((update) => update.reviewed).length;
  const increases = quotaUpdates.filter((update) => update.officialAdjustment > 0).length;
  const decreases = quotaUpdates.filter((update) => update.officialAdjustment < 0).length;
  const unchanged = quotaUpdates.length - increases - decreases;

  if (quotaUpdates.length === 0) {
    return (
      <section className="card">
        <p className="eyebrow">League Closeout</p>
        <h2>Quota Updates</h2>
        <p>Verify every scorecard before preparing quota updates.</p>
      </section>
    );
  }

  return (
    <div>
      <section className="card">
        <p className="eyebrow">League Closeout</p>
        <h2>Quota Update Review</h2>
        <div className="status-box" style={{ marginTop: '1rem' }}>
          <strong>{reviewed} of {quotaUpdates.length} reviewed</strong>
          <div>Increases: {increases} · Decreases: {decreases} · Unchanged: {unchanged}</div>
        </div>
        {!finalized && reviewed < quotaUpdates.length && (
          <button type="button" onClick={onMarkAllReviewed} style={{ marginTop: '1rem' }}>
            Mark All Quotas Reviewed
          </button>
        )}
        {finalized && (
          <div className="status-box" style={{ marginTop: '1rem' }}>
            <strong>🔒 Official quota updates applied</strong>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <div className="score-grid">
          {quotaUpdates.map((update) => {
            const player = players.find((candidate) => candidate.id === update.playerId);
            const overridden = update.officialAdjustment !== update.calculatedAdjustment;
            const expanded = expandedPlayerId === update.playerId;

            return (
              <div className="score-row" key={update.playerId} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong>{player?.name ?? update.playerId}</strong>
                  <div>
                    Quota {update.oldQuota} → <strong>{update.newQuota}</strong> · Round {signed(update.quotaResult)} · {update.inMoney ? 'In the money' : 'Not in the money'}{update.isHorseAssWinner ? " · Horse's Ass" : ''}
                  </div>
                  <div>
                    Change: {signed(update.officialAdjustment)}
                    {overridden ? ' (override)' : ''}
                    {update.reviewed ? ' · ✓ Reviewed' : ' · Not reviewed'}
                  </div>

                  {expanded && (
                    <div className="status-box" style={{ marginTop: '0.75rem' }}>
                      <div><strong>Rule:</strong> {quotaRuleExplanation(update.quotaResult, update.inMoney, update.isHorseAssWinner)}</div>
                      <div><strong>Calculated change:</strong> {signed(update.calculatedAdjustment)}</div>
                      <div><strong>Official change:</strong> {signed(update.officialAdjustment)}</div>
                      {update.overrideReason && <div><strong>Override reason:</strong> {update.overrideReason}</div>}
                      {update.appliedAt && <div><strong>Applied:</strong> {new Date(update.appliedAt).toLocaleString()}</div>}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setExpandedPlayerId(expanded ? undefined : update.playerId)}>
                    {expanded ? 'Hide' : 'Explain'}
                  </button>
                  {!finalized && (
                    <>
                      <button type="button" onClick={() => onSetReviewed(update.playerId, !update.reviewed)}>
                        {update.reviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const entered = window.prompt(
                            `Official new quota for ${player?.name ?? update.playerId}:`,
                            String(update.newQuota)
                          );
                          if (entered === null) return;
                          const newQuota = Number(entered);
                          if (!Number.isInteger(newQuota) || newQuota < 0) {
                            window.alert('Enter a whole-number quota of zero or greater.');
                            return;
                          }
                          const differs = newQuota !== update.oldQuota + update.calculatedAdjustment;
                          const reason = differs
                            ? window.prompt('Reason for quota override:')?.trim()
                            : undefined;
                          if (differs && !reason) {
                            window.alert('An override reason is required.');
                            return;
                          }
                          onOverride(update.playerId, newQuota, reason);
                        }}
                      >
                        Edit Official Quota
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
