import type { Player } from '../types/models';
import { createPlayerId, resetPlayers } from '../services/storage';

type PlayerAdminProps = {
  players: Player[];
  onChange: (players: Player[]) => void;
};

export function PlayerAdmin({ players, onChange }: PlayerAdminProps) {
  function updatePlayer(id: string, patch: Partial<Player>) {
    onChange(players.map(player => player.id === id ? { ...player, ...patch } : player));
  }

  function addPlayer(formData: FormData) {
    const name = String(formData.get('name') ?? '').trim();
    if (!name) return;
    const handicap = Number(formData.get('handicap') ?? 0);
    const quota = Number(formData.get('quota') ?? 0);
    const pin = String(formData.get('pin') ?? '0000').trim() || '0000';
    onChange([...players, {
      id: createPlayerId(players),
      name,
      handicap,
      quota,
      pin,
      active: true,
      isAdmin: false,
    }]);
  }

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <h2>Player Admin</h2>
          <p>Edit handicaps, Stableford quotas, PINs, and active status before each Saturday round.</p>
        </div>
        <button className="secondary" onClick={() => onChange(resetPlayers())}>Reset Seed Players</button>
      </div>

      <div className="admin-list">
        {players.map(player => (
          <div className="player-edit-row" key={player.id}>
            <label>
              Name
              <input value={player.name} onChange={event => updatePlayer(player.id, { name: event.target.value })} />
            </label>
            <label>
              HDCP
              <input type="number" value={player.handicap} onChange={event => updatePlayer(player.id, { handicap: Number(event.target.value) })} />
            </label>
            <label>
              Quota
              <input type="number" value={player.quota} onChange={event => updatePlayer(player.id, { quota: Number(event.target.value) })} />
            </label>
            <label>
              PIN
              <input value={player.pin} onChange={event => updatePlayer(player.id, { pin: event.target.value })} />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={player.active} onChange={event => updatePlayer(player.id, { active: event.target.checked })} />
              Active
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={Boolean(player.isAdmin)} onChange={event => updatePlayer(player.id, { isAdmin: event.target.checked })} />
              Admin
            </label>
          </div>
        ))}
      </div>

      <form action={addPlayer} className="add-player-form">
        <h3>Add Golfer</h3>
        <input name="name" placeholder="Name" />
        <input name="handicap" type="number" placeholder="HDCP" />
        <input name="quota" type="number" placeholder="Quota" />
        <input name="pin" placeholder="PIN" />
        <button type="submit">Add</button>
      </form>
    </section>
  );
}
