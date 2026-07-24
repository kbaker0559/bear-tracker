import type { TournamentEvent } from '../types/tournamentEvent';
import type {
  MissionControl,
  MissionWorkspace
} from '../engine/missionControlEngine';
import { formatQuotaResult } from '../engine/missionControlEngine';

type Props = {
  roundDate: string;
  mission: MissionControl;
  recentEvents: TournamentEvent[];
  onNavigate: (workspace: MissionWorkspace) => void;
};

const stageIcon = {
  complete: '✓',
  'in-progress': '●',
  'not-started': '○'
} as const;

function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatEventTime(value: string): string {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function HomeWorkspace({
  roundDate,
  mission,
  recentEvents,
  onNavigate
}: Props) {
  return (
    <div className="mission-control">
      <section className="card mission-hero">
        <div>
          <p className="eyebrow">Black Bear Saturday</p>
          <h2>{formatDate(roundDate)}</h2>
          <p className={`mission-status ${mission.statusLabel === 'Finalized' ? 'complete' : ''}`}>
            {mission.statusLabel === 'Finalized' ? '🔒' : '🟢'} {mission.statusLabel}
          </p>
        </div>

        <div className="mission-stage-summary">
          <span>Current Stage</span>
          <strong>{mission.stageLabel}</strong>
          <span>{mission.progressPercent}% complete</span>
        </div>

        <div className="mission-progress" aria-label={`${mission.progressPercent}% complete`}>
          <div style={{ width: `${mission.progressPercent}%` }} />
        </div>
      </section>

      <section className="card mission-next-action">
        <p className="eyebrow">Next Action</p>
        <h2>{mission.nextActionLabel}</h2>
        <p>{mission.nextActionDetail}</p>
        <button type="button" onClick={() => onNavigate(mission.nextWorkspace)}>
          Continue →
        </button>
      </section>

      <section className="card">
        <h2>Tournament Progress</h2>
        <div className="mission-stage-grid">
          {mission.stages.map((stage) => (
            <div key={stage.id} className={`mission-stage ${stage.status}`}>
              <span className="mission-stage-icon">{stageIcon[stage.status]}</span>
              <div>
                <strong>{stage.label}</strong>
                {stage.detail && <small>{stage.detail}</small>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Tournament Snapshot</h2>
        <div className="mission-metrics">
          <div><span>Players</span><strong>{mission.snapshot.checkedInPlayers} / {mission.snapshot.participatingPlayers}</strong></div>
          <div><span>Scorecards</span><strong>{mission.snapshot.verifiedScorecards} / {mission.snapshot.totalScorecards}</strong></div>
          <div><span>Leader</span><strong>{mission.snapshot.leaderName ?? '—'}{mission.snapshot.leaderResult !== undefined ? ` ${formatQuotaResult(mission.snapshot.leaderResult)}` : ''}</strong></div>
          <div><span>Skins</span><strong>{mission.snapshot.skins}</strong></div>
          <div><span>Greenies</span><strong>{mission.snapshot.greenies}</strong></div>
          <div><span>Outstanding Awards</span><strong>{mission.snapshot.outstandingAwards}</strong></div>
          <div><span>Treasury</span><strong>{mission.snapshot.treasuryLabel}</strong></div>
        </div>
      </section>

      {mission.alerts.length > 0 && (
        <section className="card mission-alerts">
          <h2>Needs Attention</h2>
          {mission.alerts.map((alert) => (
            <button
              key={alert.id}
              type="button"
              className="mission-alert"
              onClick={() => onNavigate(alert.workspace)}
            >
              <span>⚠</span>
              <span>{alert.message}</span>
              <span>Go Fix →</span>
            </button>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Recent Tournament Activity</h2>
        {recentEvents.length === 0 ? (
          <p>No tournament activity has been recorded yet.</p>
        ) : (
          <div className="mission-timeline">
            {recentEvents.map((event) => (
              <div key={event.id}>
                <time>{formatEventTime(event.occurredAt)}</time>
                <span>{event.summary}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
