export interface ConstituencyDefinition {
  id: string;
  name: string;
  region: string;
  electoralWeight: number;
  adjacentConstituencyIds: string[];
}

export interface Constituency extends ConstituencyDefinition {
  voterCounts: Record<string, number>;
  totalVoters: number;
  controllingPlayerId?: string;
}
