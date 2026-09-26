"use client";

import Link from "next/link";
import { Crown, Hourglass, Radio, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ElectionBoard } from "@/components/board/election-board";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GamePhase, GameView, PowerParams, ResourceType, Resources } from "@/game/types";
import { playerColor } from "@/lib/ideology";
import { getLobbySession, saveLobbySession, type LobbySession } from "@/lib/lobby-session";
import { getSocket } from "@/lib/socket";
import type { SocketResult } from "@/server/socket/events";

import { CampaignLog } from "./campaign-log";
import { DecisionPanel } from "./decision-panel";
import { EventBanner } from "./event-banner";
import { GerrymanderPanel } from "./gerrymander-panel";
import { PlayersPanel } from "./players-panel";
import { ResultsPanel } from "./results-panel";
import { SealedMarket } from "./sealed-market";
import { VoterMarket } from "./voter-market";
import { YourHand, YourResources } from "./your-hand";

interface GameClientProps {
  roomCode: string;
}

const phaseLabels: Record<GamePhase, string> = {
  POLITICAL_DECISION: "Answering the political question",
  ACTION_PHASE: "Action phase — buy, place, gerrymander, play cards",
  ELECTION_RESULTS: "Election results",
};

export function GameClient({ roomCode }: GameClientProps) {
  const [game, setGame] = useState<GameView>();
  const [session, setSession] = useState<LobbySession>();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<{ from?: string; to?: string }>({});
  const socket = useMemo(() => getSocket(), []);
  const normalizedRoomCode = roomCode.toUpperCase();

  const restoreGameSession = useCallback(() => {
    const savedSession = getLobbySession();
    if (!savedSession || savedSession.roomCode !== normalizedRoomCode) {
      setError("This browser does not have a player token for this game. Return to the lobby to reconnect.");
      return;
    }

    setSession(savedSession);
    socket.emit(
      "joinRoom",
      { roomCode: normalizedRoomCode, username: savedSession.username, playerToken: savedSession.playerToken },
      (joinResult) => {
        if (!joinResult.ok) {
          setError(joinResult.error);
          return;
        }
        const restoredSession: LobbySession = {
          roomCode: joinResult.data.room.code,
          playerId: joinResult.data.playerId,
          playerToken: joinResult.data.playerToken,
          username: joinResult.data.username,
        };
        setSession(restoredSession);
        saveLobbySession(restoredSession);
        socket.emit("getGameState", { roomCode: normalizedRoomCode }, (gameResult) => {
          if (!gameResult.ok) {
            setError(gameResult.error);
            return;
          }
          setGame(gameResult.data);
        });
      },
    );
  }, [normalizedRoomCode, socket]);

  useEffect(() => {
    const onGameUpdated = (updatedGame: GameView) => {
      if (updatedGame.roomCode === normalizedRoomCode) setGame(updatedGame);
    };
    const onGameError = ({ message }: { message: string }) => setError(message);

    socket.on("gameStateUpdated", onGameUpdated);
    socket.on("gameFinished", onGameUpdated);
    socket.on("gameError", onGameError);
    socket.on("connect", restoreGameSession);
    socket.connect();
    if (socket.connected) restoreGameSession();

    return () => {
      socket.off("gameStateUpdated", onGameUpdated);
      socket.off("gameFinished", onGameUpdated);
      socket.off("gameError", onGameError);
      socket.off("connect", restoreGameSession);
    };
  }, [normalizedRoomCode, restoreGameSession, socket]);

  const onPreview = useCallback((from?: string, to?: string) => setPreview({ from, to }), []);

  const viewerId = session?.playerId;
  const currentPlayerIndex = game?.players.findIndex((player) => player.id === game.currentPlayerId) ?? -1;
  const currentPlayer = game?.players[currentPlayerIndex];
  const isYourTurn = Boolean(game && viewerId && game.currentPlayerId === viewerId && game.status === "PLAYING");
  const canAct = Boolean(isYourTurn && game?.phase === "ACTION_PHASE");

  function handleResult(result: SocketResult<GameView>) {
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setGame(result.data);
  }

  function begin() {
    setError(undefined);
    setPending(true);
  }

  const room = normalizedRoomCode;
  const actions = {
    decide: (choice: "Yes" | "No") => { begin(); socket.emit("makeDecision", { roomCode: room, choice }, handleResult); },
    buyVoter: (voterCardId: string) => { begin(); socket.emit("buyVoter", { roomCode: room, voterCardId }, handleResult); },
    refreshVoters: (discard: Partial<Resources>) => { begin(); socket.emit("refreshVoterMarket", { roomCode: room, discard }, handleResult); },
    place: (constituencyId: string, count: number) => { begin(); socket.emit("placeVoters", { roomCode: room, constituencyId, count }, handleResult); },
    buySealed: (instanceId: string, payment: Resources) => { begin(); socket.emit("buySealedCard", { roomCode: room, instanceId, payment }, handleResult); },
    useSealed: (instanceId: string, params: PowerParams) => { begin(); socket.emit("useSealedCard", { roomCode: room, instanceId, params }, handleResult); },
    useAbility: (ideology: ResourceType, params: PowerParams) => { begin(); socket.emit("useAbility", { roomCode: room, ideology, params }, handleResult); },
    gerrymander: (fromConstituencyId: string, toConstituencyId: string, voterOwnerId: string) => {
      begin();
      socket.emit("gerrymander", { roomCode: room, fromConstituencyId, toConstituencyId, voterOwnerId }, handleResult);
    },
    endTurn: () => { begin(); socket.emit("endTurn", { roomCode: room }, handleResult); },
  };

  const highlightIds: Record<string, "source" | "target"> = {};
  if (preview.from) highlightIds[preview.from] = "source";
  if (preview.to) highlightIds[preview.to] = "target";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#070b13] px-3 py-4 text-white sm:px-6 lg:px-8">
      <div aria-hidden="true" className="paper-texture pointer-events-none fixed inset-0" />
      <div aria-hidden="true" className="pointer-events-none fixed right-[-15rem] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-[#c58e30]/[0.08] blur-3xl" />
      <div className="relative mx-auto max-w-[1400px]">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="THRONE home">
            <span className="flex size-8 items-center justify-center border border-[#d9ae4d]/60 bg-[#d9ae4d]/10 text-[#e6c16d]">
              <Crown size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-bold tracking-[0.2em] text-[#f9edcf]">THRONE</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold tracking-[0.13em] text-[#aab5c3]">
            <span className="hidden sm:inline">ROOM {normalizedRoomCode}</span>
            {game ? <span>ROUND {game.currentRound}</span> : null}
            <span className="inline-flex items-center gap-2">
              <Radio className={game ? "text-[#67c197]" : "animate-soft-pulse text-[#d9ae4d]"} size={14} aria-hidden="true" />
              {game ? "LIVE" : "CONNECTING"}
            </span>
          </div>
        </header>

        {error ? (
          <div role="alert" className="fixed left-1/2 top-4 z-50 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 rounded-sm border border-[#c95158]/40 bg-[#241217] px-10 py-3 text-center text-sm text-[#f2c2c4] shadow-2xl">
            {error}
            <button type="button" onClick={() => setError(undefined)} className="absolute right-3 top-2.5 text-[#f2c2c4] transition hover:text-white" aria-label="Close error message"><X size={18} /></button>
          </div>
        ) : null}

        {!game ? (
          <Card className="mt-7 p-8 text-center text-sm text-[#aab5c3]">Restoring the authoritative game state…</Card>
        ) : (
          <div className="mt-4 space-y-4">
            {game.status === "FINISHED" ? <ResultsPanel game={game} viewerId={viewerId} /> : null}
            <EventBanner event={game.currentEvent} round={game.currentRound} />

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr]">
              <aside className="space-y-4 lg:col-start-2 lg:row-start-1">
                <Card className="p-5">
                  <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">CURRENT TURN</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full border text-lg font-bold" style={{ borderColor: playerColor(currentPlayerIndex), color: playerColor(currentPlayerIndex) }}>
                      {currentPlayer?.username.slice(0, 1).toUpperCase() ?? "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-white">{isYourTurn ? "Your turn" : currentPlayer?.username ?? "—"}</p>
                      <p className="text-xs text-[#aab5c3]">{phaseLabels[game.phase]}</p>
                    </div>
                  </div>
                  {isYourTurn ? (
                    <p className="mt-3 text-[11px] leading-5 text-[#8d9aab]">
                      {game.phase === "POLITICAL_DECISION"
                        ? "Answer the question below to collect resources."
                        : "Take as many valid actions as you like, then end your turn."}
                    </p>
                  ) : null}
                  <Button className="mt-4 w-full" onClick={actions.endTurn} disabled={!canAct || pending}>
                    <Hourglass size={17} aria-hidden="true" />
                    {isYourTurn ? (game.phase === "ACTION_PHASE" ? "END TURN" : "ANSWER FIRST") : "WAIT FOR YOUR TURN"}
                  </Button>
                </Card>
                <DecisionPanel game={game} viewerId={viewerId} isYourTurn={isYourTurn && !pending} currentPlayer={currentPlayer} onDecide={actions.decide} />
                <YourResources game={game} />
              </aside>
              <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <Card className="p-3 sm:p-5">
                  <ElectionBoard
                    board={game.board}
                    players={game.players}
                    viewerId={viewerId}
                    placeableVoters={canAct && !pending ? game.yourCards.reserveVoters : 0}
                    onPlace={actions.place}
                    highlightIds={highlightIds}
                  />
                </Card>
                <div className="grid gap-4 xl:grid-cols-2">
                  <VoterMarket game={game} canAct={canAct && !pending} onBuy={actions.buyVoter} onRefresh={actions.refreshVoters} />
                  <SealedMarket game={game} canAct={canAct && !pending} onBuy={actions.buySealed} />
                </div>
                <GerrymanderPanel game={game} viewerId={viewerId} canAct={canAct && !pending} onGerrymander={actions.gerrymander} onPreview={onPreview} />
                <YourHand game={game} viewerId={viewerId} canAct={canAct && !pending} onUseSealed={actions.useSealed} onUseAbility={actions.useAbility} />
              </div>

              <aside className="space-y-4 lg:col-start-2 lg:row-start-2">
                <PlayersPanel game={game} viewerId={viewerId} />
                <CampaignLog entries={game.actionLog} />
              </aside>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
