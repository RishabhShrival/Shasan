export interface ElectionResult {
  playerId: string;
  constituenciesControlled: number;
  /** Sum of seats of every constituency where the player holds a majority. */
  seatsWon: number;
  /** Tie-breaker: all voters the player has on the board. */
  totalVoters: number;
}

export interface ElectionResults {
  standings: ElectionResult[];
  winnerPlayerIds: string[];
  isTie: boolean;
}
