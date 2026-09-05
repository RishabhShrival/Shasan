import type { ResourceType, Resources } from "./resources";

export interface DecisionChoice {
  label: "Yes" | "No";
  rewards: Resources;
  dominantResource: ResourceType;
}

export interface DecisionCard {
  id: string;
  title: string;
  scenario: string;
  yes: DecisionChoice;
  no: DecisionChoice;
}

export interface VoterCard {
  id: string;
  voters: number;
  cost: Resources;
}

export type PowerTarget = "self" | "player" | "constituency" | "players";

export interface PowerCard {
  id: string;
  name: string;
  description: string;
  target: PowerTarget;
}
