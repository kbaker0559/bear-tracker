import type { Player, RoundSettings } from '../types';

type Props = {
  players: Player[];
  round: RoundSettings;
  onRoundChange: (round: RoundSettings) => void;
  onPlayersChange: (players: Player[]) => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RoundSetup({ players, round, onRoundChange, onPlayersChange }: Props) {
  const activeCount = players.filter(p => p.active).length;
  const inactiveCount = players.length - activeCount;

  function togglePlayer(id: string, active: boolean) {
    onPlayersChange(players.map(player => player.id === id ? { ...player, active } : player));
  }

  function activateAll() {
    onPlayersChange(players.map(player => ({ ...player, active: true })));
  }

  function deactivateAll() {
    if (!confirm('Mark every golfer inactive for this round?')) return;
    onPlayersChange(players.map(player => ({ ...player, active: false })));
  }

  function addGuest() {
    const name = prompt('Guest name?');
    if (!name) return;
    const handicap = Number(prompt('Guest handicap?', '0') ?? '0');
    const quota = Number(prompt('Guest quota?', '0') ?? '0');
    const guest: Player = {
      id: `guest-${Date.now()}`,
      name,
      handicap: Number.isFinite(handicap) ? handicap : 0,
      quota: Number.isFinite(quota) ? quota : 0,
      active: true,
      pin: '0000',
      isGuest: true
    };
    onPlayersChange([...players, guest]);
  }

  function newSaturdayRound() {
    const date = todayIso();
    onRoundChange({
      ...round,
      date,
      name: `Saturday Game ${new Date(date + 'T12:00:00').toLocaleDateString()}`,
      courseName: 'Black Bear Golf Club',
      notes: ''
    });
  }

  return <section className="card full">
    <div className="sectionHeader">
      <div>
        <h2>Round Setup</h2>
        <p>Create the Saturday round, choose active players, and add one-time guests before assigning groups.</p>
      </div>
      <button onClick={newSaturdayRound}>New Saturday Round</button>
    </div>

    <div className="setupGrid">
      <label>Round name
        <input value={round.name} onChange={e => onRoundChange({ ...round, name: e.target.value })} />
      </label>
      <label>Date
        <input type="date" value={round.date} onChange={e => onRoundChange({ ...round, date: e.target.value })} />
      </label>
      <label>Course
        <input value={round.courseName} onChange={e => onRoundChange({ ...round, courseName: e.target.value })} />
      </label>
      <label>Notes
        <input value={round.notes} onChange={e => onRoundChange({ ...round, notes: e.target.value })} placeholder="Tee times, weather, special notes" />
      </label>
    </div>

    <div className="statusStrip">
      <strong>{activeCount}</strong> active golfers · <strong>{inactiveCount}</strong> inactive · <strong>{players.filter(p=>p.isGuest).length}</strong> guests
    </div>

    <div className="buttonRow">
      <button onClick={activateAll}>Activate All</button>
      <button onClick={deactivateAll}>Deactivate All</button>
      <button onClick={addGuest}>Add Guest</button>
    </div>

    <div className="roundRoster">
      {players.map(player => <label key={player.id} className={player.active ? 'rosterItem activeRoster' : 'rosterItem'}>
        <input type="checkbox" checked={player.active} onChange={e => togglePlayer(player.id, e.target.checked)} />
        <span>{player.name}{player.isGuest ? ' · guest' : ''}</span>
        <small>HDCP {player.handicap} · Quota {player.quota}</small>
      </label>)}
    </div>
  </section>;
}
