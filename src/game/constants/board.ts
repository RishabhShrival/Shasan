import type { ConstituencyDefinition } from "../types/board";

/**
 * Fictional constituencies laid out on a 3 × 3 map. Constituencies are
 * adjacent when they share a border (left, right, above, below).
 * Every seat count is odd (5–19), so a majority is always unambiguous.
 */
export const BOARD_CONSTITUENCIES: ConstituencyDefinition[] = [
  { id: "himvant-hills", name: "Himvant Hills", region: "North-West", seats: 7, row: 0, col: 0, adjacentConstituencyIds: ["gangapur-valley", "marudhar-plains"] },
  { id: "gangapur-valley", name: "Gangapur Valley", region: "North", seats: 11, row: 0, col: 1, adjacentConstituencyIds: ["himvant-hills", "meghpur-heights", "madhyanagar"] },
  { id: "meghpur-heights", name: "Meghpur Heights", region: "North-East", seats: 5, row: 0, col: 2, adjacentConstituencyIds: ["gangapur-valley", "suryapur-district"] },
  { id: "marudhar-plains", name: "Marudhar Plains", region: "West", seats: 9, row: 1, col: 0, adjacentConstituencyIds: ["himvant-hills", "madhyanagar", "sagartat-coast"] },
  { id: "madhyanagar", name: "Madhyanagar Central", region: "Heartland", seats: 15, row: 1, col: 1, adjacentConstituencyIds: ["gangapur-valley", "marudhar-plains", "suryapur-district", "dakshin-plateau"] },
  { id: "suryapur-district", name: "Suryapur District", region: "East", seats: 9, row: 1, col: 2, adjacentConstituencyIds: ["meghpur-heights", "madhyanagar", "kaveri-delta"] },
  { id: "sagartat-coast", name: "Sagartat Coast", region: "South-West", seats: 13, row: 2, col: 0, adjacentConstituencyIds: ["marudhar-plains", "dakshin-plateau"] },
  { id: "dakshin-plateau", name: "Dakshin Plateau", region: "South", seats: 7, row: 2, col: 1, adjacentConstituencyIds: ["madhyanagar", "sagartat-coast", "kaveri-delta"] },
  { id: "kaveri-delta", name: "Kaveripattan Delta", region: "South-East", seats: 11, row: 2, col: 2, adjacentConstituencyIds: ["suryapur-district", "dakshin-plateau"] },
];

export const MIN_SEATS = 5;
export const MAX_SEATS = 20;

export function majorityThreshold(seats: number) {
  return Math.floor(seats / 2) + 1;
}
