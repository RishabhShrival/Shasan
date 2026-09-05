import type { GamePlayer } from "./player";
import type { Constituency } from "./board";
import type { DecisionCard, PowerCard, VoterCard } from "./cards";
import type { Resources } from "./resources";
import type { ResourceType } from "./resources";
import type { ElectionResults } from "./election";

export type GameStatus = "PLAYING" | "FINISHED";

export type GamePhase =
  | "GAME_SETUP"
  | "POLITICAL_DECISION"
  | "ACTION_PHASE"
  | "INFLUENCE"
  | "EVENT"
  | "NEXT_PLAYER"
  | "ROUND_COMPLETE"
  | "ELECTION_RESULTS";

export type GameLogType = "GAME_STARTED" | "TURN_ENDED" | "ROUND_STARTED" | "GAME_FINISHED" | "DECISION_MADE" | "VOTERS_PURCHASED" | "INFLUENCE_PLACED" | "POWER_PURCHASED" | "POWER_USED" | "RESOURCE_ABILITY_USED";

export interface GameLog {
  id: string;
  type: GameLogType;
  message: string;
  timestamp: number;
  playerId?: string;
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
  voterOfferIds: string[];
  powerOfferId: string;
  playerCards: Record<string, PlayerCardState>;
  turnState: TurnState;
  electionResults?: ElectionResults;
  currentPlayerId: string;
  currentRound: number;
  maxRounds: number;
  phase: GamePhase;
  actionLog: GameLog[];
  createdAt: number;
  updatedAt: number;
}

export interface PlayerCardState {
  powerCardIds: string[];
  resourceCards: Record<ResourceType, number>;
  resourceAbilityCharges: Record<ResourceType, number>;
  turnsToSkip: number;
  resources: Resources;
  pendingVoters: number;
}

export interface DecisionResolution {
  playerId: string;
  choice: "Yes" | "No";
  awarded: Resources;
  dominantResource: ResourceType;
}

export interface TurnState {
  decisionMade: boolean;
  actionTaken: boolean;
  majorityShiftTaken: boolean;
}

export interface GameView extends Omit<GameState, "decisionDeck" | "discardedDecisionCardIds" | "currentDecisionCardId" | "playerCards" | "voterOfferIds" | "powerOfferId"> {
  currentDecision?: Pick<DecisionCard, "id" | "title" | "scenario">;
  powerOffer: PowerCard;
  yourCards: {
    voterOffers: VoterCard[];
    powerCards: PowerCard[];
    resourceCards: Record<ResourceType, number>;
    resourceAbilityCharges: Record<ResourceType, number>;
    resources: Resources;
    pendingVoters: number;
  };
}

export interface CreateGameInput {
  roomCode: string;
  players: GamePlayer[];
}

export interface GameConfig {
  maxPlayers: number;
  minPlayers: number;
  maxRounds: number;
}
