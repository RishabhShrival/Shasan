import { GameEngine, type GameEngineDependencies } from "../game/engine/GameEngine";
import type { GameState, GameView, LobbyRoom, PowerParams, ResourceType } from "../game/types";

export class GameManagerError extends Error {}

/**
 * Stores active games in memory. Swap the Map for Redis/PostgreSQL later
 * without touching the rules engine.
 */
export class GameManager {
  private readonly games = new Map<string, GameState>();
  private readonly engine: GameEngine;

  constructor(dependencies: GameEngineDependencies = {}) {
    this.engine = new GameEngine({}, dependencies);
  }

  createGame(lobby: LobbyRoom) {
    if (this.games.has(lobby.code)) throw new GameManagerError("A game already exists for this room.");
    const game = this.engine.createGame({
      roomCode: lobby.code,
      players: lobby.players.map((player) => ({ id: player.id, username: player.username, isConnected: player.isConnected })),
    });
    this.games.set(lobby.code, game);
    return this.engine.snapshot(game);
  }

  getGameForPlayer(roomCode: string, playerId: string) {
    return this.run(roomCode, playerId, () => undefined);
  }

  endTurn(roomCode: string, playerId: string) {
    return this.run(roomCode, playerId, (game) => this.engine.endTurn(game, playerId));
  }

  makeDecision(roomCode: string, playerId: string, choice: "Yes" | "No") {
    return this.run(roomCode, playerId, (game) => this.engine.makeDecision(game, playerId, choice));
  }

  buyVoter(roomCode: string, playerId: string, voterCardId: string) {
    return this.run(roomCode, playerId, (game) => this.engine.buyVoter(game, playerId, voterCardId));
  }

  refreshVoterMarket(roomCode: string, playerId: string, discard: unknown) {
    return this.run(roomCode, playerId, (game) => this.engine.refreshVoterMarket(game, playerId, discard));
  }

  placeVoters(roomCode: string, playerId: string, constituencyId: string, count: number) {
    return this.run(roomCode, playerId, (game) => this.engine.placeVoters(game, playerId, constituencyId, count));
  }

  buySealedCard(roomCode: string, playerId: string, instanceId: string, payment: unknown) {
    return this.run(roomCode, playerId, (game) => this.engine.buySealedCard(game, playerId, instanceId, payment));
  }

  useSealedCard(roomCode: string, playerId: string, instanceId: string, params: PowerParams) {
    return this.run(roomCode, playerId, (game) => this.engine.useSealedCard(game, playerId, instanceId, params));
  }

  useAbility(roomCode: string, playerId: string, ideology: ResourceType, params: PowerParams) {
    return this.run(roomCode, playerId, (game) => this.engine.useAbility(game, playerId, ideology, params));
  }

  gerrymander(roomCode: string, playerId: string, fromConstituencyId: string, toConstituencyId: string, voterOwnerId: string) {
    return this.run(roomCode, playerId, (game) => this.engine.gerrymander(game, playerId, fromConstituencyId, toConstituencyId, voterOwnerId));
  }

  setPlayerConnection(roomCode: string, playerId: string, isConnected: boolean) {
    const game = this.games.get(roomCode);
    if (!game) return undefined;
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

  private run(roomCode: string, playerId: string, action: (game: GameState) => unknown) {
    const game = this.getStoredGame(roomCode);
    this.assertGamePlayer(game, playerId);
    action(game);
    return this.engine.createView(game, playerId);
  }

  private getStoredGame(roomCode: string) {
    const game = this.games.get(roomCode);
    if (!game) throw new GameManagerError("This game has not started yet.");
    return game;
  }

  private assertGamePlayer(game: GameState, playerId: string) {
    if (!game.players.some((player) => player.id === playerId)) throw new GameManagerError("You are not part of this game.");
  }
}
