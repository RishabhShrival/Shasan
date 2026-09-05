import { GameEngine, type GameEngineDependencies } from "../game/engine/GameEngine";
import type { GameState, GameView, LobbyRoom, ResourceType } from "../game/types";

export class GameManagerError extends Error {}

export class GameManager {
  private readonly games = new Map<string, GameState>();
  private readonly engine: GameEngine;

  constructor(dependencies: GameEngineDependencies = {}) {
    this.engine = new GameEngine({}, dependencies);
  }

  createGame(lobby: LobbyRoom) {
    if (this.games.has(lobby.code)) {
      throw new GameManagerError("A game already exists for this room.");
    }

    const game = this.engine.createGame({
      roomCode: lobby.code,
      players: lobby.players.map((player) => ({
        id: player.id,
        username: player.username,
        isConnected: player.isConnected,
      })),
    });
    this.games.set(lobby.code, game);
    return this.engine.snapshot(game);
  }

  getGameForPlayer(roomCode: string, playerId: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    return this.engine.createView(game, playerId);
  }

  endTurn(roomCode: string, playerId: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.endTurn(game, playerId);
    return this.engine.createView(game, playerId);
  }

  makeDecision(roomCode: string, playerId: string, choice: "Yes" | "No") {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.makeDecision(game, playerId, choice);
    return this.engine.createView(game, playerId);
  }

  buyVoter(roomCode: string, playerId: string, voterCardId: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.buyVoter(game, playerId, voterCardId);
    return this.engine.createView(game, playerId);
  }

  placeInfluence(roomCode: string, playerId: string, constituencyId: string, count: number) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.placeInfluence(game, playerId, constituencyId, count);
    return this.engine.createView(game, playerId);
  }

  buyPower(roomCode: string, playerId: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.buyPower(game, playerId);
    return this.engine.createView(game, playerId);
  }

  usePower(roomCode: string, playerId: string, powerCardId: string, targetPlayerId?: string, constituencyId?: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.usePower(game, playerId, powerCardId, targetPlayerId, constituencyId);
    return this.engine.createView(game, playerId);
  }

  useResourceAbility(roomCode: string, playerId: string, resourceType: ResourceType, targetPlayerId?: string, constituencyId?: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.useResourceAbility(game, playerId, resourceType, targetPlayerId, constituencyId);
    return this.engine.createView(game, playerId);
  }

  shiftMajorityVoter(roomCode: string, playerId: string, fromConstituencyId: string, toConstituencyId: string) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    this.engine.shiftMajorityVoter(game, playerId, fromConstituencyId, toConstituencyId);
    return this.engine.createView(game, playerId);
  }

  setPlayerConnection(roomCode: string, playerId: string, isConnected: boolean) {
    const game = this.games.get(roomCode);
    if (!game) {
      return undefined;
    }

    this.assertGamePlayer(game, playerId);
    this.engine.setPlayerConnection(game, playerId, isConnected);
    return this.engine.snapshot(game);
  }

  getGame(roomCode: string) {
    return this.engine.snapshot(this.getStoredGame(roomCode));
  }

  createView(game: GameState, playerId: string): GameView {
    this.assertGamePlayer(game, playerId);
    return this.engine.createView(game, playerId);
  }

  hasGame(roomCode: string) {
    return this.games.has(roomCode);
  }

  private getStoredGame(roomCode: string) {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new GameManagerError("This game has not started yet.");
    }

    return game;
  }

  private assertGamePlayer(game: GameState, playerId: string) {
    if (!game.players.some((player) => player.id === playerId)) {
      throw new GameManagerError("You are not part of this game.");
    }
  }
}
