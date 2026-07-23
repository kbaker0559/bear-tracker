import { useMemo, useState } from 'react';
import type { Player } from '../types';

type ArrivalPayment = {
  cashPaid: number;
  creditApplied: number;
  paidByPlayerId?: string;
  note?: string;
};

type PaymentMode =
  | 'cash-and-credit'
  | 'paid-by-another';

type Props = {
  player: Player;
  payerOptions: Player[];
  entryFee: number;
  availableCredit: number;
  onComplete: (payment: ArrivalPayment) => void;
  onCancel: () => void;
};

export default function ArrivalPaymentForm({
  player,
  payerOptions,
  entryFee,
  availableCredit,
  onComplete,
  onCancel
}: Props) {
  const maximumCredit = Math.min(
    availableCredit,
    entryFee
  );

  const [paymentMode, setPaymentMode] =
    useState<PaymentMode>('cash-and-credit');

  const [creditApplied, setCreditApplied] =
    useState(0);

  const [cashPaid, setCashPaid] =
    useState(entryFee);

  const [paidByPlayerId, setPaidByPlayerId] =
    useState('');

  const [note, setNote] = useState('');

  const totalApplied = useMemo(
    () => creditApplied + cashPaid,
    [creditApplied, cashPaid]
  );

  const remainingDue = Math.max(
    entryFee - totalApplied,
    0
  );

  const overpayment = Math.max(
    totalApplied - entryFee,
    0
  );

  const selectedPayer =
    payerOptions.find(
      (candidate) =>
        candidate.id === paidByPlayerId
    ) ?? null;

  function selectPaymentMode(
    nextMode: PaymentMode
  ) {
    setPaymentMode(nextMode);
    setCreditApplied(0);
    setCashPaid(entryFee);

    if (nextMode !== 'paid-by-another') {
      setPaidByPlayerId('');
    }
  }

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

    if (
      paymentMode === 'paid-by-another' &&
      !paidByPlayerId
    ) {
      return;
    }

    onComplete({
      cashPaid,
      creditApplied,
      paidByPlayerId:
        paymentMode === 'paid-by-another'
          ? paidByPlayerId
          : undefined,
      note: note.trim() || undefined
    });
  }

  return (
    <section className="card">
      <h2>Complete Arrival — Other</h2>

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

      <fieldset
        style={{
          marginTop: '1rem',
          marginBottom: '1rem',
          padding: '1rem'
        }}
      >
        <legend>
          <strong>How is this entry being handled?</strong>
        </legend>

        <label
          style={{
            display: 'block',
            marginBottom: '0.75rem'
          }}
        >
          <input
            type="radio"
            name="arrival-payment-mode"
            checked={paymentMode === 'cash-and-credit'}
            onChange={() =>
              selectPaymentMode('cash-and-credit')
            }
          />{' '}
          Different cash amount or league credit
        </label>

        <label style={{ display: 'block' }}>
          <input
            type="radio"
            name="arrival-payment-mode"
            checked={paymentMode === 'paid-by-another'}
            onChange={() =>
              selectPaymentMode('paid-by-another')
            }
          />{' '}
          Paid by another golfer
        </label>
      </fieldset>

      {paymentMode === 'paid-by-another' && (
        <label>
          <strong>Paid By</strong>

          <select
            value={paidByPlayerId}
            onChange={(event) =>
              setPaidByPlayerId(event.target.value)
            }
            style={{
              display: 'block',
              width: '100%',
              marginTop: '0.5rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              fontSize: '1rem'
            }}
          >
            <option value="">
              Select the golfer who provided the cash
            </option>

            {payerOptions.map((payer) => (
              <option
                key={payer.id}
                value={payer.id}
              >
                {payer.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {paymentMode === 'cash-and-credit' && (
        <label>
          <strong>League Credit Applied</strong>

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
      )}

      <label>
        <strong>Cash Received</strong>

        <input
          type="number"
          min="0"
          step="1"
          value={cashPaid}
          onChange={(event) =>
            setCashPaid(
              Math.max(
                Number(event.target.value),
                0
              )
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

      <label>
        <strong>Optional Note</strong>

        <textarea
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          placeholder="Example: Kevin handed Cam $50 for his own entry and Fred's."
          rows={3}
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

      {paymentMode === 'paid-by-another' && (
        <div
          className="status-box"
          style={{ marginTop: '1rem' }}
        >
          <strong>Payment Summary</strong>
          <div>{player.name}'s entry is satisfied.</div>
          <div>
            Paid by:{' '}
            {selectedPayer?.name ?? 'Select a golfer'}
          </div>
          <div>Cash received: ${cashPaid}</div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          disabled={
            remainingDue !== 0 ||
            overpayment !== 0 ||
            (paymentMode === 'paid-by-another' &&
              !paidByPlayerId)
          }
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
