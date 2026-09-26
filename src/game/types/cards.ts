import type { ResourceType, Resources } from "./resources";

export type QuestionTopic =
  | "Economy"
  | "Education"
  | "Healthcare"
  | "Agriculture"
  | "Infrastructure"
  | "Governance"
  | "Society"
  | "Religion & Culture"
  | "Environment"
  | "Technology"
  | "National Security"
  | "Media"
  | "Elections";

export interface DecisionChoice {
  label: "Yes" | "No";
  rewards: Resources;
  dominantResource: ResourceType;
}

export interface DecisionCard {
  id: string;
  topic: QuestionTopic;
  question: string;
  yes: DecisionChoice;
  no: DecisionChoice;
}

export interface VoterCard {
  id: string;
  name: string;
  voters: number;
  cost: Resources;
}

export type PowerCategory = "resource" | "board" | "strategic";

/**
 * The inputs a power needs when it is played. The UI renders one control per
 * input and the server validates every one of them.
 */
export type PowerInput =
  | "targetPlayer"
  | "constituency"
  | "destination"
  | "resourcePick"
  | "resourceType"
  | "secondResourceType";

export interface PowerCard {
  id: string;
  name: string;
  category: PowerCategory;
  /** Plain-English rules text printed on the card. */
  description: string;
  inputs: PowerInput[];
  /** Number of resources chosen for `resourcePick` inputs. */
  resourcePickCount?: number;
  /** Passive cards trigger automatically and cannot be played. */
  passive?: boolean;
}

/** A physical copy of a sealed card. The deck can contain several copies of a power. */
export interface SealedCardInstance {
  instanceId: string;
  powerId: string;
}

export interface RoundModifiers {
  /** Sealed cards cannot be bought this round. */
  sealedMarketClosed?: boolean;
  /** Every voter card gives this many extra voters this round. */
  voterCardBonus?: number;
  /** Gerrymandering is not allowed this round. */
  gerrymanderDisabled?: boolean;
  /** Each player may gerrymander this many extra times this round. */
  extraGerrymanders?: number;
  /** Every political answer gives this many extra resources of its main ideology. */
  answerBonus?: number;
}

export type EventEffect =
  | { kind: "grantAll"; resources: Partial<Resources> }
  | { kind: "discardAll"; count: number }
  | { kind: "ideologyLeaderVoters"; ideology: ResourceType; voters: number }
  | { kind: "boardLeaderPenalty"; count: number }
  | { kind: "underdogVoters"; voters: number }
  | { kind: "modifier"; modifiers: RoundModifiers };

export interface EventCard {
  id: string;
  title: string;
  description: string;
  effect: EventEffect;
}

/** Everything a player may send when playing a sealed card or ideology ability. */
export interface PowerParams {
  targetPlayerId?: string;
  constituencyId?: string;
  destinationId?: string;
  resources?: Partial<Resources>;
  resourceType?: ResourceType;
  secondResourceType?: ResourceType;
}
