import { describe, expect, it } from "vitest";

import { BOARD_CONSTITUENCIES } from "../constants/board";
import { BoardManager } from "./BoardManager";
import { ElectionManager } from "./ElectionManager";

describe("ElectionManager", () => {
  it("ranks by seats won, then total voters", () => {
    const boardManager = new BoardManager(BOARD_CONSTITUENCIES);
    const board = boardManager.createBoard(["a", "b"]);
    boardManager.addVoters(board, "madhyanagar", "a", 8); // 15 seats
    boardManager.addVoters(board, "gangapur-valley", "b", 6); // 11 seats
    boardManager.addVoters(board, "himvant-hills", "b", 4); // 7 seats
    const results = new ElectionManager().calculate(board, [
      { id: "a", username: "A", isConnected: true },
      { id: "b", username: "B", isConnected: true },
    ]);
    expect(results.winnerPlayerIds).toEqual(["b"]);
    expect(results.standings[0]).toMatchObject({ playerId: "b", seatsWon: 18, constituenciesControlled: 2, totalVoters: 10 });
  });
});
