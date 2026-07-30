import type { LeaguePlayer } from '../types/leaguePlayer';
import { getLeaguePlayerName } from '../types/leaguePlayer';

type Props = {
  players: LeaguePlayer[];
};

export default function LeaguePlayers({
  players
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
          disabled
          title="Player editing will be added in the next milestone."
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
              <th>GHIN</th>
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

                <td>—</td>
                <td>—</td>
                <td>—</td>

                <td>
                  <button
                    type="button"
                    disabled
                    title="Player editing will be added in the next milestone."
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