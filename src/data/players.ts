import type { Player } from '../types';

type PlayerSeed = [
  id: number,
  name: string,
  handicap: number,
  quota: number,
  status: 'Active' | 'Inactive'
];

const playerSeeds: PlayerSeed[] = [
  [4, 'Cooper Adams', 2, 31, 'Active'],
  [5, 'Tyler Adams', 9, 28, 'Active'],
  [10, 'John Ault', 10, 26, 'Active'],
  [20, 'Kurt Bacon', 6, 30, 'Active'],
  [30, 'Kevin Baker', 12, 19, 'Active'],
  [40, 'Chuck Blankenship', 12, 24, 'Active'],
  [50, 'Shawn Boone', 16, 15, 'Active'],
  [60, 'Elvis Brathwaite', 11, 21, 'Inactive'],
  [69, 'Tony Caisse', 9, 29, 'Active'],
  [70, 'Glenn Casselman', 12, 19, 'Active'],
  [80, 'Anthony Ciuzio', 4, 33, 'Active'],
  [90, 'Randy Cline', 10, 22, 'Active'],
  [100, 'Bruce Coleman', 11, 22, 'Active'],
  [110, 'Cam Crollard', 4, 30, 'Active'],
  [115, 'Blake Donahue', 4, 29, 'Active'],
  [120, 'Brad Eberts', 6, 26, 'Active'],
  [130, 'Dave Hall', 9, 26, 'Active'],
  [140, 'George Heider', 6, 29, 'Active'],
  [150, 'Tom Hopkins', 17, 15, 'Inactive'],
  [160, 'Quentin Jackson', 6, 26, 'Inactive'],
  [170, 'Chris Kennedy', 10, 23, 'Active'],
  [180, 'Mark Knuuttila', 10, 22, 'Active'],
  [190, 'Justin Lamanna', 4, 22, 'Active'],
  [200, 'Eric Lassiter', 10, 23, 'Active'],
  [210, 'Russ Lizzoli', 16, 15, 'Active'],
  [214, 'Don Maines', 13, 19, 'Active'],
  [215, 'Mike Marshall', 8, 23, 'Active'],
  [220, 'Gil Newkerk', 20, 12, 'Active'],
  [230, 'Mike Ondrasik', 13, 18, 'Active'],
  [240, 'Gary Pardue', 7, 29, 'Active'],
  [250, 'Mike Piano', 12, 26, 'Active'],
  [260, 'Preston Rager', 11, 19, 'Active'],
  [280, 'Steve Robin', 10, 26, 'Active'],
  [290, 'Ed Sanchez', 12, 19, 'Active'],
  [300, 'Neal Self', 10, 23, 'Active'],
  [310, 'Brian Shannon', 11, 20, 'Active'],
  [320, 'Les Smith', 19, 15, 'Active'],
  [330, 'Wayne Smith', 11, 18, 'Active'],
  [335, 'Chuck Stallings', 13, 20, 'Inactive'],
  [340, 'Fred Tucker', 6, 29, 'Active'],
  [350, 'Paul Tucker JR', 10, 26, 'Active'],
  [351, 'Paul Tucker SR', 7, 24, 'Active'],
  [360, 'Tom Tzobanakis', 12, 21, 'Active'],
  [370, 'Russ Wambles', 11, 20, 'Inactive'],
  [380, 'Greg Watson', 14, 19, 'Active'],
  [390, 'Tom Zahn', 8, 28, 'Active']
];

export const initialPlayers: Player[] = playerSeeds.map(
  ([id, name, handicap, quota, status], index) => ({
    id: String(id),
    name,
    handicap,
    quota,
    pin: name === 'Kevin Baker' ? '1234' : String(1000 + index),
    active: status === 'Active',
    isAdmin: name === 'Kevin Baker'
  })
);