import { TurnManager } from "./TurnManager";
import { BoardManager } from "./BoardManager";
import { CardManager } from "./CardManager";
import { ResourceManager } from "./ResourceManager";
import { ElectionManager } from "./ElectionManager";
import { BOARD_CONSTITUENCIES } from "../constants/board";
import { POWER_CARD_COST } from "../cards/powers";
import { EMPTY_RESOURCES, type CreateGameInput, type GameConfig, type GamePlayer, type GameState, type Resources } from "../types";

export class GameEngineError extends Error {}

export interface GameEngineDependencies {
  createId?: () => string;
  now?: () => number;
  random?: () => number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 2,
  maxPlayers: 5,
  maxRounds: 8,
};

export class GameEngine {
  private readonly turnManager: TurnManager;
  private readonly boardManager: BoardManager;
  private readonly cardManager: CardManager;
  private readonly resourceManager = new ResourceManager();
  private readonly electionManager = new ElectionManager();
  private readonly createId: () => string;
  private readonly now: () => number;
  private readonly random: () => number;
  readonly config: GameConfig;

  constructor(
    config: Partial<GameConfig> = {},
    dependencies: GameEngineDependencies = {},
  ) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.turnManager = new TurnManager(this.config);
    this.boardManager = new BoardManager(BOARD_CONSTITUENCIES);
    this.random = dependencies.random ?? Math.random;
    this.cardManager = new CardManager(this.random);
    this.createId = dependencies.createId ?? (() => crypto.randomUUID());
    this.now = dependencies.now ?? (() => Date.now());
  }

  createGame(input: CreateGameInput) {
    this.assertValidPlayers(input.players);
    const timestamp = this.now();
    const decisionDeck = this.cardManager.createDecisionDeck();
    const currentDecisionCardId = this.cardManager.drawDecision(decisionDeck);
    const game: GameState = {
      id: this.createId(),
      roomCode: input.roomCode,
      status: "PLAYING",
      players: input.players.map((player) => ({ ...player })),
      board: this.boardManager.createBoard(input.players.map((player) => player.id)),
      decisionDeck,
      discardedDecisionCardIds: [],
      currentDecisionCardId,
      voterOfferIds: this.cardManager.drawVoterOffers(),
      powerOfferId: this.cardManager.drawPowerOffer(),
      playerCards: Object.fromEntries(input.players.map((player) => [player.id, {
        powerCardIds: [],
        resourceCards: { ...EMPTY_RESOURCES },
        resourceAbilityCharges: { ...EMPTY_RESOURCES },
        turnsToSkip: 0,
        resources: { ...EMPTY_RESOURCES },
        pendingVoters: 0,
      }])),
      turnState: { decisionMade: false, actionTaken: false, majorityShiftTaken: false },
      currentPlayerId: input.players[0].id,
      currentRound: 1,
      maxRounds: this.config.maxRounds,
      phase: "GAME_SETUP",
      actionLog: [
        {
          id: this.createId(),
          type: "GAME_STARTED",
          message: "The campaign has begun.",
          timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.turnManager.beginGame(game, timestamp);
    return game;
  }

  endTurn(game: GameState, playerId: string) {
    this.assertActivePlayer(game, playerId);
    if (!game.turnState.decisionMade || game.phase !== "ACTION_PHASE") {
      throw new GameEngineError("Complete your political decision and action before ending the turn.");
    }
    this.turnManager.endTurn(game, playerId, this.now());
    if (game.status === "PLAYING") {
      this.advanceDecisionCard(game);
      game.turnState = { decisionMade: false, actionTaken: false, majorityShiftTaken: false };
    } else {
      game.electionResults = this.electionManager.calculate(game.board, game.players);
    }
    return game;
  }

  makeDecision(game: GameState, playerId: string, choice: "Yes" | "No") {
    this.assertActivePlayer(game, playerId);
    if (choice !== "Yes" && choice !== "No") {
      throw new GameEngineError("A decision must be Yes or No.");
    }
    if (game.phase !== "POLITICAL_DECISION" || game.turnState.decisionMade || !game.currentDecisionCardId) {
      throw new GameEngineError("A political decision cannot be made right now.");
    }

    const card = this.cardManager.getDecision(game.currentDecisionCardId);
    const outcome = choice === "Yes" ? card.yes : card.no;
    const playerCards = this.getPlayerCards(game, playerId);
    const awarded = this.resourceManager.award(playerCards.resources, outcome.rewards);
    const now = this.now();
    playerCards.resourceCards[outcome.dominantResource] += 1;
    if (playerCards.resourceCards[outcome.dominantResource] % 3 === 0) {
      this.resourceManager.award(playerCards.resources, { ...EMPTY_RESOURCES, [outcome.dominantResource]: 4 });
    }
    if (playerCards.resourceCards[outcome.dominantResource] % 8 === 0) {
      playerCards.resourceAbilityCharges[outcome.dominantResource] += 1;
    }
    game.currentDecisionResolution = { playerId, choice, awarded, dominantResource: outcome.dominantResource };
    game.turnState.decisionMade = true;
    this.turnManager.setPhase(game, "ACTION_PHASE", now);
    game.actionLog.push({
      id: this.createId(), type: "DECISION_MADE", playerId, timestamp: now,
      message: `${this.getPlayerName(game, playerId)} chose ${choice}.`,
    });
    return game;
  }

  buyVoter(game: GameState, playerId: string, voterCardId: string) {
    this.assertActionAvailable(game, playerId);
    const playerCards = this.getPlayerCards(game, playerId);
    if (!game.voterOfferIds.includes(voterCardId)) {
      throw new GameEngineError("That voter offer is no longer available.");
    }
    const voterCard = this.cardManager.getVoter(voterCardId);
    this.resourceManager.spend(playerCards.resources, voterCard.cost);
    game.voterOfferIds = game.voterOfferIds.filter((id) => id !== voterCardId);
    if (game.voterOfferIds.length === 0) {
      game.voterOfferIds = this.cardManager.drawVoterOffers();
    }
    playerCards.pendingVoters += voterCard.voters;
    game.turnState.actionTaken = true;
    const now = this.now();
    this.turnManager.setPhase(game, "INFLUENCE", now);
    game.actionLog.push({ id: this.createId(), type: "VOTERS_PURCHASED", playerId, timestamp: now, message: `${this.getPlayerName(game, playerId)} secured a voter network.` });
    return game;
  }

  placeInfluence(game: GameState, playerId: string, constituencyId: string, count: number) {
    this.assertActivePlayer(game, playerId);
    if (game.phase !== "INFLUENCE") {
      throw new GameEngineError("Voters can only be placed after purchasing a voter offer.");
    }
    const playerCards = this.getPlayerCards(game, playerId);
    if (!Number.isInteger(count) || count < 1 || count > playerCards.pendingVoters) {
      throw new GameEngineError("Choose a valid number of voters to place.");
    }
    if (playerCards.pendingVoters < 1) {
      throw new GameEngineError("You have no voters waiting to be placed.");
    }
    this.boardManager.addVoters(game.board, constituencyId, playerId, count);
    playerCards.pendingVoters -= count;
    const now = this.now();
    if (playerCards.pendingVoters === 0) this.turnManager.setPhase(game, "ACTION_PHASE", now);
    game.actionLog.push({ id: this.createId(), type: "INFLUENCE_PLACED", playerId, timestamp: now, message: `${this.getPlayerName(game, playerId)} placed ${count} voter${count === 1 ? "" : "s"} in a constituency.` });
    return game;
  }

  buyPower(game: GameState, playerId: string) {
    this.assertActionAvailable(game, playerId);
    const playerCards = this.getPlayerCards(game, playerId);
    this.resourceManager.spend(playerCards.resources, POWER_CARD_COST);
    const powerCard = this.cardManager.getPower(game.powerOfferId);
    playerCards.powerCardIds.push(powerCard.id);
    game.powerOfferId = this.cardManager.drawPowerOffer();
    game.turnState.actionTaken = true;
    const now = this.now();
    game.actionLog.push({ id: this.createId(), type: "POWER_PURCHASED", playerId, timestamp: now, message: `${this.getPlayerName(game, playerId)} acquired a sealed power card.` });
    game.updatedAt = now;
    return game;
  }

  shiftMajorityVoter(game: GameState, playerId: string, fromConstituencyId: string, toConstituencyId: string) {
    this.assertActivePlayer(game, playerId);
    if (game.phase !== "ACTION_PHASE" || game.turnState.majorityShiftTaken) {
      throw new GameEngineError("You can shift one majority voter during your action phase each turn.");
    }
    const source = game.board.find((constituency) => constituency.id === fromConstituencyId);
    if (!source || source.controllingPlayerId !== playerId) {
      throw new GameEngineError("You can only shift a voter from a constituency you control by majority.");
    }
    this.boardManager.transferVoter(game.board, fromConstituencyId, toConstituencyId, playerId);
    game.turnState.majorityShiftTaken = true;
    const now = this.now();
    game.actionLog.push({ id: this.createId(), type: "INFLUENCE_PLACED", playerId, timestamp: now, message: `${this.getPlayerName(game, playerId)} shifted one voter from a majority constituency.` });
    game.updatedAt = now;
    return game;
  }

  usePower(game: GameState, playerId: string, powerCardId: string, targetPlayerId?: string, constituencyId?: string) {
    this.assertActivePlayer(game, playerId);
    const playerCards = this.getPlayerCards(game, playerId);
    if (!playerCards.powerCardIds.includes(powerCardId)) throw new GameEngineError("You do not own that power card.");
    const power = this.cardManager.getPower(powerCardId);
    const target = targetPlayerId ? this.getPlayerCards(game, targetPlayerId) : undefined;
    const now = this.now();
    if (power.id === "fresh-mandate") playerCards.pendingVoters += 2;
    else if (power.id === "resource-levy") this.transferResources(targetPlayerId, playerId, game, 8);
    else if (power.id === "public-grant") this.transferResources(playerId, targetPlayerId, game, 8);
    else if (power.id === "voter-eviction") this.removeOrConvertVoters(game, playerId, targetPlayerId, constituencyId, 4, false);
    else if (power.id === "conversion-drive") this.removeOrConvertVoters(game, playerId, targetPlayerId, constituencyId, 5, true);
    else if (power.id === "missed-sittings") {
      if (!target) throw new GameEngineError("Choose another player for this power.");
      target.turnsToSkip += 2;
    } else if (power.id === "procedural-delay") {
      if (!target) throw new GameEngineError("Choose another player for this power.");
      target.turnsToSkip += 1;
    } else if (power.id === "double-hearing") {
      if (game.phase !== "ACTION_PHASE") throw new GameEngineError("Use Double Hearing during your action phase.");
      this.advanceDecisionCard(game);
      game.turnState.decisionMade = false;
      game.turnState.actionTaken = false;
      this.turnManager.setPhase(game, "POLITICAL_DECISION", now);
    }
    if (power.target === "player" && (!targetPlayerId || targetPlayerId === playerId || !target)) throw new GameEngineError("Choose another player for this power.");
    playerCards.powerCardIds = playerCards.powerCardIds.filter((id) => id !== powerCardId);
    const targetName = targetPlayerId ? this.getPlayerName(game, targetPlayerId) : undefined;
    const constituencyName = constituencyId ? game.board.find((constituency) => constituency.id === constituencyId)?.name : undefined;
    const targetDescription = targetName && constituencyName
      ? ` against ${targetName} in ${constituencyName}`
      : targetName
        ? ` against ${targetName}`
        : constituencyName
          ? ` in ${constituencyName}`
          : "";
    game.actionLog.push({ id: this.createId(), type: "POWER_USED", playerId, timestamp: now, message: `${this.getPlayerName(game, playerId)} used ${power.name}${targetDescription}.` });
    game.updatedAt = now;
    return game;
  }

  useResourceAbility(game: GameState, playerId: string, resourceType: keyof Resources, targetPlayerId?: string, constituencyId?: string) {
    this.assertActivePlayer(game, playerId);
    const playerCards = this.getPlayerCards(game, playerId);
    if (playerCards.resourceAbilityCharges[resourceType] < 1) throw new GameEngineError("You have not unlocked that ideology ability.");
    if (resourceType === "capitalism") this.removeOrConvertVoters(game, playerId, targetPlayerId, constituencyId, 3, true);
    if (resourceType === "communism") this.transferResources(targetPlayerId, playerId, game, 12);
    if (resourceType === "socialism") playerCards.pendingVoters += 5;
    if (resourceType === "fascism") this.removeOrConvertVoters(game, playerId, targetPlayerId, constituencyId, 5, false);
    playerCards.resourceAbilityCharges[resourceType] -= 1;
    const now = this.now();
    const targetName = targetPlayerId ? this.getPlayerName(game, targetPlayerId) : undefined;
    const constituencyName = constituencyId ? game.board.find((constituency) => constituency.id === constituencyId)?.name : undefined;
    const targetDescription = targetName && constituencyName
      ? ` against ${targetName} in ${constituencyName}`
      : targetName
        ? ` against ${targetName}`
        : constituencyName
          ? ` in ${constituencyName}`
          : "";
    game.actionLog.push({ id: this.createId(), type: "RESOURCE_ABILITY_USED", playerId, timestamp: now, message: `${this.getPlayerName(game, playerId)} used a ${resourceType} ideology ability${targetDescription}.` });
    game.updatedAt = now;
    return game;
  }

  setPlayerConnection(game: GameState, playerId: string, isConnected: boolean) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new GameEngineError("This player is not part of the game.");
    }

    player.isConnected = isConnected;
    game.updatedAt = this.now();
    return game;
  }

  snapshot(game: GameState) {
    return structuredClone(game);
  }

  getBoardManager() {
    return this.boardManager;
  }

  getElectionManager() {
    return this.electionManager;
  }

  createView(game: GameState, playerId: string) {
    if (!game.players.some((player) => player.id === playerId)) {
      throw new GameEngineError("This player is not part of the game.");
    }

    const { decisionDeck, discardedDecisionCardIds, ...visibleGame } = this.snapshot(game);
    void decisionDeck;
    void discardedDecisionCardIds;
    const { currentDecisionCardId, playerCards, voterOfferIds, powerOfferId, ...publicGame } = visibleGame;
    const privateCards = playerCards[playerId];
    if (!privateCards) {
      throw new GameEngineError("This player does not have a card state.");
    }

    return {
      ...publicGame,
      currentDecision: currentDecisionCardId ? this.toPublicDecision(this.cardManager.getDecision(currentDecisionCardId)) : undefined,
      powerOffer: this.cardManager.getPower(powerOfferId),
      yourCards: {
        voterOffers: voterOfferIds.map((cardId) => this.cardManager.getVoter(cardId)),
        powerCards: privateCards.powerCardIds.map((cardId) => this.cardManager.getPower(cardId)),
        resourceCards: { ...privateCards.resourceCards },
        resourceAbilityCharges: { ...privateCards.resourceAbilityCharges },
        resources: { ...privateCards.resources },
        pendingVoters: privateCards.pendingVoters,
      },
    };
  }

  private toPublicDecision(card: import("../types").DecisionCard) {
    return { id: card.id, title: card.title, scenario: card.scenario };
  }

  private assertActivePlayer(game: GameState, playerId: string) {
    if (game.status !== "PLAYING" || game.currentPlayerId !== playerId) {
      throw new GameEngineError("It is not your turn.");
    }
  }

  private assertActionAvailable(game: GameState, playerId: string) {
    this.assertActivePlayer(game, playerId);
    if (game.phase !== "ACTION_PHASE" || !game.turnState.decisionMade || game.turnState.actionTaken) {
      throw new GameEngineError("You cannot take another action right now.");
    }
  }

  private getPlayerCards(game: GameState, playerId: string) {
    const playerCards = game.playerCards[playerId];
    if (!playerCards) throw new GameEngineError("This player does not have a card state.");
    return playerCards;
  }

  private getPlayerName(game: GameState, playerId: string) {
    return game.players.find((player) => player.id === playerId)?.username ?? "A player";
  }

  private transferResources(fromPlayerId: string | undefined, toPlayerId: string | undefined, game: GameState, limit: number) {
    if (!fromPlayerId || !toPlayerId || fromPlayerId === toPlayerId) throw new GameEngineError("Choose another player for this power.");
    const from = this.getPlayerCards(game, fromPlayerId).resources;
    const to = this.getPlayerCards(game, toPlayerId).resources;
    let remaining = Math.min(limit, 12 - this.resourceManager.getTotal(to));
    for (const type of Object.keys(from) as (keyof Resources)[]) {
      const amount = Math.min(from[type], remaining);
      from[type] -= amount;
      to[type] += amount;
      remaining -= amount;
    }
  }

  private removeOrConvertVoters(game: GameState, playerId: string, targetPlayerId: string | undefined, constituencyId: string | undefined, limit: number, convert: boolean) {
    if (!targetPlayerId || targetPlayerId === playerId || !constituencyId) throw new GameEngineError("Choose an opponent and constituency for this power.");
    const constituency = game.board.find((candidate) => candidate.id === constituencyId);
    if (!constituency) throw new GameEngineError("That constituency does not exist.");
    const amount = Math.min(limit, constituency.voterCounts[targetPlayerId] ?? 0);
    if (amount < 1) throw new GameEngineError("That opponent has no voters in this constituency.");
    constituency.voterCounts[targetPlayerId] -= amount;
    if (convert) constituency.voterCounts[playerId] += amount;
    this.boardManager.recalculateControl(constituency);
  }

  private advanceDecisionCard(game: GameState) {
    if (game.currentDecisionCardId) game.discardedDecisionCardIds.push(game.currentDecisionCardId);
    if (game.decisionDeck.length === 0) game.decisionDeck.push(...this.cardManager.createDecisionDeck());
    game.currentDecisionCardId = this.cardManager.drawDecision(game.decisionDeck);
    game.currentDecisionResolution = undefined;
  }

  private assertValidPlayers(players: GamePlayer[]) {
    if (players.length < this.config.minPlayers || players.length > this.config.maxPlayers) {
      throw new GameEngineError(`Games require ${this.config.minPlayers}–${this.config.maxPlayers} players.`);
    }

    const uniquePlayerIds = new Set(players.map((player) => player.id));
    if (uniquePlayerIds.size !== players.length) {
      throw new GameEngineError("Each player in a game must have a unique id.");
    }
  }
}
