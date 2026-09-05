import { createServer } from "node:http";

import next from "next";
import { Server } from "socket.io";

import { GameManager } from "./src/server/GameManager";
import type { GameState } from "./src/game/types";
import { RoomManager, RoomManagerError } from "./src/server/RoomManager";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./src/server/socket/events";

const development = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? 3000);
const nextApp = next({ dev: development, hostname, port });
const nextHandler = nextApp.getRequestHandler();
const roomManager = new RoomManager();
const gameManager = new GameManager();

function broadcastRoom(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomCode: string,
) {
  const room = roomManager.getRoom(roomCode);
  if (room) {
    io.to(room.code).emit("roomUpdated", room);
  }
}

async function broadcastGame(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  game: GameState,
) {
  const sockets = await io.in(game.roomCode).fetchSockets();
  for (const socket of sockets) {
    if (socket.data.playerId) {
      socket.emit("gameStateUpdated", gameManager.createView(game, socket.data.playerId));
    }
  }
}

function getSession(socket: { data: SocketData; id: string }, roomCode: string) {
  if (typeof roomCode !== "string") {
    throw new RoomManagerError("A valid room code is required.");
  }

  const normalizedRoomCode = roomCode.trim().toUpperCase();
  if (socket.data.roomCode !== normalizedRoomCode || !socket.data.playerId) {
    throw new RoomManagerError("Your room session is no longer valid. Please rejoin the room.");
  }

  roomManager.assertCurrentConnection(normalizedRoomCode, socket.data.playerId, socket.id);
  return { roomCode: normalizedRoomCode, playerId: socket.data.playerId };
}

void nextApp.prepare().then(() => {
  const httpServer = createServer(nextHandler);
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: development ? true : false,
    },
  });

  io.on("connection", (socket) => {
    socket.on("createRoom", ({ username }, acknowledgement) => {
      try {
        const { room, player } = roomManager.createRoom(username, socket.id);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = player.id;
        acknowledgement({
          ok: true,
          data: { room, playerId: player.id, playerToken: player.token, username: player.username },
        });
        broadcastRoom(io, room.code);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("joinRoom", ({ roomCode, username, playerToken }, acknowledgement) => {
      try {
        const { room, player } = roomManager.joinRoom(roomCode, username, socket.id, playerToken);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = player.id;
        acknowledgement({
          ok: true,
          data: { room, playerId: player.id, playerToken: player.token, username: player.username },
        });
        const game = gameManager.setPlayerConnection(room.code, player.id, true);
        if (game) {
          void broadcastGame(io, game);
        }
        broadcastRoom(io, room.code);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("leaveRoom", ({ roomCode }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        if (gameManager.hasGame(session.roomCode)) {
          throw new RoomManagerError("Players cannot leave an active game. Reconnect to continue the campaign.");
        }
        const room = roomManager.leaveRoom(session.roomCode, session.playerId);
        socket.leave(session.roomCode);
        socket.data.roomCode = undefined;
        socket.data.playerId = undefined;
        acknowledgement({ ok: true, data: undefined });
        if (room) {
          io.to(room.code).emit("roomUpdated", room);
        }
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("setReady", ({ roomCode, isReady }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const room = roomManager.setReady(session.roomCode, session.playerId, isReady);
        acknowledgement({ ok: true, data: room });
        io.to(room.code).emit("roomUpdated", room);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("startGame", ({ roomCode }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        roomManager.startGame(session.roomCode, session.playerId);
        const lobby = roomManager.markGameStarted(session.roomCode);
        const game = gameManager.createGame(lobby);
        const gameView = gameManager.createView(game, session.playerId);
        acknowledgement({ ok: true, data: gameView });
        io.to(lobby.code).emit("roomUpdated", lobby);
        io.to(session.roomCode).emit("gameStarted", { roomCode: session.roomCode });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("getGameState", ({ roomCode }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const game = gameManager.getGameForPlayer(session.roomCode, session.playerId);
        acknowledgement({ ok: true, data: game });
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("endTurn", async ({ roomCode }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.endTurn(session.roomCode, session.playerId);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
        if (game.status === "FINISHED") {
          const sockets = await io.in(game.roomCode).fetchSockets();
          for (const recipient of sockets) {
            if (recipient.data.playerId) {
              recipient.emit("gameFinished", gameManager.createView(game, recipient.data.playerId));
            }
          }
        }
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("makeDecision", ({ roomCode, choice }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.makeDecision(session.roomCode, session.playerId, choice);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("buyVoter", ({ roomCode, voterCardId }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.buyVoter(session.roomCode, session.playerId, voterCardId);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("placeInfluence", ({ roomCode, constituencyId, count }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.placeInfluence(session.roomCode, session.playerId, constituencyId, count);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("buyPower", ({ roomCode }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.buyPower(session.roomCode, session.playerId);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("usePower", ({ roomCode, powerCardId, targetPlayerId, constituencyId }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.usePower(session.roomCode, session.playerId, powerCardId, targetPlayerId, constituencyId);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("useResourceAbility", ({ roomCode, resourceType, targetPlayerId, constituencyId }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.useResourceAbility(session.roomCode, session.playerId, resourceType, targetPlayerId, constituencyId);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("shiftMajorityVoter", ({ roomCode, fromConstituencyId, toConstituencyId }, acknowledgement) => {
      try {
        const session = getSession(socket, roomCode);
        const gameView = gameManager.shiftMajorityVoter(session.roomCode, session.playerId, fromConstituencyId, toConstituencyId);
        const game = gameManager.getGame(session.roomCode);
        acknowledgement({ ok: true, data: gameView });
        void broadcastGame(io, game);
      } catch (error) {
        acknowledgement({ ok: false, error: getErrorMessage(error) });
      }
    });

    socket.on("disconnect", () => {
      const { roomCode, playerId } = socket.data;
      if (!roomCode || !playerId) {
        return;
      }

      const room = roomManager.markDisconnected(roomCode, playerId, socket.id);
      if (room) {
        io.to(room.code).emit("roomUpdated", room);
        const game = gameManager.setPlayerConnection(room.code, playerId, false);
        if (game) {
          void broadcastGame(io, game);
        }
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`THRONE lobby server ready at http://${hostname}:${port}`);
  });
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected server error occurred.";
}
