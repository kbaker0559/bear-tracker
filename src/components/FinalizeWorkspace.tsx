import type { RoundBundle } from '../engine/roundEngine';
import type { FinalizeReadiness } from '../engine/finalizeReadinessEngine';

const APP_VERSION = '1.0.0-rc1';

type Props = {
  bundle: RoundBundle;
  readiness: FinalizeReadiness;
  onGoToWorkspace: (workspace: 'operations' | 'tournament' | 'results' | 'finance' | 'quotas') => void;
  onFinalize: () => void;
};

export default function FinalizeWorkspace({
  bundle,
  readiness,
  onGoToWorkspace,
  onFinalize
}: Props) {
  const finalized = Boolean(bundle.round.finalizedAt);

  return (
    <section className="card">
      <p className="eyebrow">Tournament Closeout</p>
      <h2>{finalized ? 'Tournament Finalized' : 'Finalize Tournament'}</h2>

      {finalized ? (
        <div className="status-box" style={{ marginTop: '1rem' }}>
          <strong>🔒 Finalized</strong>
          <div>Date: {bundle.round.date}</div>
          <div>Finalized: {new Date(bundle.round.finalizedAt as string).toLocaleString()}</div>
          <div>Bear Tracker version: {bundle.round.finalizedVersion ?? APP_VERSION}</div>
          <div style={{ marginTop: '0.5rem' }}>Tournament complete. See you next Saturday.</div>
        </div>
      ) : (
        <>
          <div className="status-box" style={{ marginTop: '1rem' }}>
            <strong>{readiness.ready ? '✓ Ready to Finalize' : 'Still Needed'}</strong>
            <div>{readiness.items.filter((item) => item.complete).length} of {readiness.items.length} readiness checks complete</div>
          </div>

          <div className="score-grid" style={{ marginTop: '1rem' }}>
            {readiness.items.map((item) => (
              <div className="score-row" key={item.id}>
                <div>
                  <strong>{item.complete ? '✓' : '○'} {item.label}</strong>
                  {item.detail && <div>{item.detail}</div>}
                </div>
                {!item.complete && (
                  <button type="button" onClick={() => onGoToWorkspace(item.workspace)}>
                    Go Fix
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="status-box" style={{ marginTop: '1rem' }}>
            <strong>Closing Summary</strong>
            <div>Round: {bundle.round.date}</div>
            <div>Players: {bundle.roundPlayers.filter((player) => !['dns', 'withdrawn', 'no-show', 'removed'].includes(player.status)).length}</div>
            <div>Scorecards: {bundle.scorecards.length}</div>
            <div>Event Log entries: {bundle.tournamentEvents.length}</div>
            <div>Bear Tracker version: {APP_VERSION}</div>
          </div>

          <button
            type="button"
            onClick={onFinalize}
            disabled={!readiness.ready}
            style={{ marginTop: '1rem' }}
          >
            Finalize Tournament
          </button>
        </>
      )}
    </section>
  );
}
