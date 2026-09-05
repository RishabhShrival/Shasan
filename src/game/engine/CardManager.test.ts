import { describe, expect, it } from "vitest";

import { CardManager, CardManagerError } from "./CardManager";

describe("CardManager", () => {
  it("creates a complete shuffled decision deck and draws from it only once", () => {
    const manager = new CardManager(() => 0);
    const deck = manager.createDecisionDeck();

    expect(deck).toHaveLength(20);
    expect(new Set(deck)).toHaveLength(20);
    const cardId = manager.drawDecision(deck);
    expect(manager.getDecision(cardId).title).toBeTruthy();
    expect(deck).toHaveLength(19);
  });

  it("creates three non-duplicated voter offers", () => {
    const manager = new CardManager(() => 0.25);
    const offers = manager.drawVoterOffers();

    expect(offers).toHaveLength(3);
    expect(new Set(offers)).toHaveLength(3);
    const resourceTotals = offers
      .map((id) => Object.values(manager.getVoter(id).cost).reduce((total, value) => total + value, 0))
      .sort();
    expect(resourceTotals).toEqual([2, 3, 5]);
  });

  it("rejects invalid card ids and invalid offer counts", () => {
    const manager = new CardManager();

    expect(() => manager.getDecision("not-a-card")).toThrow(CardManagerError);
    expect(() => manager.drawVoterOffers(0)).toThrow("invalid");
  });

  it("guarantees an affordable offer when one exists in the catalog", () => {
    const manager = new CardManager(() => 0);
    const resources = { capitalism: 0, communism: 0, socialism: 0, fascism: 2 };
    const offers = manager.drawVoterOffersWithAffordable(resources);

    expect(offers.some((id) => manager.getVoter(id).cost.fascism <= 2 && manager.getVoter(id).cost.capitalism === 0 && manager.getVoter(id).cost.communism === 0 && manager.getVoter(id).cost.socialism === 0)).toBe(true);
  });
});
