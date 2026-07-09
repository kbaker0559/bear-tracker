export type PayoutLookupRow = {
  playerCount: number;
  prizePool: number;
  greenies: Record<number, number>;
  skins: number;
  horseAss: number;
  placesTotal: number;
  places: number[];
};

export const payoutLookup: PayoutLookupRow[] = [
  { playerCount: 4, prizePool: 96, greenies: { 3: 4, 5: 4, 11: 4, 15: 4 }, skins: 30, horseAss: 10, placesTotal: 40, places: [40] },
  { playerCount: 5, prizePool: 120, greenies: { 3: 5, 5: 5, 11: 5, 15: 5 }, skins: 30, horseAss: 10, placesTotal: 60, places: [40, 20] },
  { playerCount: 6, prizePool: 144, greenies: { 3: 6, 5: 6, 11: 6, 15: 6 }, skins: 40, horseAss: 10, placesTotal: 70, places: [40, 30] },
  { playerCount: 7, prizePool: 168, greenies: { 3: 7, 5: 7, 11: 7, 15: 7 }, skins: 40, horseAss: 10, placesTotal: 90, places: [40, 30, 20] },
  { playerCount: 8, prizePool: 192, greenies: { 3: 8, 5: 8, 11: 8, 15: 8 }, skins: 45, horseAss: 10, placesTotal: 105, places: [50, 35, 20] },
  { playerCount: 9, prizePool: 216, greenies: { 3: 9, 5: 9, 11: 9, 15: 9 }, skins: 45, horseAss: 10, placesTotal: 125, places: [50, 30, 25, 20] },
  { playerCount: 10, prizePool: 240, greenies: { 3: 10, 5: 10, 11: 10, 15: 10 }, skins: 55, horseAss: 10, placesTotal: 135, places: [50, 40, 25, 20] },
  { playerCount: 11, prizePool: 264, greenies: { 3: 11, 5: 11, 11: 11, 15: 11 }, skins: 60, horseAss: 10, placesTotal: 150, places: [55, 45, 30, 20] },
  { playerCount: 12, prizePool: 288, greenies: { 3: 12, 5: 12, 11: 12, 15: 12 }, skins: 65, horseAss: 10, placesTotal: 165, places: [60, 50, 35, 20] },
  { playerCount: 13, prizePool: 312, greenies: { 3: 13, 5: 13, 11: 13, 15: 13 }, skins: 70, horseAss: 10, placesTotal: 180, places: [65, 55, 35, 25] },
  { playerCount: 14, prizePool: 336, greenies: { 3: 14, 5: 14, 11: 14, 15: 14 }, skins: 75, horseAss: 10, placesTotal: 195, places: [70, 60, 40, 25] },
  { playerCount: 15, prizePool: 360, greenies: { 3: 15, 5: 15, 11: 15, 15: 15 }, skins: 80, horseAss: 10, placesTotal: 210, places: [80, 60, 40, 30] },
  { playerCount: 16, prizePool: 384, greenies: { 3: 16, 5: 16, 11: 16, 15: 16 }, skins: 80, horseAss: 10, placesTotal: 230, places: [80, 60, 40, 30, 20] },
  { playerCount: 17, prizePool: 408, greenies: { 3: 17, 5: 17, 11: 17, 15: 17 }, skins: 85, horseAss: 10, placesTotal: 245, places: [85, 65, 40, 35, 20] },
  { playerCount: 18, prizePool: 432, greenies: { 3: 18, 5: 18, 11: 18, 15: 18 }, skins: 90, horseAss: 10, placesTotal: 260, places: [90, 65, 45, 40, 20] },
  { playerCount: 19, prizePool: 456, greenies: { 3: 19, 5: 19, 11: 19, 15: 19 }, skins: 95, horseAss: 10, placesTotal: 275, places: [95, 70, 50, 40, 20] },
  { playerCount: 20, prizePool: 480, greenies: { 3: 20, 5: 20, 11: 20, 15: 20 }, skins: 100, horseAss: 10, placesTotal: 290, places: [100, 75, 55, 40, 20] },
  { playerCount: 21, prizePool: 504, greenies: { 3: 21, 5: 21, 11: 21, 15: 21 }, skins: 105, horseAss: 10, placesTotal: 305, places: [100, 85, 60, 40, 20] },
  { playerCount: 22, prizePool: 528, greenies: { 3: 22, 5: 22, 11: 22, 15: 22 }, skins: 110, horseAss: 10, placesTotal: 320, places: [100, 85, 60, 45, 30] },
  { playerCount: 23, prizePool: 552, greenies: { 3: 23, 5: 23, 11: 23, 15: 23 }, skins: 115, horseAss: 10, placesTotal: 335, places: [100, 85, 70, 50, 30] },
  { playerCount: 24, prizePool: 576, greenies: { 3: 24, 5: 24, 11: 24, 15: 24 }, skins: 115, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 25, prizePool: 600, greenies: { 3: 25, 5: 25, 11: 25, 15: 25 }, skins: 135, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 26, prizePool: 624, greenies: { 3: 26, 5: 26, 11: 26, 15: 26 }, skins: 155, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 27, prizePool: 648, greenies: { 3: 27, 5: 27, 11: 27, 15: 27 }, skins: 175, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 28, prizePool: 672, greenies: { 3: 28, 5: 28, 11: 28, 15: 28 }, skins: 195, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 29, prizePool: 696, greenies: { 3: 29, 5: 29, 11: 29, 15: 29 }, skins: 215, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 30, prizePool: 720, greenies: { 3: 30, 5: 30, 11: 30, 15: 30 }, skins: 235, horseAss: 10, placesTotal: 355, places: [100, 85, 70, 60, 40] },
  { playerCount: 31, prizePool: 744, greenies: { 3: 31, 5: 31, 11: 31, 15: 31 }, skins: 250, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 32, prizePool: 768, greenies: { 3: 32, 5: 32, 11: 32, 15: 32 }, skins: 270, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 33, prizePool: 792, greenies: { 3: 33, 5: 33, 11: 33, 15: 33 }, skins: 290, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 34, prizePool: 816, greenies: { 3: 34, 5: 34, 11: 34, 15: 34 }, skins: 310, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 35, prizePool: 840, greenies: { 3: 35, 5: 35, 11: 35, 15: 35 }, skins: 330, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 36, prizePool: 864, greenies: { 3: 36, 5: 36, 11: 36, 15: 36 }, skins: 350, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 37, prizePool: 888, greenies: { 3: 37, 5: 37, 11: 37, 15: 37 }, skins: 370, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 38, prizePool: 912, greenies: { 3: 38, 5: 38, 11: 38, 15: 38 }, skins: 390, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 39, prizePool: 936, greenies: { 3: 39, 5: 39, 11: 39, 15: 39 }, skins: 410, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] },
  { playerCount: 40, prizePool: 960, greenies: { 3: 40, 5: 40, 11: 40, 15: 40 }, skins: 430, horseAss: 10, placesTotal: 360, places: [100, 85, 75, 60, 40] }
];

export function getPayoutLookup(playerCount: number): PayoutLookupRow {
  const row = payoutLookup.find((item) => item.playerCount === playerCount);

  if (!row) {
    throw new Error(`No payout lookup row found for ${playerCount} players.`);
  }

  return row;
}