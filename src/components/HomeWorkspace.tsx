import type { RoundGuidance } from '../engine/roundDirector';

type Props = {
  guidance: RoundGuidance;
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
  scorecardCount: number;
  onContinue: () => void;
};

export default function HomeWorkspace({
  guidance,
  expectedCount,
  checkedInCount,
  paidCount,
  scorecardCount,
  onContinue
}: Props) {
  return (
    <section className="card">
      <p className="eyebrow">Current Phase</p>
      <h2>{guidance.phaseLabel}</h2>

      <p>{guidance.message}</p>

      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '0.5rem'
          }}
        >
          <strong>Round Progress</strong>

          <span>{guidance.progressPercent}%</span>
        </div>

        <div
          style={{
            width: '100%',
            height: '1.25rem',
            background: '#e5e7eb',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${guidance.progressPercent}%`,
              height: '100%',
              background: '#2f855a',
              transition: 'width 200ms ease'
            }}
          />
        </div>
      </div>

      <div className="score-grid">
        <div className="score-row">
          <strong>Players Expected</strong>
          <span>{expectedCount}</span>
        </div>

        <div className="score-row">
          <strong>Arrived</strong>
          <span>{checkedInCount}</span>
        </div>

        <div className="score-row">
          <strong>Still Waiting</strong>
          <span>{guidance.waitingCount}</span>
        </div>

        <div className="score-row">
          <strong>Entries Satisfied</strong>
          <span>{paidCount}</span>
        </div>

        <div className="score-row">
          <strong>Scorecards</strong>
          <span>{scorecardCount}</span>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <p>
          <strong>Next Recommended Action</strong>
        </p>

        <button type="button" onClick={onContinue}>
          {guidance.actionLabel}
        </button>
      </div>
    </section>
  );
}