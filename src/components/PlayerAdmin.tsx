import type { Player } from '../types';

type Props = { players: Player[]; onChange: (players: Player[]) => void };

function updatePlayer(players: Player[], id: string, patch: Partial<Player>): Player[] {
  return players.map(p => p.id === id ? { ...p, ...patch } : p);
}

export function PlayerAdmin({ players, onChange }: Props) {
  function addPlayer() {
    const nextNumber = players.length + 1;
    onChange([...players, { id: `p${Date.now()}`, name: `New Player ${nextNumber}`, handicap: 0, quota: 0, active: true, pin: '0000' }]);
  }

  return <section className="card full"><div className="sectionHeader"><div><h2>Player Admin</h2><p>Edit handicaps, quotas, PINs, and active status. Changes save in this browser.</p></div><button onClick={addPlayer}>Add Golfer</button></div>
    <div className="playerTable">
      <div className="playerHead"><span>Name</span><span>HDCP</span><span>Quota</span><span>PIN</span><span>Active</span><span>Admin</span></div>
      {players.map(player => <div className="playerRow" key={player.id}>
        <input value={player.name} onChange={e=>onChange(updatePlayer(players, player.id, { name: e.target.value }))} />
        <input type="number" value={player.handicap} onChange={e=>onChange(updatePlayer(players, player.id, { handicap: Number(e.target.value) }))} />
        <input type="number" value={player.quota} onChange={e=>onChange(updatePlayer(players, player.id, { quota: Number(e.target.value) }))} />
        <input value={player.pin} onChange={e=>onChange(updatePlayer(players, player.id, { pin: e.target.value }))} />
        <input type="checkbox" checked={player.active} onChange={e=>onChange(updatePlayer(players, player.id, { active: e.target.checked }))} />
        <input type="checkbox" checked={!!player.isAdmin} onChange={e=>onChange(updatePlayer(players, player.id, { isAdmin: e.target.checked }))} />
      </div>)}
    </div>
  </section>;
}
