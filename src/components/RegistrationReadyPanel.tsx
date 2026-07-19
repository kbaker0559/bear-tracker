type Props = {
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
  onStartRound: () => void;
};

export default function RegistrationReadyPanel({
  expectedCount,
  checkedInCount,
  paidCount,
  onStartRound
}: Props) {
  const ready =
    expectedCount > 0 &&
    checkedInCount === expectedCount &&
    paidCount === expectedCount;

  if (!ready) {
    return null;
  }

  return (
    <section className="card">
      <h2>Ready to Tee Off</h2>

      <p>
        All {expectedCount} players have arrived and all entries are
        satisfied.
      </p>

      <button type="button" onClick={onStartRound}>
        Start Round
      </button>
    </section>
  );
}