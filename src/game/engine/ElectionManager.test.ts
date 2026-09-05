import { describe, expect, it } from "vitest";

import type { Constituency, GamePlayer } from "../types";
import { ElectionManager } from "./ElectionManager";

const players: GamePlayer[] = [
  { id: "asha", username: "Asha", isConnected: true },
  { id: "bharat", username: "Bharat", isConnected: true },
  { id: "chandra", username: "Chandra", isConnected: true },
];

const board: Constituency[] = [
  { id: "north", name: "North", region: "North", electoralWeight: 5, adjacentConstituencyIds: [], voterCounts: {}, totalVoters: 0, controllingPlayerId: "asha" },
  { id: "south", name: "South", region: "South", electoralWeight: 3, adjacentConstituencyIds: [], voterCounts: {}, totalVoters: 0, controllingPlayerId: "bharat" },
  { id: "east", name: "East", region: "East", electoralWeight: 4, adjacentConstituencyIds: [], voterCounts: {}, totalVoters: 0, controllingPlayerId: "asha" },
  { id: "west", name: "West", region: "West", electoralWeight: 2, adjacentConstituencyIds: [], voterCounts: {}, totalVoters: 0 },
];

describe("ElectionManager", () => {
  it("scores controlled constituency weights and ranks players", () => {
    const results = new ElectionManager().calculate(board, players);

    expect(results.standings).toEqual([
      { playerId: "asha", constituenciesControlled: 2, weightConstituenciesControlled: 9 },
      { playerId: "bharat", constituenciesControlled: 1, weightConstituenciesControlled: 3 },
      { playerId: "chandra", constituenciesControlled: 0, weightConstituenciesControlled: 0 },
    ]);
    expect(results.winnerPlayerIds).toEqual(["asha"]);
    expect(results.isTie).toBe(false);
  });

  it("recognizes a tied mandate", () => {
    const tiedBoard = board.map((constituency) => ({ ...constituency }));
    tiedBoard[1].controllingPlayerId = "bharat";
    tiedBoard[2].controllingPlayerId = undefined;
    tiedBoard[3].controllingPlayerId = "bharat";

    const results = new ElectionManager().calculate(tiedBoard, players);
    expect(results.winnerPlayerIds).toEqual(["bharat", "asha"]);
    expect(results.isTie).toBe(true);
  });
});
