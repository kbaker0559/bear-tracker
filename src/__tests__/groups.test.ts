import { describe, expect, it } from 'vitest';
import { createDefaultGroups, groupsForScorekeeper, movePlayerToGroup, unassignedPlayers } from '../engine/groups';
import type { Player } from '../types';
const players: Player[] = [
  {id:'a',name:'A',handicap:1,quota:1,pin:'1',active:true,role:'admin'},
  {id:'b',name:'B',handicap:1,quota:1,pin:'2',active:true,role:'player'},
  {id:'c',name:'C',handicap:1,quota:1,pin:'3',active:true,role:'player'},
  {id:'d',name:'D',handicap:1,quota:1,pin:'4',active:true,role:'player'},
  {id:'e',name:'E',handicap:1,quota:1,pin:'5',active:true,role:'player'},
];

describe('group assignment', () => {
  it('creates default groups of requested size', () => {
    const groups = createDefaultGroups(players, 4);
    expect(groups).toHaveLength(2);
    expect(groups[0].playerIds).toEqual(['a','b','c','d']);
    expect(groups[1].playerIds).toEqual(['e']);
  });
  it('moves a player between groups', () => {
    const groups = createDefaultGroups(players, 4);
    const moved = movePlayerToGroup(groups, 'e', 'group-1');
    expect(moved[0].playerIds).toContain('e');
    expect(moved[1].playerIds).not.toContain('e');
  });
  it('finds unassigned players and scorekeeper groups', () => {
    const groups = movePlayerToGroup(createDefaultGroups(players, 4), 'e', 'unassigned');
    expect(unassignedPlayers(players, groups).map(p=>p.id)).toEqual(['e']);
    expect(groupsForScorekeeper(groups, 'a', false).map(g=>g.id)).toEqual(['group-1']);
    expect(groupsForScorekeeper(groups, 'e', false)).toEqual([]);
    expect(groupsForScorekeeper(groups, 'e', true)).toHaveLength(2);
  });
});
