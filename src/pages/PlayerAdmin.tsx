import type { Player } from '../types/models';
import { Card } from '../components/Card';

type PlayerAdminProps = {
  players: Player[];
  onChange: (players: Player[]) => void;
};

function updatePlayer(players: Player[], id: string, patch: Partial<Player>): Player[] {
  return players.map((player) => (player.id === id ? { ...player, ...patch } : player));
}

export function PlayerAdmin({ players, onChange }: PlayerAdminProps) {
  function addPlayer() {
    const newPlayer: Player = {
      id: `p${Date.now()}`,
      name: 'New Golfer',
      handicap: 0,
      quota: 0,
      pin: '0000',
      active: true,
      isAdmin: false
    };
    onChange([...players, newPlayer]);
  }

  return (
    <Card title="Admin · Players">
      <div className="toolbar">
        <button onClick={addPlayer}>Add golfer</button>
        <span className="muted">Edit handicaps, quotas, PINs, active status, and admin access.</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Name</th>
              <th>HDCP</th>
              <th>Quota</th>
              <th>PIN</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id}>
                <td><input type="checkbox" checked={player.active} onChange={(e) => onChange(updatePlayer(players, player.id, { active: e.target.checked }))} /></td>
                <td><input value={player.name} onChange={(e) => onChange(updatePlayer(players, player.id, { name: e.target.value }))} /></td>
                <td><input type="number" value={player.handicap} onChange={(e) => onChange(updatePlayer(players, player.id, { handicap: Number(e.target.value) }))} /></td>
                <td><input type="number" value={player.quota} onChange={(e) => onChange(updatePlayer(players, player.id, { quota: Number(e.target.value) }))} /></td>
                <td><input value={player.pin} inputMode="numeric" onChange={(e) => onChange(updatePlayer(players, player.id, { pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} /></td>
                <td><input type="checkbox" checked={Boolean(player.isAdmin)} onChange={(e) => onChange(updatePlayer(players, player.id, { isAdmin: e.target.checked }))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
