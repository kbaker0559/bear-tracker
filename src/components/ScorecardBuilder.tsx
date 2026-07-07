import type { Group, Player } from '../types';

import { sortPlayersByLastName } from '../utils/playerSort';
type Props = {
  players: Player[];
  scorecards: Group[];
  onAddScorecard: () => void;
  onAddPlayerToScorecard: (scorecardId: string, playerId: string) => void;
};

export default function ScorecardBuilder({
  players,
  scorecards,
  onAddScorecard,
  onAddPlayerToScorecard
}: Props) {
  const playerName = (playerId: string) =>
    players.find((player) => player.id === playerId)?.name ?? playerId;

  const assignedPlayerIds = new Set(scorecards.flatMap((card) => card.playerIds));

  const availablePlayers = sortPlayersByLastName(
  players.filter(
    (player) => player.active && !assignedPlayerIds.has(player.id)
  )
);

  return (
    <section className="card">
      <div className="row">
        <div>
          <h2>Scorecard Builder</h2>
          <p>Build today&apos;s scorecards from checked-in players.</p>
        </div>
        <button onClick={onAddScorecard}>Add Scorecard</button>
      </div>

      <p>
        <strong>Unassigned checked-in players:</strong> {availablePlayers.length}
      </p>

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

            <select
              value=""
              onChange={(event) => {
                if (event.target.value) {
                  onAddPlayerToScorecard(card.id, event.target.value);
                }
              }}
            >
              <option value="">+ Add Player</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}