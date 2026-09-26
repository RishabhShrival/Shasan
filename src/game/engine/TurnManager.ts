import type { GameState } from "../types/game";

export class TurnManagerError extends Error {}

/** Handles turn order only. Turn-start effects live in the GameEngine. */
export class TurnManager {
  /** Moves to the next player. Returns true when a new round begins. */
  advance(game: GameState) {
    if (game.status !== "PLAYING") throw new TurnManagerError("This game has already finished.");
    const index = game.players.findIndex((player) => player.id === game.currentPlayerId);
    const nextIndex = (index + 1) % game.players.length;
    game.currentPlayerId = game.players[nextIndex].id;
    game.turnNumber += 1;
    if (nextIndex === 0) {
      game.currentRound += 1;
      return true;
    }
    return false;
  }
}
