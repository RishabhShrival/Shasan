import { describe, expect, it } from "vitest";

import { BOARD_CONSTITUENCIES } from "../constants/board";
import { BoardManager, BoardManagerError } from "./BoardManager";

describe("BoardManager", () => {
  const manager = new BoardManager(BOARD_CONSTITUENCIES);

  it("creates serializable constituencies for every player without initial control", () => {
    const board = manager.createBoard(["asha", "bharat"]);

    expect(board).toHaveLength(9);
    expect(board[0]).toMatchObject({
      id: "aravali",
      totalVoters: 0,
      voterCounts: { asha: 0, bharat: 0 },
      controllingPlayerId: undefined,
    });
  });

  it("awards control only to an absolute majority and removes it on a tie", () => {
    const board = manager.createBoard(["asha", "bharat"]);

    manager.addVoters(board, "gangetic", "asha", 3);
    expect(board.find((area) => area.id === "gangetic")?.controllingPlayerId).toBe("asha");

    manager.addVoters(board, "gangetic", "bharat", 3);
    const contested = board.find((area) => area.id === "gangetic");
    expect(contested?.controllingPlayerId).toBeUndefined();
    expect(contested?.totalVoters).toBe(6);

    manager.addVoters(board, "gangetic", "asha", 2);
    expect(contested?.controllingPlayerId).toBe("asha");
  });

  it("requires more than half of all voters for control", () => {
    const board = manager.createBoard(["asha", "bharat", "charu"]);

    manager.addVoters(board, "gangetic", "asha", 2);
    manager.addVoters(board, "gangetic", "bharat", 2);
    manager.addVoters(board, "gangetic", "charu", 1);
    expect(board.find((area) => area.id === "gangetic")?.controllingPlayerId).toBeUndefined();

    manager.addVoters(board, "gangetic", "asha", 2);
    expect(board.find((area) => area.id === "gangetic")?.controllingPlayerId).toBe("asha");
  });

  it("transfers one voter only between adjacent constituencies and recalculates control", () => {
    const board = manager.createBoard(["asha", "bharat"]);
    manager.addVoters(board, "aravali", "asha", 1);

    manager.transferVoter(board, "aravali", "gangetic", "asha");
    expect(board.find((area) => area.id === "aravali")?.totalVoters).toBe(0);
    expect(board.find((area) => area.id === "gangetic")?.controllingPlayerId).toBe("asha");

    expect(() => manager.transferVoter(board, "gangetic", "delta", "asha")).toThrow(BoardManagerError);
  });

  it("rejects invalid voter changes", () => {
    const board = manager.createBoard(["asha", "bharat"]);

    expect(() => manager.addVoters(board, "aravali", "asha", 0)).toThrow("positive whole number");
    expect(() => manager.addVoters(board, "aravali", "unknown", 1)).toThrow("not eligible");
  });
});
