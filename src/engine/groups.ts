import type { Group, Player } from '../types';

export function createDefaultGroups(players: Player[], groupSize = 4): Group[] {
  const activeIds = players.filter(p => p.active).map(p => p.id);
  const groups: Group[] = [];
  for (let i = 0; i < activeIds.length; i += groupSize) {
    const ids = activeIds.slice(i, i + groupSize);
    groups.push({
      id: `group-${groups.length + 1}`,
      name: `Group ${groups.length + 1}`,
      playerIds: ids,
      scorekeeperIds: ids.length ? [ids[0]] : []
    });
  }
  return groups;
}

export function unassignedPlayers(players: Player[], groups: Group[]): Player[] {
  const assigned = new Set(groups.flatMap(g => g.playerIds));
  return players.filter(p => p.active && !assigned.has(p.id));
}

export function groupsForScorekeeper(groups: Group[], playerId: string, isAdmin: boolean): Group[] {
  return isAdmin ? groups : groups.filter(g => g.scorekeeperIds.includes(playerId));
}

export function movePlayerToGroup(groups: Group[], playerId: string, targetGroupId: string | 'unassigned'): Group[] {
  const removed = groups.map(g => ({ ...g, playerIds: g.playerIds.filter(id => id !== playerId), scorekeeperIds: g.scorekeeperIds.filter(id => id !== playerId) }));
  if (targetGroupId === 'unassigned') return removed;
  return removed.map(g => g.id === targetGroupId ? { ...g, playerIds: [...g.playerIds, playerId], scorekeeperIds: g.scorekeeperIds.length ? g.scorekeeperIds : [playerId] } : g);
}
