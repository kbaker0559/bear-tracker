import type { Group, Player } from '../types';

type Props = {
  players: Player[];
  groups: Group[];
};

export default function RoundSetup({ players, groups }: Props) {
  const activePlayers = players.filter((player) => player.active);

  return (
    <section className="card">
      <h2>Round Setup</h2>

      <p>
        <strong>Players Checked In:</strong> {activePlayers.length}
      </p>

      <h3>Checked-In Players</h3>
      <ul>
        {activePlayers.map((player) => (
          <li key={player.id}>
            {player.name} — HDCP {player.handicap} — Quota {player.quota}
          </li>
        ))}
      </ul>

      <h3>Scorecards</h3>
      <ul>
        {groups.map((group) => (
          <li key={group.id}>
            {group.name.replace('Group', 'Card')} ({group.playerIds.length} players)
          </li>
        ))}
      </ul>
    </section>
  );
}