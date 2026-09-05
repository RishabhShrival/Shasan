import { DECISION_CARDS, POWER_CARDS, VOTER_CARDS } from "../cards";
import type { DecisionCard, PowerCard, Resources, VoterCard } from "../types";

export class CardManagerError extends Error {}

export class CardManager {
  private readonly decisions = new Map(DECISION_CARDS.map((card) => [card.id, card]));
  private readonly voters = new Map(VOTER_CARDS.map((card) => [card.id, card]));
  private readonly powers = new Map(POWER_CARDS.map((card) => [card.id, card]));

  constructor(private readonly random: () => number = Math.random) {}

  createDecisionDeck() {
    return this.shuffle([...this.decisions.keys()]);
  }

  drawDecision(deck: string[]) {
    const cardId = deck.shift();
    if (!cardId) {
      throw new CardManagerError("The decision deck is empty.");
    }
    return cardId;
  }

  drawVoterOffers(count = 3) {
    if (!Number.isInteger(count) || count < 1 || count > this.voters.size) {
      throw new CardManagerError("The requested voter offer count is invalid.");
    }
    return this.shuffle([...this.voters.keys()]).slice(0, count);
  }

  drawVoterOffersWithAffordable(resources: Resources, count = 3) {
    const offerIds = this.drawVoterOffers(count);
    if (offerIds.some((cardId) => this.canAfford(resources, this.getVoter(cardId).cost))) {
      return offerIds;
    }

    const affordableCardIds = [...this.voters.values()]
      .filter((card) => this.canAfford(resources, card.cost))
      .map((card) => card.id);
    if (affordableCardIds.length === 0) {
      return offerIds;
    }

    const guaranteedCardId = this.shuffle(affordableCardIds)[0];
    const remainingCardIds = this.shuffle([...this.voters.keys()].filter((cardId) => cardId !== guaranteedCardId));
    return this.shuffle([guaranteedCardId, ...remainingCardIds.slice(0, count - 1)]);
  }

  getDecision(cardId: string): DecisionCard {
    return this.getCard(this.decisions, cardId, "decision");
  }

  getVoter(cardId: string): VoterCard {
    return this.getCard(this.voters, cardId, "voter");
  }

  getPower(cardId: string): PowerCard {
    return this.getCard(this.powers, cardId, "power");
  }

  drawPowerOffer() {
    return this.shuffle([...this.powers.keys()])[0];
  }

  private shuffle<T>(items: T[]) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  private getCard<T>(cards: Map<string, T>, cardId: string, category: string) {
    const card = cards.get(cardId);
    if (!card) {
      throw new CardManagerError(`Unknown ${category} card.`);
    }
    return structuredClone(card);
  }

  private canAfford(resources: Resources, cost: Resources) {
    return Object.entries(cost).every(([resourceType, costAmount]) => resources[resourceType as keyof Resources] >= costAmount);
  }
}
