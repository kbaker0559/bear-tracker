import { useMemo, useState } from 'react';
import type { Player } from '../types';

type Props = {
  player: Player;
  entryFee: number;
  availableCredit: number;
  onComplete: (payment: {
    cashPaid: number;
    creditApplied: number;
  }) => void;
  onCancel: () => void;
};

export default function ArrivalPaymentForm({
  player,
  entryFee,
  availableCredit,
  onComplete,
  onCancel
}: Props) {
  const maximumCredit = Math.min(availableCredit, entryFee);

  const [creditApplied, setCreditApplied] =
    useState(maximumCredit);

  const [cashPaid, setCashPaid] = useState(
    entryFee - maximumCredit
  );

  const totalApplied = useMemo(
    () => creditApplied + cashPaid,
    [creditApplied, cashPaid]
  );

  const remainingDue = Math.max(entryFee - totalApplied, 0);
  const overpayment = Math.max(totalApplied - entryFee, 0);

  function updateCredit(value: number) {
    const nextCredit = Math.min(
      Math.max(value, 0),
      maximumCredit
    );

    setCreditApplied(nextCredit);
    setCashPaid(entryFee - nextCredit);
  }

  function completeArrival() {
    if (remainingDue !== 0 || overpayment !== 0) {
      return;
    }

    onComplete({
      cashPaid,
      creditApplied
    });
  }

  return (
    <section className="card">
      <h2>Complete Arrival</h2>

      <h3>{player.name}</h3>

      <div className="score-grid">
        <div className="score-row">
          <strong>Entry Fee</strong>
          <span>${entryFee}</span>
        </div>

        <div className="score-row">
          <strong>League Credit Available</strong>
          <span>${availableCredit}</span>
        </div>
      </div>

      <label>
        <strong>Credit Applied</strong>

        <input
          type="number"
          min="0"
          max={maximumCredit}
          step="1"
          value={creditApplied}
          onChange={(event) =>
            updateCredit(Number(event.target.value))
          }
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }}
        />
      </label>

      <label>
        <strong>Cash Received</strong>

        <input
          type="number"
          min="0"
          step="1"
          value={cashPaid}
          onChange={(event) =>
            setCashPaid(
              Math.max(Number(event.target.value), 0)
            )
          }
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }}
        />
      </label>

      <div className="score-grid">
        <div className="score-row">
          <strong>Remaining Due</strong>
          <span>${remainingDue}</span>
        </div>

        {overpayment > 0 && (
          <div className="score-row">
            <strong>Overpayment</strong>
            <span>${overpayment}</span>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem'
        }}
      >
        <button
          type="button"
          disabled={remainingDue !== 0 || overpayment !== 0}
          onClick={completeArrival}
        >
          Complete Arrival
        </button>

        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </section>
  );
}