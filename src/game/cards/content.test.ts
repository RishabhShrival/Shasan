import { describe, expect, it } from "vitest";

import { DECISION_CARDS, EVENT_CARDS, POWER_CARDS, VOTER_CARDS, totalRewards } from ".";

describe("THRONE content", () => {
  it("has about 100 political questions, each answer worth exactly 4 resources", () => {
    expect(DECISION_CARDS.length).toBeGreaterThanOrEqual(100);
    for (const card of DECISION_CARDS) {
      expect(totalRewards(card.yes.rewards)).toBe(4);
      expect(totalRewards(card.no.rewards)).toBe(4);
      expect(card.yes.dominantResource).not.toBe(card.no.dominantResource);
    }
    expect(new Set(DECISION_CARDS.map((card) => card.question)).size).toBe(DECISION_CARDS.length);
  });

  it("uses no socialism or communism anywhere", () => {
    const text = JSON.stringify([DECISION_CARDS, VOTER_CARDS, POWER_CARDS, EVENT_CARDS]).toLowerCase();
    expect(text).not.toContain("socialism");
    expect(text).not.toContain("communism");
  });

  it("has 20+ distinct sealed powers with clear descriptions", () => {
    expect(POWER_CARDS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(POWER_CARDS.map((card) => card.name)).size).toBe(POWER_CARDS.length);
    expect(new Set(POWER_CARDS.map((card) => card.description)).size).toBe(POWER_CARDS.length);
    for (const category of ["resource", "board", "strategic"]) {
      expect(POWER_CARDS.filter((card) => card.category === category).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("prices voter cards consistently", () => {
    const price: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 7 };
    for (const card of VOTER_CARDS) expect(totalRewards(card.cost)).toBe(price[card.voters]);
    expect(VOTER_CARDS.length).toBeGreaterThanOrEqual(12);
  });

  it("has multiple event cards", () => {
    expect(EVENT_CARDS.length).toBeGreaterThanOrEqual(10);
  });
});
