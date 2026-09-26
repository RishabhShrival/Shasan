export interface ConstituencyDefinition {
  id: string;
  name: string;
  region: string;
  /** Total seats. Always an odd number between 5 and 19 so a majority is always clear. */
  seats: number;
  /** Grid position used by the board UI (row / column, 0-based). */
  row: number;
  col: number;
  adjacentConstituencyIds: string[];
}

export interface Constituency extends ConstituencyDefinition {
  /** Voters (filled seats) per player. */
  voterCounts: Record<string, number>;
  /** Filled seats. Can never exceed `seats`. */
  totalVoters: number;
  /** Seats needed for a majority: floor(seats / 2) + 1. */
  majorityThreshold: number;
  /** Player holding more than half of all seats, if any. */
  controllingPlayerId?: string;
  /** Rivals cannot remove, convert or move voters here while protected. */
  protectedByPlayerId?: string;
  /** No player can add voters here while locked. */
  lockedByPlayerId?: string;
}
