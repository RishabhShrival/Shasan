import { TurnManager } from "./TurnManager";
import { BoardManager } from "./BoardManager";
import { CardManager } from "./CardManager";
import { ResourceManager } from "./ResourceManager";
import { ElectionManager } from "./ElectionManager";
import { PowerResolver } from "./PowerResolver";
import { BOARD_CONSTITUENCIES } from "../constants/board";
import {
  EMPTY_RESOURCES,
  RESOURCE_TYPES,
  isResourceType,
  type CreateGameInput,
  type GameConfig,
  type GameLogType,
  type GamePlayer,
  type GameState,
  type GameView,
  type PlayerCardState,
  type PowerParams,
  type ResourceType,
  type Resources,
  type RoundModifiers,
} from "../types";

export class GameEngineError extends Error {}

export interface GameEngineDependencies {
  createId?: () => string;
  now?: () => number;
  random?: () => number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  minPlayers: 2,
  maxPlayers: 5,
  maxResources: 12,
  sealedCardPrice: 4,
  gerrymandersPerTurn: 1,
  gerrymanderAllowTiedLead: false,
  profileBonusEvery: 3,
  profileBonusAmount: 2,
  abilityEvery: 5,
  sealedCopies: 2,
  startingResources: { capitalism: 1, idealism: 1, conservatism: 1, supremacy: 1 },
};

const MARKET_SIZE = 3;

/**
 * The authoritative THRONE rules engine. It is pure TypeScript with no UI or
 * network code so it can be unit tested and reused by other clients.
 *
 * Every public action runs against a draft copy of the game and is only
 * committed when all validation passes, so a rejected action never leaves the
 * game half-changed.
 */
export class GameEngine {
  private readonly turnManager = new TurnManager();
  private readonly boardManager: BoardManager;
  private readonly cardManager: CardManager;
  private readonly resourceManager: ResourceManager;
  private readonly electionManager = new ElectionManager();
  private readonly powerResolver: PowerResolver;
  private readonly createId: () => string;
  private readonly now: () => number;
  private readonly random: () => number;
  readonly config: GameConfig;

