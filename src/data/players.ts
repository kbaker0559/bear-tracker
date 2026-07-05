import type { Player } from '../types/models';

export const initialPlayers: Player[] = [
  ['fred-tucker','Fred Tucker',6,30],['paul-tucker-jr','Paul Tucker JR',10,27],['steve-robin','Steve Robin',11,23],
  ['russ-lizzoli','Russ Lizzoli',16,16],['cam-crollard','Cam Crollard',5,30],['paul-tucker-sr','Paul Tucker SR',8,25],
  ['kevin-baker','Kevin Baker',12,19],['mark-knuutilla','Mark Knuutilla',10,24],['tyler-adams','Tyler Adams',9,25],
  ['don-maines','Don Maines',13,21],['dave-hall','Dave Hall',9,26],['ed-sanchez','Ed Sanchez',12,21],
  ['neal-self','Neal Self',11,19],['chuck-blankenship','Chuck Blankenship',12,26],['bruce-coleman','Bruce Coleman',11,19],
  ['george-heider','George Heider',6,26],['anthony-ciuzio','Anthony Ciuzio',4,29],['tom-tzobanakis','Tom Tzobanakis',12,21],
  ['shawn-boone','Shawn Boone',16,15],['blake-donahue','Blake Donahue',4,23],['wayne-smith','Wayne Smith',11,18],
  ['preston-rager','Preston Rager',11,21],['les-smith','Les Smith',19,16],['mike-ondrasik','Mike Ondrasik',13,18]
].map(([id, name, handicap, quota], index) => ({
  id: String(id), name: String(name), handicap: Number(handicap), quota: Number(quota),
  pin: index === 6 ? '0559' : String(1000 + index),
  active: true,
  role: index === 6 ? 'admin' : 'player'
}));
