import { randomBytes, randomInt, randomUUID } from "node:crypto";

import type { LobbyPlayer, LobbyRoom, LobbyStatus } from "../game/types/lobby";

const MAX_PLAYERS = 5;
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 20;

interface StoredPlayer extends LobbyPlayer {
  token: string;
  socketId?: string;
}

interface StoredRoom {
  code: string;
  hostPlayerId: string;
  maxPlayers: number;
  status: LobbyStatus;
  players: Map<string, StoredPlayer>;
  createdAt: number;
}

export class RoomManagerError extends Error {}

export class RoomManager {
  private readonly rooms = new Map<string, StoredRoom>();

  createRoom(username: string, socketId: string) {
    const player = this.createPlayer(username, socketId);
    const room: StoredRoom = {
      code: this.createRoomCode(),
      hostPlayerId: player.id,
      maxPlayers: MAX_PLAYERS,
      status: "LOBBY",
      players: new Map([[player.id, player]]),
      createdAt: Date.now(),
    };

    this.rooms.set(room.code, room);
    return { room: this.toLobbyRoom(room), player };
  }

  joinRoom(roomCode: string, username: string, socketId: string, playerToken?: string) {
    const room = this.getStoredRoom(roomCode);
    const reconnectingPlayer = playerToken ? this.findPlayerByToken(room, playerToken) : undefined;

    if (reconnectingPlayer) {
      reconnectingPlayer.isConnected = true;
      reconnectingPlayer.socketId = socketId;
      return { room: this.toLobbyRoom(room), player: reconnectingPlayer };
    }

    if (room.status !== "LOBBY") {
      throw new RoomManagerError("This game is already in progress. Only existing players can reconnect.");
    }

    if (room.players.size >= room.maxPlayers) {
      throw new RoomManagerError("This room is full.");
    }

    const player = this.createPlayer(username, socketId);
    room.players.set(player.id, player);
    return { room: this.toLobbyRoom(room), player };
  }

  leaveRoom(roomCode: string, playerId: string) {
    const room = this.getStoredRoom(roomCode);
    const removedPlayer = room.players.get(playerId);

    if (!removedPlayer) {
      throw new RoomManagerError("You are not a member of this room.");
    }

    room.players.delete(playerId);

    if (room.players.size === 0) {
      this.rooms.delete(room.code);
      return undefined;
    }

    if (room.hostPlayerId === playerId) {
      const nextHost = room.players.values().next().value;
      if (!nextHost) {
        throw new RoomManagerError("The room no longer has a host.");
      }
      room.hostPlayerId = nextHost.id;
    }

    return this.toLobbyRoom(room);
  }

  setReady(roomCode: string, playerId: string, isReady: boolean) {
    const room = this.getStoredRoom(roomCode);
    const player = room.players.get(playerId);

    if (room.status !== "LOBBY") {
      throw new RoomManagerError("Ready status cannot be changed after the game has started.");
    }

    if (!player) {
      throw new RoomManagerError("You are not a member of this room.");
    }

    if (typeof isReady !== "boolean") {
      throw new RoomManagerError("The ready state must be true or false.");
    }

    player.isReady = isReady;
    return this.toLobbyRoom(room);
  }

  startGame(roomCode: string, playerId: string) {
    const room = this.getStoredRoom(roomCode);

    if (room.status !== "LOBBY") {
      throw new RoomManagerError("This game has already started.");
    }

    if (room.hostPlayerId !== playerId) {
      throw new RoomManagerError("Only the host can start the game.");
    }

    if (room.players.size < 2) {
      throw new RoomManagerError("At least two players are required to start a game.");
    }

    if ([...room.players.values()].some((player) => !player.isReady)) {
      throw new RoomManagerError("Every player must be ready before the game can start.");
    }
  }

  markGameStarted(roomCode: string) {
    const room = this.getStoredRoom(roomCode);
    room.status = "PLAYING";
    return this.toLobbyRoom(room);
  }

  markDisconnected(roomCode: string, playerId: string, socketId: string) {
    const room = this.rooms.get(roomCode);
    const player = room?.players.get(playerId);

    if (!room || !player || player.socketId !== socketId) {
      return undefined;
    }

    player.isConnected = false;
    player.socketId = undefined;
    return this.toLobbyRoom(room);
  }

  assertCurrentConnection(roomCode: string, playerId: string, socketId: string) {
    const room = this.getStoredRoom(roomCode);
    const player = room.players.get(playerId);

    if (!player || player.socketId !== socketId) {
      throw new RoomManagerError("Your room session has been superseded. Please rejoin the room.");
    }
  }

  getRoom(roomCode: string) {
    const room = this.rooms.get(this.normalizeRoomCode(roomCode));
    return room ? this.toLobbyRoom(room) : undefined;
  }

  private createPlayer(username: string, socketId: string): StoredPlayer {
    return {
      id: randomUUID(),
      token: randomBytes(24).toString("base64url"),
      username: this.normalizeUsername(username),
      isReady: false,
      isConnected: true,
      socketId,
    };
  }

  private createRoomCode() {
    let roomCode: string;

    do {
      roomCode = Array.from({ length: ROOM_CODE_LENGTH }, () => {
        const index = randomInt(ROOM_CODE_ALPHABET.length);
        return ROOM_CODE_ALPHABET[index];
      }).join("");
    } while (this.rooms.has(roomCode));

    return roomCode;
  }

  private getStoredRoom(roomCode: string) {
    const room = this.rooms.get(this.normalizeRoomCode(roomCode));

    if (!room) {
      throw new RoomManagerError("That room does not exist.");
    }

    return room;
  }

  private findPlayerByToken(room: StoredRoom, playerToken: string) {
    return [...room.players.values()].find((player) => player.token === playerToken);
  }

  private normalizeRoomCode(roomCode: string) {
    if (typeof roomCode !== "string") {
      throw new RoomManagerError("A valid room code is required.");
    }

    return roomCode.trim().toUpperCase();
  }

  private normalizeUsername(username: string) {
    if (typeof username !== "string") {
      throw new RoomManagerError("A valid guest name is required.");
    }

    const value = username.trim().replace(/\s+/g, " ");

    if (value.length < MIN_USERNAME_LENGTH || value.length > MAX_USERNAME_LENGTH) {
      throw new RoomManagerError(`Guest names must be ${MIN_USERNAME_LENGTH}–${MAX_USERNAME_LENGTH} characters.`);
    }

    return value;
  }

  private toLobbyRoom(room: StoredRoom): LobbyRoom {
    return {
      code: room.code,
      hostPlayerId: room.hostPlayerId,
      maxPlayers: room.maxPlayers,
      status: room.status,
      players: [...room.players.values()].map((player) => ({
        id: player.id,
        username: player.username,
        isReady: player.isReady,
        isConnected: player.isConnected,
      })),
      createdAt: room.createdAt,
    };
  }
}
