import type { Round } from "../types/round";

type Props = {
  round: Round;
};

export default function RoundManager({ round }: Props) {
  return (
    <section className="card">
      <h2>Current Round</h2>

      <p><strong>Date:</strong> {round.date}</p>

      <p>
        <strong>Players Checked In:</strong>{" "}
        {round.players.length}
      </p>

      <h3>Scorecards</h3>

      <ul>
        {round.scorecards.map(card => (
          <li key={card.id}>
            {card.name} ({card.playerIds.length} players)
          </li>
        ))}
      </ul>
    </section>
  );
}