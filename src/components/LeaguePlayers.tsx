import type { LeaguePlayer } from '../types/leaguePlayer';
import { getLeaguePlayerName } from '../types/leaguePlayer';

type Props = {
  players: LeaguePlayer[];
  onAddPlayer: () => void;
  onEditPlayer: (player: LeaguePlayer) => void;
};

export default function LeaguePlayers({
  players,
  onAddPlayer,
  onEditPlayer
}: Props) {
  const sortedPlayers = [...players].sort((a, b) =>
  a.lastName.localeCompare(b.lastName) ||
  a.firstName.localeCompare(b.firstName)
);

  return (
    <section className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <p className="eyebrow">
            Permanent League Roster
          </p>

          <h2>League Players</h2>

          <p>
            {players.filter((player) => player.active).length}{' '}
            active players and{' '}
            {players.filter((player) => !player.active).length}{' '}
            inactive players.
          </p>
        </div>

        <button
  type="button"
  onClick={onAddPlayer}
>
  Add Player
</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Active</th>
              <th>Player</th>
              <th>Aliases</th>
<th>Default Tee</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id}>
                <td>
                  {player.active ? 'Yes' : 'No'}
                </td>

                <td>
                  <strong>{getLeaguePlayerName(player)}</strong>
                </td>

                <td>
  {player.aliases.length > 0
    ? player.aliases.map((alias) => alias.value).join(', ')
    : '—'}
</td>
<td>{player.preferredTee ?? '—'}</td>

                <td>
                  <button
  type="button"
  onClick={() => onEditPlayer(player)}
>
  Edit
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}