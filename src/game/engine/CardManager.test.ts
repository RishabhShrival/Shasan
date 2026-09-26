import { describe, expect, it } from "vitest";

import { POWER_CARDS } from "../cards";
import { CardManager, CardManagerError } from "./CardManager";

describe("CardManager", () => {
  const manager = new CardManager(() => 0.42);

  it("builds a sealed deck with the configured copies of every power", () => {
    const deck = manager.createSealedDeck(2);
    expect(deck).toHaveLength(POWER_CARDS.length * 2);
    expect(new Set(deck.map((card) => card.instanceId)).size).toBe(deck.length);
  });

  it("reshuffles the voter discard pile when the deck runs out", () => {
    const deck: string[] = [];
    const discard = ["chai-stall-chat", "rti-volunteers"];
    const drawn = manager.drawVoter(deck, discard);
    expect(["chai-stall-chat", "rti-volunteers"]).toContain(drawn);
    expect(discard).toHaveLength(0);
  });

  it("rejects unknown cards", () => {
    expect(() => manager.getVoter("missing")).toThrow(CardManagerError);
  });
});
