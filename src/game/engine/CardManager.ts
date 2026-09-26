import { DECISION_CARDS, EVENT_CARDS, IDEOLOGY_ABILITIES, POWER_CARDS, VOTER_CARDS } from "../cards";
import type { DecisionCard, EventCard, PowerCard, ResourceType, SealedCardInstance, VoterCard } from "../types";

export class CardManagerError extends Error {}

export class CardManager {
  private readonly decisions = new Map(DECISION_CARDS.map((card) => [card.id, card]));
  private readonly voters = new Map(VOTER_CARDS.map((card) => [card.id, card]));
  private readonly powers = new Map(POWER_CARDS.map((card) => [card.id, card]));
  private readonly events = new Map(EVENT_CARDS.map((card) => [card.id, card]));

  constructor(private readonly random: () => number = Math.random) {}

  // ── Decisions ──────────────────────────────────────────────────────
  createDecisionDeck() {
    return this.shuffle([...this.decisions.keys()]);
  }

  drawDecision(deck: string[]) {
    const cardId = deck.shift();
    if (!cardId) throw new CardManagerError("The decision deck is empty.");
    return cardId;
  }

  getDecision(cardId: string): DecisionCard {
    return this.getCard(this.decisions, cardId, "decision");
  }

  // ── Voter market ───────────────────────────────────────────────────
  createVoterDeck() {
    return this.shuffle([...this.voters.keys()]);
  }

  /** Draws one voter card, reshuffling the discard pile into the deck when needed. */
  drawVoter(deck: string[], discard: string[]) {
    if (deck.length === 0 && discard.length > 0) {
      deck.push(...this.shuffle(discard.splice(0)));
    }
    const cardId = deck.shift();
    if (!cardId) throw new CardManagerError("The voter deck is empty.");
    return cardId;
  }

  getVoter(cardId: string): VoterCard {
    return this.getCard(this.voters, cardId, "voter");
  }

  // ── Sealed cards ───────────────────────────────────────────────────
  createSealedDeck(copies: number): SealedCardInstance[] {
    const instances: SealedCardInstance[] = [];
    for (const power of this.powers.values()) {
      for (let copy = 1; copy <= copies; copy += 1) {
        instances.push({ instanceId: `${power.id}#${copy}`, powerId: power.id });
      }
    }
    return this.shuffle(instances);
  }

  drawSealed(deck: SealedCardInstance[], discard: SealedCardInstance[]) {
    if (deck.length === 0 && discard.length > 0) {
      deck.push(...this.shuffle(discard.splice(0)));
    }
    return deck.shift();
  }

  getPower(powerId: string): PowerCard {
    return this.getCard(this.powers, powerId, "sealed");
  }

  getAbility(ideology: ResourceType): PowerCard {
    return structuredClone(IDEOLOGY_ABILITIES[ideology]);
  }

  // ── Events ─────────────────────────────────────────────────────────
  createEventDeck() {
    return this.shuffle([...this.events.keys()]);
  }

  drawEvent(deck: string[]) {
    if (deck.length === 0) deck.push(...this.createEventDeck());
    const cardId = deck.shift();
    if (!cardId) throw new CardManagerError("The event deck is empty.");
    return cardId;
  }

  getEvent(cardId: string): EventCard {
    return this.getCard(this.events, cardId, "event");
  }

  shuffle<T>(items: T[]) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  private getCard<T>(cards: Map<string, T>, cardId: string, category: string) {
    const card = cards.get(cardId);
    if (!card) throw new CardManagerError(`Unknown ${category} card.`);
    return structuredClone(card);
  }
}
