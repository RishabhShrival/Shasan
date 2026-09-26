import { describe, expect, it } from "vitest";

import { POWER_CARDS } from "../cards";
import { EMPTY_RESOURCES, type GameState, type Resources } from "../types";
import { GameEngine } from "./GameEngine";

const players = [
  { id: "a", username: "Rishabh", isConnected: true },
  { id: "b", username: "Aditya", isConnected: true },
  { id: "c", username: "Avisha", isConnected: true },
];

function seeded(seed = 7) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function setup() {
  let id = 0;
  let time = 1_000;
  const engine = new GameEngine({}, { createId: () => `id-${++id}`, now: () => ++time, random: seeded() });
  const game = engine.createGame({ roomCode: "THRONE", players });
  return { engine, game };
}

function give(game: GameState, playerId: string, resources: Partial<Resources>) {
  game.playerCards[playerId].resources = { ...EMPTY_RESOURCES, ...resources };
}

function place(game: GameState, constituencyId: string, counts: Record<string, number>) {
  const area = game.board.find((candidate) => candidate.id === constituencyId)!;
  for (const [playerId, count] of Object.entries(counts)) area.voterCounts[playerId] = count;
  area.totalVoters = Object.values(area.voterCounts).reduce((sum, count) => sum + count, 0);
  const holder = Object.entries(area.voterCounts).find(([, count]) => count > area.seats / 2);
  area.controllingPlayerId = holder?.[0];
}

