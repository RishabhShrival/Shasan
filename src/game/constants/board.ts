import type { ConstituencyDefinition } from "../types/board";

export const BOARD_CONSTITUENCIES: ConstituencyDefinition[] = [
  { id: "aravali", name: "Aravali", region: "Northwest", electoralWeight: 3, adjacentConstituencyIds: ["gangetic", "central-plains"] },
  { id: "gangetic", name: "Gangetic", region: "North", electoralWeight: 5, adjacentConstituencyIds: ["aravali", "yamuna", "central-plains"] },
  { id: "yamuna", name: "Yamuna", region: "Northeast", electoralWeight: 4, adjacentConstituencyIds: ["gangetic", "eastern-hills", "central-plains"] },
  { id: "central-plains", name: "Central Plains", region: "Heartland", electoralWeight: 4, adjacentConstituencyIds: ["aravali", "gangetic", "yamuna", "deccan", "eastern-hills"] },
  { id: "deccan", name: "Deccan", region: "Central", electoralWeight: 5, adjacentConstituencyIds: ["central-plains", "western-coast", "eastern-hills", "southern-coast"] },
  { id: "eastern-hills", name: "Eastern Hills", region: "East", electoralWeight: 3, adjacentConstituencyIds: ["yamuna", "central-plains", "deccan", "southern-coast", "delta"] },
  { id: "western-coast", name: "Western Coast", region: "Southwest", electoralWeight: 4, adjacentConstituencyIds: ["deccan", "southern-coast"] },
  { id: "southern-coast", name: "Southern Coast", region: "South", electoralWeight: 5, adjacentConstituencyIds: ["western-coast", "deccan", "eastern-hills", "delta"] },
  { id: "delta", name: "Delta", region: "Southeast", electoralWeight: 3, adjacentConstituencyIds: ["southern-coast", "eastern-hills"] },
];
