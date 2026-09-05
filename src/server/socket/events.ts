import type { GameView } from "../../game/types/game";
import type { ResourceType } from "../../game/types/resources";
import type { LobbyRoom } from "../../game/types/lobby";

export interface CreateRoomPayload {
  username: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  username: string;
  playerToken?: string;
}

export interface RoomActionPayload {
  roomCode: string;
}

export interface ToggleReadyPayload extends RoomActionPayload {
  isReady: boolean;
}

export interface MakeDecisionPayload extends RoomActionPayload {
  choice: "Yes" | "No";
}

export interface BuyVoterPayload extends RoomActionPayload {
  voterCardId: string;
}

export interface PlaceInfluencePayload extends RoomActionPayload {
  constituencyId: string;
  count: number;
}

export interface UsePowerPayload extends RoomActionPayload {
  powerCardId: string;
  targetPlayerId?: string;
  constituencyId?: string;
}

export interface UseResourceAbilityPayload extends RoomActionPayload {
  resourceType: ResourceType;
  targetPlayerId?: string;
  constituencyId?: string;
}

export interface ShiftMajorityVoterPayload extends RoomActionPayload {
  fromConstituencyId: string;
  toConstituencyId: string;
}

export interface RoomSession {
  room: LobbyRoom;
  playerId: string;
  playerToken: string;
  username: string;
}

export type SocketResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SocketAcknowledgement<T> = (result: SocketResult<T>) => void;

export interface ClientToServerEvents {
  createRoom: (payload: CreateRoomPayload, acknowledgement: SocketAcknowledgement<RoomSession>) => void;
  joinRoom: (payload: JoinRoomPayload, acknowledgement: SocketAcknowledgement<RoomSession>) => void;
  leaveRoom: (payload: RoomActionPayload, acknowledgement: SocketAcknowledgement<void>) => void;
  setReady: (payload: ToggleReadyPayload, acknowledgement: SocketAcknowledgement<LobbyRoom>) => void;
  startGame: (payload: RoomActionPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  getGameState: (payload: RoomActionPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  endTurn: (payload: RoomActionPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  makeDecision: (payload: MakeDecisionPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  buyVoter: (payload: BuyVoterPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  placeInfluence: (payload: PlaceInfluencePayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  buyPower: (payload: RoomActionPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  usePower: (payload: UsePowerPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  useResourceAbility: (payload: UseResourceAbilityPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  shiftMajorityVoter: (payload: ShiftMajorityVoterPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
}

export interface ServerToClientEvents {
  roomUpdated: (room: LobbyRoom) => void;
  gameStarted: (payload: { roomCode: string }) => void;
  gameStateUpdated: (game: GameView) => void;
  gameFinished: (game: GameView) => void;
  gameError: (payload: { message: string }) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  roomCode?: string;
  playerId?: string;
}
