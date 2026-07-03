import type { Group } from '../types';

export const initialGroups: Group[] = [
  { id: 'g1', name: 'Group 1', playerIds: ['fred-tucker','paul-tucker-jr','steve-robin','russ-lizzoli'], scorekeeperIds: ['fred-tucker'] },
  { id: 'g2', name: 'Group 2', playerIds: ['cam-crollard','paul-tucker-sr','kevin-baker','mark-knuutilla'], scorekeeperIds: ['kevin-baker'] },
  { id: 'g3', name: 'Group 3', playerIds: ['tyler-adams','don-maines','dave-hall','ed-sanchez'], scorekeeperIds: ['dave-hall'] },
  { id: 'g4', name: 'Group 4', playerIds: ['neal-self','chuck-blankenship','bruce-coleman','george-heider'], scorekeeperIds: ['neal-self'] },
  { id: 'g5', name: 'Group 5', playerIds: ['anthony-ciuzio','tom-tzobanakis','shawn-boone','blake-donahue'], scorekeeperIds: ['anthony-ciuzio'] },
  { id: 'g6', name: 'Group 6', playerIds: ['wayne-smith','preston-rager','les-smith','mike-ondrasik'], scorekeeperIds: ['wayne-smith'] }
];
