import type { GamePlayer } from "./player";
import type { Constituency } from "./board";
import type { DecisionCard, EventCard, PowerCard, PowerCategory, RoundModifiers, SealedCardInstance, VoterCard } from "./cards";
import type { ResourceType, Resources } from "./resources";
import type { ElectionResults } from "./election";

export type GameStatus = "PLAYING" | "FINISHED";

export type GamePhase = "POLITICAL_DECISION" | "ACTION_PHASE" | "ELECTION_RESULTS";

export type GameLogType =
  | "GAME_STARTED"
  | "ROUND_STARTED"
  | "EVENT"
  | "TURN_ENDED"
  | "TURN_SKIPPED"
  | "DECISION_MADE"
  | "VOTERS_PURCHASED"
  | "VOTERS_PLACED"
  | "GERRYMANDER"
  | "POWER_PURCHASED"
  | "POWER_USED"
  | "POWER_BLOCKED"
  | "ABILITY_USED"
  | "MAJORITY"
  | "GAME_FINISHED";

export interface GameLog {
  id: string;
  type: GameLogType;
  message: string;
  timestamp: number;
  playerId?: string;
}

/** Private intel revealed by the "Opinion Poll" power. Only the owner sees it. */
export interface PrivateIntel {
  targetPlayerId: string;
  round: number;
  resources: Resources;
  sealedCardNames: string[];
}

export interface PlayerCardState {
  resources: Resources;
  sealedCards: SealedCardInstance[];
  /** How many answers of each ideology this player has given. Public. */
  ideologyProfile: Record<ResourceType, number>;
  abilityCharges: Record<ResourceType, number>;
  /**
   * New voters (bought, or gained from a power/event) that MUST be placed on the
   * board during this player's current/next action phase before doing anything else.
   */
  votersToPlace: number;
  /**
   * Evicted voters: removed from the board by a rival's power (or a hung re-poll)
   * and sent back to this player. They can be placed again on any of their turns.
   */
  reserveVoters: number;
  /** Rivals cannot remove, convert or move this player's voters until their next turn starts. */
  votersShielded: boolean;
  /** Effects that apply during this player's NEXT turn. */
  nextTurn: {
    skipQuestion: boolean;
    voterPurchaseBlocked: boolean;
    sealedUseBlocked: boolean;
    voterSurcharge: number;
  };
  intel?: PrivateIntel;
}

export interface DecisionResolution {
  playerId: string;
  cardId: string;
  question: string;
  choice: "Yes" | "No";
  awarded: Resources;
  dominantResource: ResourceType;
}

export interface TurnState {
  decisionMade: boolean;
  /** Extra questions the active player may still answer this turn. */
  extraQuestions: number;
  gerrymandersUsed: number;
  gerrymandersAllowed: number;
  /** Resources knocked off the next voter card bought this turn. */
  voterDiscount: number;
  voterPurchaseBlocked: boolean;
  sealedUseBlocked: boolean;
  voterSurcharge: number;
  /** Whether the voter market was already refreshed this turn. */
  voterMarketRefreshed: boolean;
}

export interface GameState {
  id: string;
  roomCode: string;
  status: GameStatus;
  players: GamePlayer[];
  board: Constituency[];
  decisionDeck: string[];
  discardedDecisionCardIds: string[];
  currentDecisionCardId?: string;
  currentDecisionResolution?: DecisionResolution;
  voterDeck: string[];
  /** Always three slots. A bought slot is refilled immediately. */
  voterMarket: string[];
  voterDiscard: string[];
  sealedDeck: SealedCardInstance[];
  sealedMarket: SealedCardInstance[];
  sealedDiscard: SealedCardInstance[];
  eventDeck: string[];
  currentEventId?: string;
  playerCards: Record<string, PlayerCardState>;
  turnState: TurnState;
  electionResults?: ElectionResults;
  currentPlayerId: string;
  currentRound: number;
  turnNumber: number;
  phase: GamePhase;
  actionLog: GameLog[];
  createdAt: number;
  updatedAt: number;
}

export interface PublicPlayerStats {
  playerId: string;
  totalVoters: number;
  /** Evicted voters waiting to return to the board. */
  reserveVoters: number;
  resourceCount: number;
  sealedCardCount: number;
  constituenciesControlled: number;
  seatsControlled: number;
  ideologyProfile: Record<ResourceType, number>;
  votersShielded: boolean;
}

/** Only the question is public. What each answer pays stays hidden until it is chosen. */
export type PublicDecision = Pick<DecisionCard, "id" | "topic" | "question">;

export interface SealedMarketSlot {
  instanceId: string;
  category: PowerCategory;
}

export interface OwnedSealedCard extends PowerCard {
  instanceId: string;
}

export interface GameView {
  id: string;
  roomCode: string;
  status: GameStatus;
  phase: GamePhase;
  players: GamePlayer[];
  board: Constituency[];
  currentPlayerId: string;
  currentRound: number;
  turnNumber: number;
  turnState: TurnState;
  currentDecision?: PublicDecision;
  currentDecisionResolution?: DecisionResolution;
  currentEvent?: EventCard;
  roundModifiers: RoundModifiers;
  voterMarket: VoterCard[];
  sealedMarket: SealedMarketSlot[];
  sealedDeckCount: number;
  playerStats: PublicPlayerStats[];
  electionResults?: ElectionResults;
  actionLog: GameLog[];
  createdAt: number;
  updatedAt: number;
  rules: PublicRules;
  yourCards: {
    resources: Resources;
    sealedCards: OwnedSealedCard[];
    abilityCharges: Record<ResourceType, number>;
    votersToPlace: number;
    reserveVoters: number;
    nextTurn: PlayerCardState["nextTurn"];
    intel?: PrivateIntel;
  };
}

export interface PublicRules {
  maxResources: number;
  sealedCardPrice: number;
  profileBonusEvery: number;
  profileBonusAmount: number;
  abilityEvery: number;
}

export interface CreateGameInput {
  roomCode: string;
  players: GamePlayer[];
}

export interface GameConfig {
  maxPlayers: number;
  minPlayers: number;
  /** Maximum resources a player may hold. */
  maxResources: number;
  /** Number of resources (any mix) paid for a sealed card. */
  sealedCardPrice: number;
  /** Gerrymanders allowed per turn. */
  gerrymandersPerTurn: number;
  /** When true, a player tied for the most voters may also gerrymander. */
  gerrymanderAllowTiedLead: boolean;
  /** Every N answers of the same ideology award `profileBonusAmount` resources of it. */
  profileBonusEvery: number;
  profileBonusAmount: number;
  /** Every N answers of the same ideology unlock one ideology ability charge. */
  abilityEvery: number;
  /** Resources every player starts with (gives flexibility on the first turn). */
  startingResources: Resources;
  /** Copies of each sealed card in the deck. */
  sealedCopies: number;
}
