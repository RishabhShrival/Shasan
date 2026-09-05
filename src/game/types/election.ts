export interface ElectionResult {
  playerId: string;
  constituenciesControlled: number;
  weightConstituenciesControlled: number;
}

export interface ElectionResults {
  standings: ElectionResult[];
  winnerPlayerIds: string[];
  isTie: boolean;
}
