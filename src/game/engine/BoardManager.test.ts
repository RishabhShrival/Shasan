import { describe, expect, it } from "vitest";

import { BOARD_CONSTITUENCIES } from "../constants/board";
import { BoardManager, BoardManagerError } from "./BoardManager";

describe("BoardManager", () => {
  const manager = new BoardManager(BOARD_CONSTITUENCIES);

  it("uses only odd seat counts between 5 and 20", () => {
    for (const constituency of BOARD_CONSTITUENCIES) {
      expect(constituency.seats % 2).toBe(1);
      expect(constituency.seats).toBeGreaterThanOrEqual(5);
      expect(constituency.seats).toBeLessThanOrEqual(20);
    }
    expect(() => new BoardManager([{ ...BOARD_CONSTITUENCIES[0], seats: 8, adjacentConstituencyIds: [] }])).toThrow(BoardManagerError);
  });

  it("requires more than half of all seats for a majority, not just the most voters", () => {
    const board = manager.createBoard(["a", "b"]);
    const valley = board.find((area) => area.id === "gangapur-valley")!; // 11 seats → majority 6
    expect(valley.majorityThreshold).toBe(6);

    manager.addVoters(board, valley.id, "a", 5);
    manager.addVoters(board, valley.id, "b", 1);
    expect(valley.controllingPlayerId).toBeUndefined(); // most voters, but only 5 of 11

    manager.addVoters(board, valley.id, "a", 1);
    expect(valley.controllingPlayerId).toBe("a"); // 6 of 11
  });

  it("never lets a constituency hold more voters than seats", () => {
    const board = manager.createBoard(["a", "b"]);
    manager.addVoters(board, "meghpur-heights", "a", 5);
    expect(() => manager.addVoters(board, "meghpur-heights", "b", 1)).toThrow("free seat");
  });

  it("only moves voters between adjacent constituencies with free seats", () => {
    const board = manager.createBoard(["a", "b"]);
    manager.addVoters(board, "himvant-hills", "a", 2);
    expect(() => manager.moveVoters(board, "himvant-hills", "kaveri-delta", "a", 1)).toThrow("adjacent");
    manager.moveVoters(board, "himvant-hills", "gangapur-valley", "a", 1);
    expect(board.find((area) => area.id === "gangapur-valley")?.voterCounts.a).toBe(1);
  });

  it("detects a strict lead", () => {
    const board = manager.createBoard(["a", "b"]);
    const hills = board[0];
    manager.addVoters(board, hills.id, "a", 2);
    manager.addVoters(board, hills.id, "b", 2);
    expect(manager.hasLead(hills, "a", false)).toBe(false);
    expect(manager.hasLead(hills, "a", true)).toBe(true);
  });
});
