export type LobbyStatus = "LOBBY" | "PLAYING";

export interface LobbyPlayer {
  id: string;
  username: string;
  isReady: boolean;
  isConnected: boolean;
}

export interface LobbyRoom {
  code: string;
  hostPlayerId: string;
  maxPlayers: number;
  status: LobbyStatus;
  players: LobbyPlayer[];
  createdAt: number;
}
