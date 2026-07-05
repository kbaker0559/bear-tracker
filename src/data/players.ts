import type { Player } from '../types/models';
const rows: Array<[string, number, number]> = [
['Fred Tucker',6,30],['Paul Tucker JR',10,27],['Steve Robin',11,23],['Russ Lizzoli',16,16],['Cam Crollard',5,30],['Paul Tucker SR',8,25],['Kevin Baker',12,19],['Mark Knuutilla',10,24],['Tyler Adams',9,25],['Don Maines',13,21],['Dave Hall',9,26],['Ed Sanchez',12,21],['Neal Self',11,19],['Chuck Blankenship',12,26],['Bruce Coleman',11,19],['George Heider',6,26],['Anthony Ciuzio',4,29],['Tom Tzobanakis',12,21],['Shawn Boone',16,15],['Blake Donahue',4,23],['Wayne Smith',11,18],['Preston Rager',11,21],['Les Smith',19,16],['Mike Ondrasik',13,18]
];
export const initialPlayers: Player[] = rows.map(([name, handicap, quota], index) => ({ id: `p${index+1}`, name, handicap, quota, pin: index === 6 ? '1234' : String(1000 + index), active: true, isAdmin: index === 6 }));
