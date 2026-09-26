import type { GameView } from "../../game/types/game";
import type { ResourceType, Resources } from "../../game/types/resources";
import type { PowerParams } from "../../game/types/cards";
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

export interface RefreshVoterMarketPayload extends RoomActionPayload {
  /** Exactly 1 resource to discard. */
  discard: Partial<Resources>;
}

export interface PlaceVotersPayload extends RoomActionPayload {
  constituencyId: string;
  count: number;
}

export interface BuySealedCardPayload extends RoomActionPayload {
  instanceId: string;
  /** Exactly 4 resources of any mix, e.g. { capitalism: 2, idealism: 1, supremacy: 1 }. */
  payment: Partial<Resources>;
}

export interface UseSealedCardPayload extends RoomActionPayload {
  instanceId: string;
  params: PowerParams;
}

export interface UseAbilityPayload extends RoomActionPayload {
  ideology: ResourceType;
  params: PowerParams;
}

export interface GerrymanderPayload extends RoomActionPayload {
  fromConstituencyId: string;
  toConstituencyId: string;
  voterOwnerId: string;
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
  refreshVoterMarket: (payload: RefreshVoterMarketPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  placeVoters: (payload: PlaceVotersPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  buySealedCard: (payload: BuySealedCardPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  useSealedCard: (payload: UseSealedCardPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  useAbility: (payload: UseAbilityPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
  gerrymander: (payload: GerrymanderPayload, acknowledgement: SocketAcknowledgement<GameView>) => void;
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
