import type { Group, Player } from '../types';

type Props = {
  players: Player[];
  scorecards: Group[];
  onAddScorecard: () => void;
};

export default function ScorecardBuilder({ players, scorecards, onAddScorecard }: Props) {
  const playerName = (playerId: string) =>
    players.find((player) => player.id === playerId)?.name ?? playerId;

  return (
    <section className="card">
      <div className="row">
        <div>
          <h2>Scorecard Builder</h2>
          <p>Build today&apos;s scorecards from checked-in players.</p>
        </div>
        <button onClick={onAddScorecard}>Add Scorecard</button>
      </div>

      <div className="score-grid">
        {scorecards.map((card) => (
          <div className="score-row" key={card.id}>
            <strong>{card.name.replace('Group', 'Card')}</strong>
            <span>{card.playerIds.length} players</span>

            <ul>
              {card.playerIds.map((playerId) => (
                <li key={playerId}>{playerName(playerId)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}