  constructor(config: Partial<GameConfig> = {}, dependencies: GameEngineDependencies = {}) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.random = dependencies.random ?? Math.random;
    this.createId = dependencies.createId ?? (() => crypto.randomUUID());
    this.now = dependencies.now ?? (() => Date.now());
    this.boardManager = new BoardManager(BOARD_CONSTITUENCIES);
    this.cardManager = new CardManager(this.random);
    this.resourceManager = new ResourceManager(this.config.maxResources);
    this.powerResolver = new PowerResolver(this.boardManager, this.resourceManager, this.cardManager, this.random);
  }

  // ════════════════════════════════════════════════════════════════════
  // Setup
  // ════════════════════════════════════════════════════════════════════

  createGame(input: CreateGameInput) {
    this.assertValidPlayers(input.players);
    const timestamp = this.now();
    const voterDeck = this.cardManager.createVoterDeck();
    const voterDiscard: string[] = [];
    const sealedDeck = this.cardManager.createSealedDeck(this.config.sealedCopies);
    const sealedDiscard: GameState["sealedDiscard"] = [];

    const game: GameState = {
      id: this.createId(),
      roomCode: input.roomCode,
      status: "PLAYING",
      players: input.players.map((player) => ({ ...player })),
      board: this.boardManager.createBoard(input.players.map((player) => player.id)),
      decisionDeck: this.cardManager.createDecisionDeck(),
      discardedDecisionCardIds: [],
      voterDeck,
      voterMarket: Array.from({ length: MARKET_SIZE }, () => this.cardManager.drawVoter(voterDeck, voterDiscard)),
      voterDiscard,
      sealedDeck,
      sealedMarket: Array.from({ length: MARKET_SIZE }, () => this.cardManager.drawSealed(sealedDeck, sealedDiscard))
        .filter((card): card is NonNullable<typeof card> => Boolean(card)),
      sealedDiscard,
      eventDeck: this.cardManager.createEventDeck(),
      playerCards: Object.fromEntries(input.players.map((player) => [player.id, this.createPlayerCards()])),
      turnState: this.freshTurnState(),
      currentPlayerId: input.players[0].id,
      currentRound: 1,
      turnNumber: 1,
      phase: "POLITICAL_DECISION",
      actionLog: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.log(game, "GAME_STARTED", "The campaign has begun. Win a majority in every constituency to end the election.");
    this.startTurn(game);
    return game;
  }

  // ════════════════════════════════════════════════════════════════════
  // Player actions
  // ════════════════════════════════════════════════════════════════════

  makeDecision(game: GameState, playerId: string, choice: "Yes" | "No") {
    return this.transact(game, (draft) => {
      this.assertActivePlayer(draft, playerId);
      if (choice !== "Yes" && choice !== "No") throw new GameEngineError("A decision must be Yes or No.");
      if (draft.phase !== "POLITICAL_DECISION" || !draft.currentDecisionCardId) {
        throw new GameEngineError("There is no political question to answer right now.");
      }

      const card = this.cardManager.getDecision(draft.currentDecisionCardId);
      const outcome = choice === "Yes" ? card.yes : card.no;
      const cards = this.getPlayerCards(draft, playerId);
      const reward: Resources = { ...outcome.rewards };
      reward[outcome.dominantResource] += this.modifiers(draft).answerBonus ?? 0;
      const awarded = this.resourceManager.award(cards.resources, reward);

      // Ideology profile, milestone bonus and ideology ability unlocks.
      const ideology = outcome.dominantResource;
      cards.ideologyProfile[ideology] += 1;
      const answers = cards.ideologyProfile[ideology];
      if (answers % this.config.profileBonusEvery === 0) {
        const bonus = this.resourceManager.award(cards.resources, { ...EMPTY_RESOURCES, [ideology]: this.config.profileBonusAmount });
        for (const type of RESOURCE_TYPES) awarded[type] += bonus[type];
      }
      if (answers % this.config.abilityEvery === 0) {
        cards.abilityCharges[ideology] += 1;
        this.log(draft, "ABILITY_USED", `${this.name(draft, playerId)} unlocked the ${this.cardManager.getAbility(ideology).name} ability.`, playerId);
      }

      draft.currentDecisionResolution = {
        playerId,
        cardId: card.id,
        question: card.question,
        choice,
        awarded,
        dominantResource: ideology,
      };
      if (draft.turnState.decisionMade && draft.turnState.extraQuestions > 0) draft.turnState.extraQuestions -= 1;
      draft.turnState.decisionMade = true;
      draft.phase = "ACTION_PHASE";
      this.log(draft, "DECISION_MADE", `${this.name(draft, playerId)} answered ${choice.toUpperCase()} and received ${this.describe(awarded) || "no resources (limit reached)"}.`, playerId);
    });
  }

  /** Buy one voter card from the market. The slot is refilled immediately. Can be repeated. */
  buyVoter(game: GameState, playerId: string, voterCardId: string) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      if (draft.turnState.voterPurchaseBlocked) throw new GameEngineError("Model Code of Conduct: you cannot buy voter cards this turn.");
      const slot = draft.voterMarket.indexOf(voterCardId);
      if (slot === -1) throw new GameEngineError("That voter card is no longer available.");

      const card = this.cardManager.getVoter(voterCardId);
      const cards = this.getPlayerCards(draft, playerId);
      const cost = this.resourceManager.discount(card.cost, draft.turnState.voterDiscount);
      const surcharge = draft.turnState.voterSurcharge;
      if (!this.resourceManager.canAfford(cards.resources, cost) ||
        this.resourceManager.getTotal(cards.resources) - this.resourceManager.getTotal(cost) < surcharge) {
        throw new GameEngineError("You cannot afford this voter card.");
      }
      this.resourceManager.spend(cards.resources, cost);
      if (surcharge > 0) this.resourceManager.removeRandom(cards.resources, surcharge, this.random);
      draft.turnState.voterDiscount = 0;

      const voters = card.voters + (this.modifiers(draft).voterCardBonus ?? 0);
      cards.reserveVoters += voters;
      draft.voterDiscard.push(voterCardId);
      draft.voterMarket[slot] = this.cardManager.drawVoter(draft.voterDeck, draft.voterDiscard);
      this.log(draft, "VOTERS_PURCHASED", `${this.name(draft, playerId)} bought ${card.name} (+${voters} voter${voters === 1 ? "" : "s"}).`, playerId);
    });
  }

  /**
   * Anti-stall rule: once per turn, discard any 1 resource to replace all 3
   * voter cards on the market with new ones.
   */
  refreshVoterMarket(game: GameState, playerId: string, discard: unknown) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      if (draft.turnState.voterMarketRefreshed) throw new GameEngineError("You have already refreshed the voter cards this turn.");
      const selection = this.resourceManager.parseSelection(discard, { exactly: 1 });
      const cards = this.getPlayerCards(draft, playerId);
      if (!this.resourceManager.canAfford(cards.resources, selection)) throw new GameEngineError("You do not own that resource.");
      this.resourceManager.spend(cards.resources, selection);
      draft.voterDiscard.push(...draft.voterMarket);
      draft.voterMarket = draft.voterMarket.map(() => this.cardManager.drawVoter(draft.voterDeck, draft.voterDiscard));
      draft.turnState.voterMarketRefreshed = true;
      this.log(draft, "VOTERS_PURCHASED", `${this.name(draft, playerId)} discarded 1 resource to refresh the voter cards.`, playerId);
    });
  }

  /** Place voters from reserve into a constituency with free seats. */
  placeVoters(game: GameState, playerId: string, constituencyId: string, count: number) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      const cards = this.getPlayerCards(draft, playerId);
      if (!Number.isInteger(count) || count < 1) throw new GameEngineError("Choose a valid number of voters.");
      if (count > cards.reserveVoters) throw new GameEngineError("You do not have that many voters in reserve.");
      const constituency = this.boardManager.addVoters(draft.board, constituencyId, playerId, count);
      cards.reserveVoters -= count;
      this.log(draft, "VOTERS_PLACED", `${this.name(draft, playerId)} placed ${count} voter${count === 1 ? "" : "s"} in ${constituency.name}.`, playerId);
    });
  }

  /**
   * Buy a sealed card by paying ANY 4 resources. The server checks the player
   * owns every selected resource and that exactly 4 were selected.
   */
  buySealedCard(game: GameState, playerId: string, instanceId: string, payment: unknown) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      if (this.modifiers(draft).sealedMarketClosed) throw new GameEngineError("Election dates are announced: sealed cards cannot be bought this round.");
      const slot = draft.sealedMarket.findIndex((card) => card.instanceId === instanceId);
      if (slot === -1) throw new GameEngineError("That sealed card is no longer available.");

      const cards = this.getPlayerCards(draft, playerId);
      const selection = this.resourceManager.parseSelection(payment, { exactly: this.config.sealedCardPrice });
      if (!this.resourceManager.canAfford(cards.resources, selection)) {
        throw new GameEngineError("You do not own all of the selected resources.");
      }
      this.resourceManager.spend(cards.resources, selection);

      const [card] = draft.sealedMarket.splice(slot, 1);
      cards.sealedCards.push(card);
      const replacement = this.cardManager.drawSealed(draft.sealedDeck, draft.sealedDiscard);
      if (replacement) draft.sealedMarket.splice(slot, 0, replacement);
      const category = this.cardManager.getPower(card.powerId).category;
      this.log(draft, "POWER_PURCHASED", `${this.name(draft, playerId)} bought a sealed ${category} card.`, playerId);
    });
  }

  useSealedCard(game: GameState, playerId: string, instanceId: string, params: PowerParams = {}) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      if (draft.turnState.sealedUseBlocked) throw new GameEngineError("Show-Cause Notice: you cannot play sealed cards this turn.");
      const cards = this.getPlayerCards(draft, playerId);
      const index = cards.sealedCards.findIndex((card) => card.instanceId === instanceId);
      if (index === -1) throw new GameEngineError("You do not own that sealed card.");
      const instance = cards.sealedCards[index];
      const power = this.cardManager.getPower(instance.powerId);
      if (power.passive) throw new GameEngineError(`${power.name} works automatically and cannot be played.`);

      cards.sealedCards.splice(index, 1);
      draft.sealedDiscard.push(instance);

      // Stay Order: automatically cancels a sealed card aimed at its holder.
      const targetId = power.inputs.includes("targetPlayer") ? params.targetPlayerId : undefined;
      if (targetId && targetId !== playerId && draft.playerCards[targetId]) {
        const targetCards = draft.playerCards[targetId];
        const stayIndex = targetCards.sealedCards.findIndex((card) => card.powerId === "stay-order");
        if (stayIndex !== -1) {
          draft.sealedDiscard.push(...targetCards.sealedCards.splice(stayIndex, 1));
          this.log(draft, "POWER_BLOCKED", `${this.name(draft, playerId)} played ${power.name} against ${this.name(draft, targetId)}, but a Stay Order cancelled it.`, playerId);
          return;
        }
      }

      const outcome = this.powerResolver.resolve(power.id, { game: draft, actorId: playerId, params });
      this.log(draft, "POWER_USED", `${this.name(draft, playerId)} played ${power.name}: ${outcome.summary}.`, playerId);
      if (power.id === "double-agenda") this.drawNextQuestion(draft);
    });
  }

  useAbility(game: GameState, playerId: string, ideology: ResourceType, params: PowerParams = {}) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      if (!isResourceType(ideology)) throw new GameEngineError("Unknown ideology.");
      const cards = this.getPlayerCards(draft, playerId);
      if (cards.abilityCharges[ideology] < 1) throw new GameEngineError("You have not unlocked that ideology ability.");
      const ability = this.cardManager.getAbility(ideology);
      const outcome = this.powerResolver.resolve(ability.id, { game: draft, actorId: playerId, params });
      cards.abilityCharges[ideology] -= 1;
      this.log(draft, "ABILITY_USED", `${this.name(draft, playerId)} used ${ability.name}: ${outcome.summary}.`, playerId);
    });
  }

  /**
   * Gerrymandering: move ONE voter (a rival's or your own) from a constituency
   * where you have the most voters to an adjacent constituency.
   */
  gerrymander(game: GameState, playerId: string, fromConstituencyId: string, toConstituencyId: string, voterOwnerId: string) {
    return this.transact(game, (draft) => {
      this.assertActionPhase(draft, playerId);
      if (this.modifiers(draft).gerrymanderDisabled) throw new GameEngineError("The court has frozen delimitation: no gerrymandering this round.");
      if (draft.turnState.gerrymandersUsed >= draft.turnState.gerrymandersAllowed) {
        throw new GameEngineError("You have already gerrymandered this turn.");
      }
      if (!draft.players.some((player) => player.id === voterOwnerId)) throw new GameEngineError("Choose whose voter to move.");

      const source = this.boardManager.getConstituency(draft.board, fromConstituencyId);
      if (!this.boardManager.hasLead(source, playerId, this.config.gerrymanderAllowTiedLead)) {
        throw new GameEngineError(`You need the highest number of voters in ${source.name} to gerrymander there.`);
      }
      this.powerResolver.assertCanAffect(draft, playerId, source, voterOwnerId);
      const { destination } = this.boardManager.moveVoters(draft.board, source.id, toConstituencyId, voterOwnerId, 1);
      draft.turnState.gerrymandersUsed += 1;
      const whose = voterOwnerId === playerId ? "their own voter" : `1 of ${this.name(draft, voterOwnerId)}'s voters`;
      this.log(draft, "GERRYMANDER", `${this.name(draft, playerId)} gerrymandered ${whose} from ${source.name} to ${destination.name}.`, playerId);
    });
  }

  endTurn(game: GameState, playerId: string) {
    return this.transact(game, (draft) => {
      this.assertActivePlayer(draft, playerId);
      if (!draft.turnState.decisionMade || draft.phase !== "ACTION_PHASE") {
        throw new GameEngineError("Answer the political question before ending your turn.");
      }
      this.log(draft, "TURN_ENDED", `${this.name(draft, playerId)} ended their turn.`, playerId);
      this.resolveHungConstituencies(draft);
      this.advanceTurn(draft);
    });
  }

  setPlayerConnection(game: GameState, playerId: string, isConnected: boolean) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) throw new GameEngineError("This player is not part of the game.");
    player.isConnected = isConnected;
    game.updatedAt = this.now();
    return game;
  }

  // ════════════════════════════════════════════════════════════════════
  // Views
  // ════════════════════════════════════════════════════════════════════

  snapshot(game: GameState) {
    return structuredClone(game);
  }

  getBoardManager() {
    return this.boardManager;
  }

  /** Builds the per-player view. Hidden information (decks, rivals' cards and resources) is stripped. */
  createView(game: GameState, playerId: string): GameView {
    const privateCards = game.playerCards[playerId];
    if (!privateCards || !game.players.some((player) => player.id === playerId)) {
      throw new GameEngineError("This player is not part of the game.");
    }
    const state = this.snapshot(game);
    return {
      id: state.id,
      roomCode: state.roomCode,
      status: state.status,
      phase: state.phase,
      players: state.players,
      board: state.board,
      currentPlayerId: state.currentPlayerId,
      currentRound: state.currentRound,
      turnNumber: state.turnNumber,
      turnState: state.turnState,
      currentDecision: state.currentDecisionCardId ? this.cardManager.getDecision(state.currentDecisionCardId) : undefined,
      currentDecisionResolution: state.currentDecisionResolution,
      currentEvent: state.currentEventId ? this.cardManager.getEvent(state.currentEventId) : undefined,
      roundModifiers: this.modifiers(state),
      voterMarket: state.voterMarket.map((cardId) => this.cardManager.getVoter(cardId)),
      sealedMarket: state.sealedMarket.map((card) => ({
        instanceId: card.instanceId,
        category: this.cardManager.getPower(card.powerId).category,
      })),
      sealedDeckCount: state.sealedDeck.length + state.sealedDiscard.length,
      playerStats: state.players.map((player) => {
        const cards = state.playerCards[player.id];
        const controlled = state.board.filter((constituency) => constituency.controllingPlayerId === player.id);
        return {
          playerId: player.id,
          totalVoters: this.boardManager.totalVoters(state.board, player.id),
          reserveVoters: cards.reserveVoters,
          resourceCount: this.resourceManager.getTotal(cards.resources),
          sealedCardCount: cards.sealedCards.length,
          constituenciesControlled: controlled.length,
          seatsControlled: controlled.reduce((total, constituency) => total + constituency.seats, 0),
          ideologyProfile: cards.ideologyProfile,
          votersShielded: cards.votersShielded,
        };
      }),
      electionResults: state.electionResults,
      actionLog: state.actionLog.slice(-60),
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      rules: {
        maxResources: this.config.maxResources,
        sealedCardPrice: this.config.sealedCardPrice,
        profileBonusEvery: this.config.profileBonusEvery,
        profileBonusAmount: this.config.profileBonusAmount,
        abilityEvery: this.config.abilityEvery,
      },
      yourCards: {
        resources: privateCards.resources,
        sealedCards: privateCards.sealedCards.map((card) => ({ ...this.cardManager.getPower(card.powerId), instanceId: card.instanceId })),
        abilityCharges: privateCards.abilityCharges,
        reserveVoters: privateCards.reserveVoters,
        nextTurn: privateCards.nextTurn,
        intel: privateCards.intel,
      },
    };
  }

  // ════════════════════════════════════════════════════════════════════
  // Internals
  // ════════════════════════════════════════════════════════════════════

  /** Runs an action on a draft and commits it only when it succeeds. */
  private transact(game: GameState, action: (draft: GameState) => void) {
    if (game.status !== "PLAYING") throw new GameEngineError("This election is over.");
    const draft = this.snapshot(game);
    action(draft);
    this.afterBoardChange(game, draft);
    draft.updatedAt = this.now();
    Object.assign(game, draft);
    return game;
  }

  private createPlayerCards(): PlayerCardState {
    return {
      resources: { ...this.config.startingResources },
      sealedCards: [],
      ideologyProfile: { ...EMPTY_RESOURCES },
      abilityCharges: { ...EMPTY_RESOURCES },
      reserveVoters: 0,
      votersShielded: false,
      nextTurn: { skipQuestion: false, voterPurchaseBlocked: false, sealedUseBlocked: false, voterSurcharge: 0 },
    };
  }

  private freshTurnState(): GameState["turnState"] {
    return {
      decisionMade: false,
      extraQuestions: 0,
      gerrymandersUsed: 0,
      gerrymandersAllowed: this.config.gerrymandersPerTurn,
      voterDiscount: 0,
      voterPurchaseBlocked: false,
      sealedUseBlocked: false,
      voterSurcharge: 0,
      voterMarketRefreshed: false,
    };
  }

  /**
   * Hung constituency re-poll (prevents deadlock): when a constituency is full
   * but nobody has a majority, at the end of the turn every player who is NOT
   * tied for the most voters there gets their voters back in reserve. If all
   * players there are tied, each of them takes 1 voter back instead.
   */
  private resolveHungConstituencies(game: GameState) {
    for (const constituency of game.board) {
      if (constituency.controllingPlayerId || constituency.totalVoters < constituency.seats) continue;
      const present = Object.entries(constituency.voterCounts).filter(([, count]) => count > 0);
      const highest = Math.max(...present.map(([, count]) => count));
      const trailing = present.filter(([, count]) => count < highest);
      const returned = trailing.length > 0
        ? trailing.map(([playerId, count]) => [playerId, count] as const)
        : present.map(([playerId]) => [playerId, 1] as const);
      for (const [playerId, count] of returned) {
        constituency.voterCounts[playerId] -= count;
        this.getPlayerCards(game, playerId).reserveVoters += count;
      }
      this.boardManager.recalculateControl(constituency);
      const names = returned.map(([playerId, count]) => `${this.name(game, playerId)} (${count})`).join(", ");
      this.log(game, "MAJORITY", `HUNG VERDICT in ${constituency.name}: all seats filled but no majority. Re-poll — voters returned to reserve: ${names}.`);
    }
  }

  private advanceTurn(game: GameState) {
    const newRound = this.turnManager.advance(game);
    if (newRound) this.startRound(game);
    this.startTurn(game);
  }

  private startRound(game: GameState) {
    game.currentEventId = this.cardManager.drawEvent(game.eventDeck);
    const event = this.cardManager.getEvent(game.currentEventId);
    this.log(game, "ROUND_STARTED", `Round ${game.currentRound} begins.`);
    this.log(game, "EVENT", `EVENT — ${event.title}: ${event.description}`);
    this.applyEvent(game);
  }

  private applyEvent(game: GameState) {
    if (!game.currentEventId) return;
    const { effect } = this.cardManager.getEvent(game.currentEventId);
    const all = game.players.map((player) => ({ player, cards: this.getPlayerCards(game, player.id) }));
    switch (effect.kind) {
      case "grantAll":
        for (const { cards } of all) this.resourceManager.award(cards.resources, { ...EMPTY_RESOURCES, ...effect.resources });
        break;
      case "discardAll":
        for (const { cards } of all) this.resourceManager.removeRandom(cards.resources, effect.count, this.random);
        break;
      case "ideologyLeaderVoters": {
        const best = Math.max(...all.map(({ cards }) => cards.ideologyProfile[effect.ideology]));
        if (best > 0) {
          for (const { cards } of all) if (cards.ideologyProfile[effect.ideology] === best) cards.reserveVoters += effect.voters;
        }
        break;
      }
      case "boardLeaderPenalty": {
        const totals = all.map(({ player, cards }) => ({ cards, total: this.boardManager.totalVoters(game.board, player.id) }));
        const best = Math.max(...totals.map((entry) => entry.total));
        if (best > 0) for (const entry of totals) if (entry.total === best) this.resourceManager.removeRandom(entry.cards.resources, effect.count, this.random);
        break;
      }
      case "underdogVoters": {
        const totals = all.map(({ player, cards }) => ({ cards, total: this.boardManager.totalVoters(game.board, player.id) }));
        const lowest = Math.min(...totals.map((entry) => entry.total));
        for (const entry of totals) if (entry.total === lowest) entry.cards.reserveVoters += effect.voters;
        break;
      }
      case "modifier":
        break;
    }
  }

  private modifiers(game: GameState): RoundModifiers {
    if (!game.currentEventId) return {};
    const { effect } = this.cardManager.getEvent(game.currentEventId);
    return effect.kind === "modifier" ? effect.modifiers : {};
  }

  /** Clears effects that last "until your next turn" and applies penalties aimed at this turn. */
  private startTurn(game: GameState) {
    const playerId = game.currentPlayerId;
    const cards = this.getPlayerCards(game, playerId);
    for (const constituency of game.board) {
      if (constituency.protectedByPlayerId === playerId) constituency.protectedByPlayerId = undefined;
      if (constituency.lockedByPlayerId === playerId) constituency.lockedByPlayerId = undefined;
    }
    cards.votersShielded = false;

    const modifiers = this.modifiers(game);
    game.turnState = {
      ...this.freshTurnState(),
      gerrymandersAllowed: this.config.gerrymandersPerTurn + (modifiers.extraGerrymanders ?? 0),
      voterPurchaseBlocked: cards.nextTurn.voterPurchaseBlocked,
      sealedUseBlocked: cards.nextTurn.sealedUseBlocked,
      voterSurcharge: cards.nextTurn.voterSurcharge,
    };
    const skipQuestion = cards.nextTurn.skipQuestion;
    cards.nextTurn = { skipQuestion: false, voterPurchaseBlocked: false, sealedUseBlocked: false, voterSurcharge: 0 };

    if (skipQuestion) {
      game.turnState.decisionMade = true;
      game.phase = "ACTION_PHASE";
      this.log(game, "TURN_SKIPPED", `${this.name(game, playerId)} is suspended and skips this turn's political question.`, playerId);
      return;
    }
    this.drawNextQuestion(game);
  }

  private drawNextQuestion(game: GameState) {
    if (game.currentDecisionCardId) game.discardedDecisionCardIds.push(game.currentDecisionCardId);
    if (game.decisionDeck.length === 0) {
      game.decisionDeck.push(...this.cardManager.shuffle(game.discardedDecisionCardIds.splice(0)));
    }
    game.currentDecisionCardId = this.cardManager.drawDecision(game.decisionDeck);
    game.phase = "POLITICAL_DECISION";
  }

  /** Announces majority changes and ends the game once EVERY constituency has one. */
  private afterBoardChange(before: GameState, game: GameState) {
    if (game.status !== "PLAYING") return;
    for (const constituency of game.board) {
      const previous = before.board.find((candidate) => candidate.id === constituency.id)?.controllingPlayerId;
      if (previous === constituency.controllingPlayerId) continue;
      if (constituency.controllingPlayerId) {
        const holder = constituency.controllingPlayerId;
        this.log(game, "MAJORITY", `${this.name(game, holder)} won a majority in ${constituency.name} (${constituency.voterCounts[holder]} of ${constituency.seats} seats).`, holder);
      } else if (previous) {
        this.log(game, "MAJORITY", `${this.name(game, previous)} lost the majority in ${constituency.name}.`, previous);
      }
    }
    if (this.boardManager.allHaveMajority(game.board)) {
      game.status = "FINISHED";
      game.phase = "ELECTION_RESULTS";
      game.electionResults = this.electionManager.calculate(game.board, game.players);
      const winners = game.electionResults.winnerPlayerIds.map((id) => this.name(game, id)).join(" & ");
      this.log(game, "GAME_FINISHED", `Every constituency has a majority. ${winners} ${game.electionResults.isTie ? "share" : "claims"} the THRONE!`);
    }
  }

  private log(game: GameState, type: GameLogType, message: string, playerId?: string) {
    game.actionLog.push({ id: this.createId(), type, message, timestamp: this.now(), playerId });
    if (game.actionLog.length > 300) game.actionLog.splice(0, game.actionLog.length - 300);
  }

  private describe(resources: Resources) {
    return RESOURCE_TYPES.filter((type) => resources[type] > 0).map((type) => `${resources[type]} ${type}`).join(", ");
  }

  private assertActivePlayer(game: GameState, playerId: string) {
    if (game.status !== "PLAYING") throw new GameEngineError("This election is over.");
    if (game.currentPlayerId !== playerId) throw new GameEngineError("It is not your turn.");
  }

  private assertActionPhase(game: GameState, playerId: string) {
    this.assertActivePlayer(game, playerId);
    if (game.phase !== "ACTION_PHASE" || !game.turnState.decisionMade) {
      throw new GameEngineError("Answer the political question first.");
    }
  }

  private getPlayerCards(game: GameState, playerId: string) {
    const cards = game.playerCards[playerId];
    if (!cards) throw new GameEngineError("This player does not have a card state.");
    return cards;
  }

  private name(game: GameState, playerId: string) {
    return game.players.find((player) => player.id === playerId)?.username ?? "A player";
  }

  private assertValidPlayers(players: GamePlayer[]) {
    if (players.length < this.config.minPlayers || players.length > this.config.maxPlayers) {
      throw new GameEngineError(`Games require ${this.config.minPlayers}–${this.config.maxPlayers} players.`);
    }
    if (new Set(players.map((player) => player.id)).size !== players.length) {
      throw new GameEngineError("Each player in a game must have a unique id.");
    }
  }
}