describe("GameEngine", () => {
  it("starts in the political decision phase with 3 voter cards and 3 sealed cards on the market", () => {
    const { game } = setup();
    expect(game.phase).toBe("POLITICAL_DECISION");
    expect(game.voterMarket).toHaveLength(3);
    expect(game.sealedMarket).toHaveLength(3);
    expect(game.currentDecisionCardId).toBeDefined();
  });

  it("starts players with 1 of each ideology and awards 4 more for an answer", () => {
    const { engine, game } = setup();
    expect(game.playerCards.a.resources).toEqual({ capitalism: 1, idealism: 1, conservatism: 1, supremacy: 1 });
    engine.makeDecision(game, "a", "Yes");
    const total = Object.values(game.playerCards.a.resources).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(8);
    expect(game.phase).toBe("ACTION_PHASE");
  });

  it("lets a player buy several voter cards in one turn and refills the same slot immediately", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    give(game, "a", { capitalism: 6, idealism: 6 });
    // Make every market card affordable.
    game.voterMarket = ["chai-stall-chat", "rti-volunteers", "startup-meetup"];
    game.voterDeck = game.voterDeck.filter((id) => !game.voterMarket.includes(id));

    engine.buyVoter(game, "a", "rti-volunteers");
    expect(game.voterMarket).toHaveLength(3);
    expect(game.voterMarket[0]).toBe("chai-stall-chat");
    expect(game.voterMarket[1]).not.toBe("rti-volunteers");
    expect(game.voterMarket[2]).toBe("startup-meetup");
    expect(game.playerCards.a.votersToPlace).toBe(1);

    // Bought voters must be placed before buying again or ending the turn.
    expect(() => engine.buyVoter(game, "a", "chai-stall-chat")).toThrow("Place your 1 new voter");
    expect(() => engine.endTurn(game, "a")).toThrow("before ending your turn");
    engine.placeVoters(game, "a", "madhyanagar", 1);

    engine.buyVoter(game, "a", "chai-stall-chat");
    engine.placeVoters(game, "a", "madhyanagar", 1);
    engine.buyVoter(game, "a", "startup-meetup");
    engine.placeVoters(game, "a", "gangapur-valley", 2);
    expect(game.board.find((area) => area.id === "madhyanagar")?.voterCounts.a).toBe(2);
    expect(game.playerCards.a.votersToPlace).toBe(0);
    expect(game.playerCards.a.reserveVoters).toBe(0);
    expect(game.currentPlayerId).toBe("a");
  });

  it("sells sealed cards for ANY 4 owned resources and validates the payment", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    give(game, "a", { capitalism: 1, supremacy: 3, idealism: 2 });
    const slot = game.sealedMarket[1];

    expect(() => engine.buySealedCard(game, "a", slot.instanceId, { supremacy: 3 })).toThrow("exactly 4");
    expect(() => engine.buySealedCard(game, "a", slot.instanceId, { capitalism: 4 })).toThrow("do not own");
    expect(() => engine.buySealedCard(game, "a", slot.instanceId, { socialism: 4 })).toThrow("Unknown resource");

    engine.buySealedCard(game, "a", slot.instanceId, { capitalism: 1, supremacy: 3 });
    expect(game.playerCards.a.resources).toEqual({ ...EMPTY_RESOURCES, idealism: 2 });
    expect(game.playerCards.a.sealedCards.map((card) => card.instanceId)).toContain(slot.instanceId);
    expect(game.sealedMarket).toHaveLength(3);
    expect(game.sealedMarket[1].instanceId).not.toBe(slot.instanceId);

    // Players may hold several sealed cards.
    give(game, "a", { idealism: 8 });
    engine.buySealedCard(game, "a", game.sealedMarket[0].instanceId, { idealism: 4 });
    engine.buySealedCard(game, "a", game.sealedMarket[2].instanceId, { idealism: 4 });
    expect(game.playerCards.a.sealedCards).toHaveLength(3);
  });

  it("lets a player refresh the voter market once per turn for 1 resource", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    give(game, "a", { capitalism: 2 });
    const before = [...game.voterMarket];
    engine.refreshVoterMarket(game, "a", { capitalism: 1 });
    expect(game.playerCards.a.resources.capitalism).toBe(1);
    expect(game.voterMarket).toHaveLength(3);
    expect(game.voterMarket.some((id) => before.includes(id))).toBe(false);
    expect(() => engine.refreshVoterMarket(game, "a", { capitalism: 1 })).toThrow("already refreshed");
  });

  it("never reveals what an answer pays before it is chosen", () => {
    const { engine, game } = setup();
    const view = engine.createView(game, "a");
    expect(view.currentDecision).toBeDefined();
    expect(Object.keys(view.currentDecision!).sort()).toEqual(["id", "question", "topic"]);
    expect(JSON.stringify(view)).not.toContain("dominantResource");
  });

  it("sends evicted voters to the owner's reserve so they can place them on their turn", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    place(game, "madhyanagar", { a: 3, b: 4 });
    game.playerCards.a.sealedCards.push({ instanceId: "recount#9", powerId: "recount" });
    engine.useSealedCard(game, "a", "recount#9", { targetPlayerId: "b", constituencyId: "madhyanagar" });
    expect(game.board.find((area) => area.id === "madhyanagar")?.voterCounts.b).toBe(2);
    expect(game.playerCards.b.reserveVoters).toBe(2);
    engine.endTurn(game, "a");

    engine.makeDecision(game, "b", "No");
    game.playerCards.b.votersToPlace = 0; // ignore any round-event voters for this test
    engine.placeVoters(game, "b", "himvant-hills", 2);
    expect(game.playerCards.b.reserveVoters).toBe(0);
    expect(game.board.find((area) => area.id === "himvant-hills")?.voterCounts.b).toBe(2);
  });

  it("does not force evicted voters back onto the board", () => {
    const { engine, game } = setup();
    game.playerCards.a.reserveVoters = 2;
    engine.makeDecision(game, "a", "Yes");
    expect(() => engine.endTurn(game, "a")).not.toThrow();
    expect(game.playerCards.a.reserveVoters).toBe(2);
  });

  it("hides rivals' resources and sealed cards from the player view", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    give(game, "a", { idealism: 4 });
    engine.buySealedCard(game, "a", game.sealedMarket[0].instanceId, { idealism: 4 });
    const view = engine.createView(game, "b");
    const json = JSON.stringify(view);
    expect(json).not.toContain("decisionDeck");
    expect(view.yourCards.sealedCards).toHaveLength(0);
    expect(view.playerStats.find((stats) => stats.playerId === "a")?.sealedCardCount).toBe(1);
    expect(view.sealedMarket[0]).not.toHaveProperty("powerId");
  });

  it("allows gerrymandering only where the player has the most voters, to an adjacent constituency, once per turn", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    place(game, "himvant-hills", { a: 3, b: 2, c: 1 });
    place(game, "marudhar-plains", { a: 1, b: 4 });

    expect(() => engine.gerrymander(game, "a", "marudhar-plains", "himvant-hills", "b")).toThrow("highest number of voters");
    expect(() => engine.gerrymander(game, "a", "himvant-hills", "kaveri-delta", "b")).toThrow("adjacent");

    engine.gerrymander(game, "a", "himvant-hills", "gangapur-valley", "b");
    expect(game.board.find((area) => area.id === "himvant-hills")?.voterCounts.b).toBe(1);
    expect(game.board.find((area) => area.id === "gangapur-valley")?.voterCounts.b).toBe(1);

    expect(() => engine.gerrymander(game, "a", "himvant-hills", "gangapur-valley", "c")).toThrow("already gerrymandered");
  });

  it("does not change anything when an action is rejected", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    const before = JSON.stringify(game);
    expect(() => engine.placeVoters(game, "a", "himvant-hills", 3)).toThrow();
    expect(JSON.stringify(game)).toBe(before);
  });

  it("ends the game only when EVERY constituency has a majority", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    const [last, ...rest] = game.board;
    for (const area of rest) place(game, area.id, { b: Math.floor(area.seats / 2) + 1 });
    place(game, last.id, { a: 3 }); // 3 of 7 — not yet a majority
    game.playerCards.a.reserveVoters = 1;
    expect(game.status).toBe("PLAYING");

    engine.placeVoters(game, "a", last.id, 1); // 4 of 7
    expect(game.status).toBe("FINISHED");
    expect(game.phase).toBe("ELECTION_RESULTS");
    expect(game.electionResults?.winnerPlayerIds).toEqual(["b"]);
  });

  it("re-polls a full constituency with no majority at the end of the turn", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    place(game, "madhyanagar", { a: 7, b: 7, c: 1 }); // 15 of 15, no majority
    engine.endTurn(game, "a");
    const area = game.board.find((candidate) => candidate.id === "madhyanagar")!;
    expect(area.voterCounts).toEqual({ a: 7, b: 7, c: 0 });
    expect(game.playerCards.c.reserveVoters).toBe(1);
    expect(area.totalVoters).toBe(14);
  });

  it("has no fixed number of rounds", () => {
    const { engine, game } = setup();
    for (let turn = 0; turn < 60; turn += 1) {
      const playerId = game.currentPlayerId;
      engine.makeDecision(game, playerId, turn % 2 ? "Yes" : "No");
      while (game.playerCards[playerId].votersToPlace > 0) {
        const open = game.board.find((area) => area.totalVoters < area.seats && !area.lockedByPlayerId)!;
        engine.placeVoters(game, playerId, open.id, 1);
      }
      engine.endTurn(game, playerId);
    }
    expect(game.status).toBe("PLAYING");
    expect(game.currentRound).toBe(21);
    expect(game.currentEventId).toBeDefined();
  });

  it("cancels a sealed card aimed at a player holding a Stay Order", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    give(game, "b", { capitalism: 5 });
    game.playerCards.a.sealedCards.push({ instanceId: "tax-raid#9", powerId: "tax-raid" });
    game.playerCards.b.sealedCards.push({ instanceId: "stay-order#9", powerId: "stay-order" });
    engine.useSealedCard(game, "a", "tax-raid#9", { targetPlayerId: "b" });
    expect(game.playerCards.b.resources.capitalism).toBe(5);
    expect(game.playerCards.b.sealedCards).toHaveLength(0);
    expect(game.actionLog.at(-1)?.type).toBe("POWER_BLOCKED");
  });

  it("resolves every sealed power with valid inputs", () => {
    for (const power of POWER_CARDS.filter((card) => !card.passive)) {
      const { engine, game } = setup();
      engine.makeDecision(game, "a", "Yes");
      give(game, "a", { capitalism: 3, idealism: 3, conservatism: 1, supremacy: 1 });
      give(game, "b", { capitalism: 3, idealism: 3 });
      place(game, "madhyanagar", { a: 3, b: 3 });
      place(game, "gangapur-valley", { a: 6 });
      const instanceId = `${power.id}#test`;
      game.playerCards.a.sealedCards.push({ instanceId, powerId: power.id });
      const params = {
        targetPlayerId: "b",
        constituencyId: "madhyanagar",
        destinationId: "dakshin-plateau",
        resources: power.id === "clean-image" ? { capitalism: 2 } : power.id === "coalition-gift" ? { capitalism: 1 } : { idealism: 3 },
        resourceType: "capitalism" as const,
        secondResourceType: "supremacy" as const,
      };
      expect(() => engine.useSealedCard(game, "a", instanceId, params), power.id).not.toThrow();
      expect(game.playerCards.a.sealedCards.some((card) => card.instanceId === instanceId)).toBe(false);
    }
  });

  it("respects Security Cover and Section 144", () => {
    const { engine, game } = setup();
    engine.makeDecision(game, "a", "Yes");
    place(game, "madhyanagar", { a: 2, b: 4 });
    game.playerCards.a.sealedCards.push({ instanceId: "security-cover#9", powerId: "security-cover" }, { instanceId: "section-144#9", powerId: "section-144" });
    engine.useSealedCard(game, "a", "security-cover#9", { constituencyId: "madhyanagar" });
    engine.useSealedCard(game, "a", "section-144#9", { constituencyId: "himvant-hills" });
    engine.endTurn(game, "a");

    engine.makeDecision(game, "b", "Yes");
    game.playerCards.b.reserveVoters = 2;
    expect(() => engine.placeVoters(game, "b", "himvant-hills", 1)).toThrow("Section 144");
    expect(() => engine.gerrymander(game, "b", "madhyanagar", "gangapur-valley", "a")).toThrow("Security Cover");
  });
});
