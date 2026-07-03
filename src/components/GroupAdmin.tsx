import type { Group, Player } from '../types';

type Props = {
  players: Player[];
  groups: Group[];
  onChange: (groups: Group[]) => void;
};

export function GroupAdmin({ players, groups, onChange }: Props) {
  const activePlayers = players.filter(p => p.active);
  const assigned = new Set(groups.flatMap(g => g.playerIds));
  const available = activePlayers.filter(p => !assigned.has(p.id));

  function movePlayer(playerId: string, targetGroupId: string) {
    onChange(groups.map(g => ({
      ...g,
      playerIds: g.id === targetGroupId
        ? Array.from(new Set([...g.playerIds, playerId]))
        : g.playerIds.filter(id => id !== playerId),
      scorekeeperIds: g.playerIds.includes(playerId) && g.id !== targetGroupId
        ? g.scorekeeperIds.filter(id => id !== playerId)
        : g.scorekeeperIds
    })));
  }

  function removePlayer(playerId: string) {
    onChange(groups.map(g => ({
      ...g,
      playerIds: g.playerIds.filter(id => id !== playerId),
      scorekeeperIds: g.scorekeeperIds.filter(id => id !== playerId)
    })));
  }

  function addGroup() {
    const next = groups.length + 1;
    onChange([...groups, { id: `g${Date.now()}`, name: `Group ${next}`, playerIds: [], scorekeeperIds: [] }]);
  }

  function deleteGroup(groupId: string) {
    if (!confirm('Delete this group? Players will return to Available Players.')) return;
    onChange(groups.filter(g => g.id !== groupId));
  }

  function renameGroup(groupId: string, name: string) {
    onChange(groups.map(g => g.id === groupId ? { ...g, name } : g));
  }

  function toggleScorekeeper(groupId: string, playerId: string) {
    onChange(groups.map(g => {
      if (g.id !== groupId) return g;
      const scorekeeperIds = g.scorekeeperIds.includes(playerId)
        ? g.scorekeeperIds.filter(id => id !== playerId)
        : [...g.scorekeeperIds, playerId];
      return { ...g, scorekeeperIds };
    }));
  }

  function playerName(id: string) {
    return players.find(p => p.id === id)?.name ?? id;
  }

  return <section className="card full">
    <div className="sectionHeader">
      <div><h2>Group Assignment</h2><p>Drag players into threesomes or foursomes. Check Scorekeeper for anyone allowed to enter the group card.</p></div>
      <button onClick={addGroup}>Add Group</button>
    </div>

    <div className="groupLayout">
      <div className="pool" onDragOver={e=>e.preventDefault()} onDrop={e=>removePlayer(e.dataTransfer.getData('playerId'))}>
        <h3>Available Players</h3>
        {available.length === 0 && <p className="muted">All active players are assigned.</p>}
        {available.map(p => <div className="draggablePlayer" draggable onDragStart={e=>e.dataTransfer.setData('playerId', p.id)} key={p.id}>
          {p.name}<span>HDCP {p.handicap} · Q {p.quota}</span>
        </div>)}
      </div>

      <div className="groupGrid">
        {groups.map(g => <div className="groupCard" key={g.id} onDragOver={e=>e.preventDefault()} onDrop={e=>movePlayer(e.dataTransfer.getData('playerId'), g.id)}>
          <div className="groupTitle"><input value={g.name} onChange={e=>renameGroup(g.id, e.target.value)} /><button onClick={()=>deleteGroup(g.id)}>Delete</button></div>
          {g.playerIds.length === 0 && <p className="muted">Drop players here.</p>}
          {g.playerIds.map(id => <div className="groupPlayer" draggable onDragStart={e=>e.dataTransfer.setData('playerId', id)} key={id}>
            <div><b>{playerName(id)}</b><span>{g.scorekeeperIds.includes(id) ? 'Scorekeeper' : 'Player'}</span></div>
            <label><input type="checkbox" checked={g.scorekeeperIds.includes(id)} onChange={()=>toggleScorekeeper(g.id, id)} /> Scorekeeper</label>
            <button onClick={()=>removePlayer(id)}>Remove</button>
          </div>)}
        </div>)}
      </div>
    </div>
  </section>;
}
