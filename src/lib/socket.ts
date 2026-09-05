"use client";

import { io, type Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/server/socket/events";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | undefined;

export function getSocket() {
  if (!socket) {
    socket = io({
      autoConnect: false,
    });
  }

  return socket;
}
