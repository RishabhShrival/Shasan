import type { GameConfig, GamePhase, GameState } from "../types/game";

export class TurnManagerError extends Error {}

export class TurnManager {
  constructor(private readonly config: Pick<GameConfig, "maxRounds">) {}

  beginGame(game: GameState, now: number) {
    game.phase = "POLITICAL_DECISION";
    game.updatedAt = now;
  }

  endTurn(game: GameState, playerId: string, now: number) {
    this.assertActivePlayer(game, playerId);
    const activePlayerIndex = game.players.findIndex((player) => player.id === playerId);
    const currentPlayer = game.players[activePlayerIndex];

    game.phase = "NEXT_PLAYER";
    game.actionLog.push({
      id: `turn-ended-${now}-${playerId}`,
      type: "TURN_ENDED",
      message: `${currentPlayer.username} ended their turn.`,
      timestamp: now,
      playerId,
    });

    const isLastPlayer = activePlayerIndex === game.players.length - 1;
    if (!isLastPlayer) {
      game.currentPlayerId = game.players[activePlayerIndex + 1].id;
      game.phase = "POLITICAL_DECISION";
      game.updatedAt = now;
      this.skipBlockedPlayer(game, now);
      return;
    }

    game.phase = "ROUND_COMPLETE";
    if (game.currentRound >= this.config.maxRounds) {
      game.status = "FINISHED";
      game.phase = "ELECTION_RESULTS";
      game.updatedAt = now;
      game.actionLog.push({
        id: `game-finished-${now}`,
        type: "GAME_FINISHED",
        message: "All rounds are complete. Election results are ready.",
        timestamp: now,
      });
      return;
    }

    game.currentRound += 1;
    game.currentPlayerId = game.players[0].id;
    game.phase = "POLITICAL_DECISION";
    game.updatedAt = now;
    game.actionLog.push({
      id: `round-started-${now}-${game.currentRound}`,
      type: "ROUND_STARTED",
      message: `Round ${game.currentRound} has begun.`,
      timestamp: now,
    });
    this.skipBlockedPlayer(game, now);
  }

  setPhase(game: GameState, phase: GamePhase, now: number) {
    if (game.status !== "PLAYING") {
      throw new TurnManagerError("This game has already finished.");
    }

    game.phase = phase;
    game.updatedAt = now;
  }

  private assertActivePlayer(game: GameState, playerId: string) {
    if (game.status !== "PLAYING") {
      throw new TurnManagerError("This game has already finished.");
    }

    if (game.currentPlayerId !== playerId) {
      throw new TurnManagerError("It is not your turn.");
    }
  }

  private skipBlockedPlayer(game: GameState, now: number) {
    const playerCards = game.playerCards[game.currentPlayerId];
    if (!playerCards || playerCards.turnsToSkip < 1) return;
    playerCards.turnsToSkip -= 1;
    const player = game.players.find((candidate) => candidate.id === game.currentPlayerId);
    game.actionLog.push({
      id: `turn-skipped-${now}-${game.currentPlayerId}`,
      type: "TURN_ENDED",
      message: `${player?.username ?? "A player"} misses this turn.`,
      timestamp: now,
      playerId: game.currentPlayerId,
    });
    this.endTurn(game, game.currentPlayerId, now);
  }
}
