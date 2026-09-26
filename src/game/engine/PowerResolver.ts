import { EMPTY_RESOURCES, RESOURCE_TYPES, isResourceType, type Constituency, type GameState, type PlayerCardState, type PowerParams, type ResourceType, type Resources } from "../types";
import type { CardManager } from "./CardManager";
import type { BoardManager } from "./BoardManager";
import type { ResourceManager } from "./ResourceManager";

export class PowerError extends Error {}

export interface PowerContext {
  game: GameState;
  actorId: string;
  params: PowerParams;
}

export interface PowerOutcome {
  /** Public, human-readable summary for the campaign log. */
  summary: string;
  /** Constituencies touched — used to announce new majorities. */
  touched: string[];
}

/**
 * Resolves the effect of every sealed card and ideology ability.
 * All inputs are validated here; the client is never trusted.
 */
export class PowerResolver {
  constructor(
    private readonly board: BoardManager,
    private readonly resources: ResourceManager,
    private readonly cards: CardManager,
    private readonly random: () => number,
  ) {}

  resolve(powerId: string, context: PowerContext): PowerOutcome {
    const { game, actorId, params } = context;
    const actor = this.cardsOf(game, actorId);

    switch (powerId) {
      // ── Resource powers ───────────────────────────────────────────────
      case "party-fund": {
        const pick = this.resources.parseSelection(params.resources, { exactly: 3 });
        const awarded = this.resources.award(actor.resources, pick);
        return this.outcome(`gained ${this.describe(awarded)}`);
      }
      case "tax-raid": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const capacity = this.resources.capacity(actor.resources);
        const taken = this.resources.removeRandom(this.cardsOf(game, target).resources, Math.min(3, capacity), this.random);
        this.resources.award(actor.resources, taken);
        return this.outcome(`snatched ${this.resources.getTotal(taken)} resource(s) from ${this.name(game, target)}`);
      }
      case "coalition-gift": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const gift = this.resources.parseSelection(params.resources, { min: 1, max: 3 });
        this.resources.spend(actor.resources, gift);
        const received = this.resources.award(this.cardsOf(game, target).resources, gift);
        const given = this.resources.getTotal(gift);
        actor.reserveVoters += given;
        return this.outcome(`donated ${this.resources.getTotal(received)} resource(s) to ${this.name(game, target)} and gained ${given} reserve voter(s)`);
      }
      case "policy-u-turn": {
        const from = this.ideology(params.resourceType, "Choose the ideology to convert from.");
        const to = this.ideology(params.secondResourceType, "Choose the ideology to convert to.");
        if (from === to) throw new PowerError("Choose two different ideologies.");
        const amount = actor.resources[from];
        if (amount < 1) throw new PowerError(`You have no ${from} resources to convert.`);
        actor.resources[from] = 0;
        actor.resources[to] += amount;
        return this.outcome(`converted ${amount} ${from} into ${to}`);
      }
      case "income-tax-notice": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const removed = this.resources.removeRandom(this.cardsOf(game, target).resources, 3, this.random);
        return this.outcome(`forced ${this.name(game, target)} to discard ${this.resources.getTotal(removed)} resource(s)`);
      }
      case "electoral-bonds": {
        const type = this.ideology(params.resourceType, "Choose an ideology.");
        const majorities = game.board.filter((constituency) => constituency.controllingPlayerId === actorId).length;
        const awarded = this.resources.award(actor.resources, { ...EMPTY_RESOURCES, [type]: Math.min(majorities * 2, 6) });
        return this.outcome(`cashed Electoral Bonds for ${this.describe(awarded) || "nothing"}`);
      }
      case "clean-image": {
        const discard = this.resources.parseSelection(params.resources, { exactly: 2 });
        const type = this.ideology(params.resourceType, "Choose the ideology to gain.");
        this.resources.spend(actor.resources, discard);
        const awarded = this.resources.award(actor.resources, { ...EMPTY_RESOURCES, [type]: 3 });
        return this.outcome(`discarded 2 resources and gained ${this.describe(awarded)}`);
      }
      case "nationwide-audit": {
        for (const player of game.players) {
          if (player.id !== actorId) this.resources.removeRandom(this.cardsOf(game, player.id).resources, 1, this.random);
        }
        return this.outcome("made every rival discard 1 random resource");
      }

      // ── Board powers ──────────────────────────────────────────────────
      case "mega-rally": {
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        this.board.addVoters(game.board, constituency.id, actorId, 2);
        return this.outcome(`added 2 voters in ${constituency.name}`, [constituency.id]);
      }
      case "volunteer-army":
      case "ability-idealism": {
        actor.reserveVoters += 3;
        return this.outcome("gained 3 reserve voters");
      }
      case "defection": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        this.assertCanAffect(game, actorId, constituency, target);
        this.board.convertVoters(game.board, constituency.id, target, actorId, 1);
        return this.outcome(`turned 1 of ${this.name(game, target)}'s voters in ${constituency.name}`, [constituency.id]);
      }
      case "ability-capitalism": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        this.assertCanAffect(game, actorId, constituency, target);
        const amount = this.board.convertVoters(game.board, constituency.id, target, actorId, 2);
        return this.outcome(`converted ${amount} of ${this.name(game, target)}'s voters in ${constituency.name}`, [constituency.id]);
      }
      case "recount":
      case "ability-supremacy": {
        const limit = powerId === "recount" ? 2 : 3;
        const target = this.rival(game, actorId, params.targetPlayerId);
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        if (constituency.controllingPlayerId) throw new PowerError(`${constituency.name} already has a majority. Choose a constituency without one.`);
        this.assertCanAffect(game, actorId, constituency, target);
        const removed = this.board.removeVoters(game.board, constituency.id, target, limit);
        return this.outcome(`removed ${removed} of ${this.name(game, target)}'s voters from ${constituency.name}`, [constituency.id]);
      }
      case "transfer-order": {
        const from = this.board.getConstituency(game.board, params.constituencyId);
        const to = this.board.getConstituency(game.board, params.destinationId);
        const count = Math.min(2, from.voterCounts[actorId] ?? 0, this.board.freeSeats(to));
        if (count < 1) throw new PowerError("You need a voter in the first constituency and a free seat in the second.");
        this.board.moveVoters(game.board, from.id, to.id, actorId, count, true);
        return this.outcome(`moved ${count} voter(s) from ${from.name} to ${to.name}`, [from.id, to.id]);
      }
      case "migrant-wave": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const from = this.board.getConstituency(game.board, params.constituencyId);
        const to = this.board.getConstituency(game.board, params.destinationId);
        this.assertCanAffect(game, actorId, from, target);
        this.board.moveVoters(game.board, from.id, to.id, target, 1);
        return this.outcome(`moved 1 of ${this.name(game, target)}'s voters from ${from.name} to ${to.name}`, [from.id, to.id]);
      }
      case "security-cover": {
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        constituency.protectedByPlayerId = actorId;
        return this.outcome(`put ${constituency.name} under Security Cover`);
      }
      case "ability-conservatism": {
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        this.board.addVoters(game.board, constituency.id, actorId, 2);
        constituency.protectedByPlayerId = actorId;
        return this.outcome(`added 2 voters in ${constituency.name} and protected it`, [constituency.id]);
      }
      case "loyal-cadre": {
        actor.votersShielded = true;
        return this.outcome("shielded all of their voters until their next turn");
      }
      case "section-144": {
        const constituency = this.board.getConstituency(game.board, params.constituencyId);
        constituency.lockedByPlayerId = actorId;
        return this.outcome(`imposed Section 144 on ${constituency.name}`);
      }

      // ── Strategic powers ──────────────────────────────────────────────
      case "model-code": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        this.cardsOf(game, target).nextTurn.voterPurchaseBlocked = true;
        return this.outcome(`blocked ${this.name(game, target)} from buying voter cards next turn`);
      }
      case "show-cause": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        this.cardsOf(game, target).nextTurn.sealedUseBlocked = true;
        return this.outcome(`blocked ${this.name(game, target)} from playing sealed cards next turn`);
      }
      case "suspension": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        this.cardsOf(game, target).nextTurn.skipQuestion = true;
        return this.outcome(`suspended ${this.name(game, target)} from their next political question`);
      }
      case "price-rise": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        this.cardsOf(game, target).nextTurn.voterSurcharge += 1;
        return this.outcome(`raised ${this.name(game, target)}'s voter card prices for their next turn`);
      }
      case "campaign-subsidy": {
        game.turnState.voterDiscount += 2;
        return this.outcome("got a subsidy on their next voter card");
      }
      case "double-agenda": {
        game.turnState.extraQuestions += 1;
        return this.outcome("will answer an extra political question");
      }
      case "delimitation": {
        game.turnState.gerrymandersAllowed += 1;
        return this.outcome("gained an extra gerrymander this turn");
      }
      case "opinion-poll": {
        const target = this.rival(game, actorId, params.targetPlayerId);
        const targetCards = this.cardsOf(game, target);
        actor.intel = {
          targetPlayerId: target,
          round: game.currentRound,
          resources: { ...targetCards.resources },
          sealedCardNames: targetCards.sealedCards.map((card) => this.cards.getPower(card.powerId).name),
        };
        return this.outcome(`ran a secret opinion poll on ${this.name(game, target)}`);
      }
      default:
        throw new PowerError("This card cannot be played.");
    }
  }

  /** Rivals cannot touch voters in a protected constituency or voters shielded by Loyal Cadre. */
  assertCanAffect(game: GameState, actorId: string, constituency: Constituency, ownerId: string) {
    if (ownerId === actorId) return;
    if (constituency.protectedByPlayerId && constituency.protectedByPlayerId !== actorId) {
      throw new PowerError(`${constituency.name} is under Security Cover.`);
    }
    if (this.cardsOf(game, ownerId).votersShielded) {
      throw new PowerError(`${this.name(game, ownerId)}'s voters are shielded by Loyal Cadre.`);
    }
  }

  private rival(game: GameState, actorId: string, targetPlayerId: unknown) {
    if (typeof targetPlayerId !== "string" || targetPlayerId === actorId || !game.players.some((player) => player.id === targetPlayerId)) {
      throw new PowerError("Choose a rival player for this card.");
    }
    return targetPlayerId;
  }

  private ideology(value: unknown, message: string): ResourceType {
    if (!isResourceType(value)) throw new PowerError(message);
    return value;
  }

  private cardsOf(game: GameState, playerId: string): PlayerCardState {
    const cards = game.playerCards[playerId];
    if (!cards) throw new PowerError("Unknown player.");
    return cards;
  }

  private name(game: GameState, playerId: string) {
    return game.players.find((player) => player.id === playerId)?.username ?? "a player";
  }

  private describe(resources: Resources) {
    return RESOURCE_TYPES.filter((type) => resources[type] > 0).map((type) => `${resources[type]} ${type}`).join(", ");
  }

  private outcome(summary: string, touched: string[] = []): PowerOutcome {
    return { summary, touched };
  }
}
