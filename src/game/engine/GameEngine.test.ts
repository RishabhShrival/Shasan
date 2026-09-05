import { describe, expect, it } from "vitest";

import { GameEngine, GameEngineError } from "./GameEngine";

const players = [
  { id: "player-a", username: "Asha", isConnected: true },
  { id: "player-b", username: "Bharat", isConnected: true },
];

function createEngine(maxRounds = 2) {
  let id = 0;
  let timestamp = 1_000;

  return new GameEngine(
    { maxRounds },
    {
      createId: () => `id-${++id}`,
      now: () => ++timestamp,
    },
  );
}

function completeTurn(engine: GameEngine, game: ReturnType<GameEngine["createGame"]>, playerId: string) {
  engine.makeDecision(game, playerId, "Yes");
  engine.endTurn(game, playerId);
}

describe("GameEngine", () => {
  it("creates a serializable game with the first player in the decision phase", () => {
    const engine = createEngine();
    const game = engine.createGame({ roomCode: "THRONE", players });

    expect(game).toMatchObject({
      roomCode: "THRONE",
      status: "PLAYING",
      currentPlayerId: "player-a",
      currentRound: 1,
      maxRounds: 2,
      phase: "POLITICAL_DECISION",
    });
    expect(game.actionLog[0].type).toBe("GAME_STARTED");
  });

  it("rejects a player attempting to end someone else's turn", () => {
    const engine = createEngine();
    const game = engine.createGame({ roomCode: "THRONE", players });

    expect(() => engine.endTurn(game, "player-b")).toThrow("It is not your turn.");
    expect(game.currentPlayerId).toBe("player-a");
  });

  it("advances turn order, rounds, and finally enters election results", () => {
    const engine = createEngine(2);
    const game = engine.createGame({ roomCode: "THRONE", players });

    completeTurn(engine, game, "player-a");
    expect(game.currentPlayerId).toBe("player-b");
    expect(game.currentRound).toBe(1);

    completeTurn(engine, game, "player-b");
    expect(game.currentPlayerId).toBe("player-a");
    expect(game.currentRound).toBe(2);

    completeTurn(engine, game, "player-a");
    completeTurn(engine, game, "player-b");
    expect(game.status).toBe("FINISHED");
    expect(game.phase).toBe("ELECTION_RESULTS");
    expect(game.actionLog.at(-1)?.type).toBe("GAME_FINISHED");
    expect(game.electionResults?.standings).toHaveLength(2);
    expect(game.electionResults?.winnerPlayerIds).toHaveLength(2);
  });

  it("does not expose internal state through snapshots", () => {
    const engine = createEngine();
    const game = engine.createGame({ roomCode: "THRONE", players });
    const snapshot = engine.snapshot(game);

    snapshot.players[0].username = "Changed";
    expect(game.players[0].username).toBe("Asha");
  });

  it("exposes the same shared voter market to every player", () => {
    const engine = createEngine();
    const game = engine.createGame({ roomCode: "THRONE", players });
    const asAsha = engine.createView(game, "player-a");
    const asBharat = engine.createView(game, "player-b");

    expect(asAsha.currentDecision?.id).toBe(game.currentDecisionCardId);
    expect(asAsha).not.toHaveProperty("decisionDeck");
    expect(asAsha).not.toHaveProperty("playerCards");
    expect(asAsha.yourCards.voterOffers).toHaveLength(3);
    expect(asBharat.yourCards.voterOffers).toHaveLength(3);
    expect(asAsha.yourCards.voterOffers.map((card) => card.id)).toEqual(game.voterOfferIds);
    expect(asBharat.yourCards.voterOffers.map((card) => card.id)).toEqual(game.voterOfferIds);
  });

  it("requires between two and five unique players", () => {
    const engine = createEngine();

    expect(() => engine.createGame({ roomCode: "THRONE", players: [players[0]] })).toThrow(GameEngineError);
    expect(() => engine.createGame({ roomCode: "THRONE", players: [...players, players[0]] })).toThrow(
      "Each player in a game must have a unique id.",
    );
  });

  it("removes purchased shared offers and lets voters be split between constituencies", () => {
    const engine = createEngine();
    const game = engine.createGame({ roomCode: "THRONE", players });
    const playerCards = game.playerCards["player-a"];
    const voterCardId = game.voterOfferIds[0];
    playerCards.resources = { capitalism: 5, communism: 5, socialism: 5, fascism: 5 };

    engine.makeDecision(game, "player-a", "Yes");
    expect(game.phase).toBe("ACTION_PHASE");
    expect(game.currentDecisionResolution?.playerId).toBe("player-a");

    const voters = engine.createView(game, "player-a").yourCards.voterOffers.find((card) => card.id === voterCardId)?.voters;
    engine.buyVoter(game, "player-a", voterCardId);
    expect(game.phase).toBe("INFLUENCE");
    expect(game.playerCards["player-a"].pendingVoters).toBe(voters);
    expect(game.voterOfferIds).not.toContain(voterCardId);

    engine.placeInfluence(game, "player-a", "aravali", 1);
    if ((voters ?? 0) > 1) {
      expect(game.phase).toBe("INFLUENCE");
      engine.placeInfluence(game, "player-a", "gangetic", (voters ?? 0) - 1);
    }
    expect(game.phase).toBe("ACTION_PHASE");
    expect(game.board.find((area) => area.id === "aravali")?.voterCounts["player-a"]).toBe(1);
  });

  it("allows one voter shift each turn only from a majority-controlled constituency", () => {
    const engine = createEngine();
    const game = engine.createGame({ roomCode: "THRONE", players });
    const source = game.board.find((area) => area.id === "aravali");
    if (!source) throw new Error("Expected Aravali constituency.");
    source.voterCounts["player-a"] = 3;
    source.voterCounts["player-b"] = 2;
    engine.getBoardManager().recalculateControl(source);

    engine.makeDecision(game, "player-a", "Yes");
    engine.shiftMajorityVoter(game, "player-a", "aravali", "gangetic");
    expect(source.voterCounts["player-a"]).toBe(2);
    expect(game.board.find((area) => area.id === "gangetic")?.voterCounts["player-a"]).toBe(1);
    expect(() => engine.shiftMajorityVoter(game, "player-a", "aravali", "gangetic")).toThrow("each turn");
  });
});
