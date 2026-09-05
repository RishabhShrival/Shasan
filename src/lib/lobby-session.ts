"use client";

const STORAGE_KEY = "throne:lobby-session";

export interface LobbySession {
  roomCode: string;
  playerId: string;
  playerToken: string;
  username: string;
}

export function saveLobbySession(session: LobbySession) {
  // A player seat belongs to a browser tab. localStorage is shared between
  // tabs, which caused a second player opened in another tab to overwrite the
  // first player's token.
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getLobbySession() {
  const rawSession = window.sessionStorage.getItem(STORAGE_KEY);
  if (!rawSession) {
    return undefined;
  }

  try {
    const session: unknown = JSON.parse(rawSession);
    return isLobbySession(session) ? session : undefined;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return undefined;
  }
}

export function clearLobbySession() {
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function isLobbySession(value: unknown): value is LobbySession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;
  return (
    typeof session.roomCode === "string" &&
    typeof session.playerId === "string" &&
    typeof session.playerToken === "string" &&
    typeof session.username === "string"
  );
}
