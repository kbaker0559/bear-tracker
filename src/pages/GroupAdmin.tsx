import { Card } from '../components/Card';
import type { Group, Player } from '../types/models';

type Props = {
  players: Player[];
  groups: Group[];
  onChange: (groups: Group[]) => void;
};

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? 'Unknown player';
}

export function GroupAdmin({ players, groups, onChange }: Props) {
  const activePlayers = players.filter((p) => p.active);
  const assignedIds = new Set(groups.flatMap((g) => g.playerIds));
  const availablePlayers = activePlayers.filter((p) => !assignedIds.has(p.id));

  function addGroup() {
    onChange([
      ...groups,
      { id: crypto.randomUUID(), name: `Group ${groups.length + 1}`, playerIds: [], scorekeeperIds: [] }
    ]);
  }

  function renameGroup(groupId: string, name: string) {
    onChange(groups.map((group) => group.id === groupId ? { ...group, name } : group));
  }

  function deleteGroup(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (group?.playerIds.length && !confirm('Delete this group and return its players to available?')) return;
    onChange(groups.filter((g) => g.id !== groupId));
  }

  function movePlayer(playerId: string, targetGroupId: string | null) {
    const withoutPlayer = groups.map((group) => ({
      ...group,
      playerIds: group.playerIds.filter((id) => id !== playerId),
      scorekeeperIds: group.scorekeeperIds.filter((id) => id !== playerId)
    }));

    if (!targetGroupId) {
      onChange(withoutPlayer);
      return;
    }

    onChange(withoutPlayer.map((group) => {
      if (group.id !== targetGroupId) return group;
      return {
        ...group,
        playerIds: [...group.playerIds, playerId],
        scorekeeperIds: group.scorekeeperIds.length === 0 ? [playerId] : group.scorekeeperIds
      };
    }));
  }

  function toggleScorekeeper(groupId: string, playerId: string) {
    onChange(groups.map((group) => {
      if (group.id !== groupId) return group;
      const isScorekeeper = group.scorekeeperIds.includes(playerId);
      const nextScorekeepers = isScorekeeper
        ? group.scorekeeperIds.filter((id) => id !== playerId)
        : [...group.scorekeeperIds, playerId];
      return { ...group, scorekeeperIds: nextScorekeepers };
    }));
  }

  function autoBuildGroups() {
    const ids = activePlayers.map((p) => p.id);
    const next: Group[] = [];
    for (let index = 0; index < ids.length; index += 4) {
      const playerIds = ids.slice(index, index + 4);
      next.push({
        id: crypto.randomUUID(),
        name: `Group ${next.length + 1}`,
        playerIds,
        scorekeeperIds: playerIds[0] ? [playerIds[0]] : []
      });
    }
    onChange(next);
  }

  return (
    <div className="grid two">
      <Card title="Available Players">
        <div className="toolbar">
          <button onClick={addGroup}>Add group</button>
          <button className="secondary" onClick={autoBuildGroups}>Auto-build foursomes</button>
        </div>
        <div className="player-pills">
          {availablePlayers.length === 0 && <p className="muted">All active players are assigned.</p>}
          {availablePlayers.map((player) => (
            <div className="player-pill" draggable key={player.id} onDragStart={(e) => e.dataTransfer.setData('text/plain', player.id)}>
              <strong>{player.name}</strong>
              <select value="" onChange={(e) => movePlayer(player.id, e.target.value)}>
                <option value="" disabled>Move to group…</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <div className="group-stack">
        {groups.map((group) => (
          <Card key={group.id} title="">
            <div className="group-header">
              <input value={group.name} onChange={(e) => renameGroup(group.id, e.target.value)} />
              <button className="danger" onClick={() => deleteGroup(group.id)}>Delete</button>
            </div>
            <div
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => movePlayer(e.dataTransfer.getData('text/plain'), group.id)}
            >
              {group.playerIds.length === 0 && <p className="muted">Drag players here.</p>}
              {group.playerIds.map((playerId) => (
                <div className="group-player" key={playerId} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', playerId)}>
                  <div>
                    <strong>{playerName(players, playerId)}</strong>
                    <label className="inline-check">
                      <input
                        type="checkbox"
                        checked={group.scorekeeperIds.includes(playerId)}
                        onChange={() => toggleScorekeeper(group.id, playerId)}
                      />
                      Scorekeeper
                    </label>
                  </div>
                  <button className="secondary" onClick={() => movePlayer(playerId, null)}>Remove</button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
