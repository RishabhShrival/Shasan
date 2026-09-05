"use client";

import Link from "next/link";
import { CircleDotDashed, Crown, Flag, Hourglass, Radio, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ElectionBoard } from "@/components/board/election-board";
import { Card } from "@/components/ui/card";
import type { GamePhase, GameView, ResourceType } from "@/game/types";
import { getLobbySession, saveLobbySession, type LobbySession } from "@/lib/lobby-session";
import { getSocket } from "@/lib/socket";

interface GameClientProps {
  roomCode: string;
}

const phaseLabels: Record<GamePhase, string> = {
  GAME_SETUP: "Preparing the campaign",
  POLITICAL_DECISION: "Political decision",
  ACTION_PHASE: "Action phase",
  INFLUENCE: "Influence phase",
  EVENT: "Event resolution",
  NEXT_PLAYER: "Changing turn",
  ROUND_COMPLETE: "Round complete",
  ELECTION_RESULTS: "Election results",
};

export function GameClient({ roomCode }: GameClientProps) {
  const [game, setGame] = useState<GameView>();
  const [session, setSession] = useState<LobbySession>();
  const [error, setError] = useState<string>();
  const [isEndingTurn, setIsEndingTurn] = useState(false);
  const [powerTargetPlayerId, setPowerTargetPlayerId] = useState("");
  const [powerTargetConstituencyId, setPowerTargetConstituencyId] = useState("");
  const [majoritySourceId, setMajoritySourceId] = useState("");
  const [majorityDestinationId, setMajorityDestinationId] = useState("");
  const [dismissedNoticeId, setDismissedNoticeId] = useState<string>();
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
      {
        roomCode: normalizedRoomCode,
        username: savedSession.username,
        playerToken: savedSession.playerToken,
      },
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
      if (updatedGame.roomCode === normalizedRoomCode) {
        setGame(updatedGame);
      }
    };
    const onGameFinished = (finishedGame: GameView) => {
      if (finishedGame.roomCode === normalizedRoomCode) {
        setGame(finishedGame);
      }
    };
    const onGameError = ({ message }: { message: string }) => setError(message);

    socket.on("gameStateUpdated", onGameUpdated);
    socket.on("gameFinished", onGameFinished);
    socket.on("gameError", onGameError);
    socket.on("connect", restoreGameSession);
    socket.connect();

    if (socket.connected) {
      restoreGameSession();
    }

    return () => {
      socket.off("gameStateUpdated", onGameUpdated);
      socket.off("gameFinished", onGameFinished);
      socket.off("gameError", onGameError);
      socket.off("connect", restoreGameSession);
    };
  }, [normalizedRoomCode, restoreGameSession, socket]);

  const currentPlayer = game?.players.find((player) => player.id === game.currentPlayerId);
  const isYourTurn = Boolean(game && session && game.currentPlayerId === session.playerId && game.status === "PLAYING");
  const latestCardActivity = game?.actionLog.slice().reverse().find((entry) =>
    entry.type === "POWER_PURCHASED" || entry.type === "POWER_USED" || entry.type === "RESOURCE_ABILITY_USED",
  );
  const decisionNoticeId = game?.currentDecisionResolution
    ? `decision-${game.currentDecisionResolution.playerId}-${game.currentDecisionResolution.choice}-${game.currentRound}`
    : undefined;

  function endTurn() {
    if (!game) {
      return;
    }

    setError(undefined);
    setIsEndingTurn(true);
    socket.emit("endTurn", { roomCode: game.roomCode }, (result) => {
      setIsEndingTurn(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setGame(result.data);
    });
  }

  function makeDecision(choice: "Yes" | "No") {
    if (!game) return;
    setError(undefined);
    socket.emit("makeDecision", { roomCode: game.roomCode, choice }, handleGameResult);
  }

  function buyVoter(voterCardId: string) {
    if (!game) return;
    setError(undefined);
    socket.emit("buyVoter", { roomCode: game.roomCode, voterCardId }, handleGameResult);
  }

  function placeInfluence(constituencyId: string) {
    if (!game) return;
    setError(undefined);
    socket.emit("placeInfluence", { roomCode: game.roomCode, constituencyId, count: 1 }, handleGameResult);
  }

  function buyPower() {
    if (!game) return;
    setError(undefined);
    socket.emit("buyPower", { roomCode: game.roomCode }, handleGameResult);
  }

  function shiftMajorityVoter() {
    if (!game) return;
    setError(undefined);
    socket.emit("shiftMajorityVoter", {
      roomCode: game.roomCode,
      fromConstituencyId: majoritySourceId,
      toConstituencyId: majorityDestinationId,
    }, handleGameResult);
  }

  function triggerPower(powerCardId: string) {
    if (!game) return;
    setError(undefined);
    socket.emit("usePower", {
      roomCode: game.roomCode,
      powerCardId,
      targetPlayerId: powerTargetPlayerId || undefined,
      constituencyId: powerTargetConstituencyId || undefined,
    }, handleGameResult);
  }

  function triggerResourceAbility(resourceType: ResourceType) {
    if (!game) return;
    setError(undefined);
    socket.emit("useResourceAbility", {
      roomCode: game.roomCode,
      resourceType,
      targetPlayerId: powerTargetPlayerId || undefined,
      constituencyId: powerTargetConstituencyId || undefined,
    }, handleGameResult);
  }

  function handleGameResult(result: { ok: true; data: GameView } | { ok: false; error: string }) {
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setGame(result.data);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b13] px-5 py-5 text-white sm:px-8 lg:px-10">
      <div aria-hidden="true" className="paper-texture absolute inset-0" />
      <div aria-hidden="true" className="absolute right-[-15rem] top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-[#c58e30]/[0.1] blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="THRONE home">
            <span className="flex size-8 items-center justify-center border border-[#d9ae4d]/60 bg-[#d9ae4d]/10 text-[#e6c16d]">
              <Crown size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-bold tracking-[0.2em] text-[#f9edcf]">THRONE</span>
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.13em] text-[#aab5c3]">
            <Radio className={game ? "text-[#67c197]" : "animate-soft-pulse text-[#d9ae4d]"} size={14} aria-hidden="true" />
            {game ? "LIVE GAME" : "CONNECTING"}
          </span>
        </header>

        <section className="py-10 sm:py-14">
          <div className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">ROOM {normalizedRoomCode}</p>
              <h1 className="mt-2 font-serif text-4xl font-bold text-[#f7ebd3] sm:text-5xl">The campaign is underway.</h1>
            </div>
            {game ? (
              <div className="text-left sm:text-right">
                <p className="text-xs font-bold tracking-[0.16em] text-[#8996a6]">ROUND {game.currentRound} OF {game.maxRounds}</p>
                <p className="mt-1 text-sm text-[#e2bf6d]">{phaseLabels[game.phase]}</p>
              </div>
            ) : null}
          </div>

          {error ? (
            <div role="alert" className="fixed left-1/2 top-5 z-50 w-[min(34rem,calc(100%-2.5rem))] -translate-x-1/2 border border-[#c95158]/40 bg-[#241217] px-10 py-3 text-center text-sm text-[#f2c2c4] shadow-2xl">
              {error}
              <button type="button" onClick={() => setError(undefined)} className="absolute right-3 top-2.5 text-[#f2c2c4] transition hover:text-white" aria-label="Close error message"><X size={18} /></button>
            </div>
          ) : null}

          {game?.currentDecisionResolution && !latestCardActivity && !error && dismissedNoticeId !== decisionNoticeId ? (() => {
            const decisionMaker = game.players.find((player) => player.id === game.currentDecisionResolution?.playerId);
            const rewards = Object.entries(game.currentDecisionResolution.awarded)
              .filter(([, amount]) => amount > 0)
              .map(([resource, amount]) => `${amount} ${resource}`)
              .join(" · ");
            return (
              <section className="fixed left-1/2 top-5 z-40 w-[min(38rem,calc(100%-2.5rem))] -translate-x-1/2 border border-[#d9ae4d]/45 bg-[#101827] px-10 py-4 text-center shadow-2xl">
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#d9ae4d]">POLITICAL DECISION MADE</p>
                <p className="mt-1 text-sm text-[#f7ebd3]"><span className="font-semibold">{decisionMaker?.username ?? "A player"}</span> chose {game.currentDecisionResolution.choice.toUpperCase()}.</p>
                <p className="mt-1 text-xs text-[#b8c2cf]">Received {rewards} and a {game.currentDecisionResolution.dominantResource} resource card.</p>
                <button type="button" onClick={() => setDismissedNoticeId(decisionNoticeId)} className="absolute right-3 top-3 text-[#b8c2cf] transition hover:text-white" aria-label="Close decision notification"><X size={18} /></button>
              </section>
            );
          })() : null}

          {latestCardActivity && !error && dismissedNoticeId !== latestCardActivity.id ? (
            <section className="fixed left-1/2 top-5 z-40 w-[min(38rem,calc(100%-2.5rem))] -translate-x-1/2 border border-[#d9ae4d]/45 bg-[#101827] px-10 py-4 text-center shadow-2xl">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#d9ae4d]">CARD ACTIVITY</p>
              <p className="mt-1 text-sm text-[#f7ebd3]">{latestCardActivity.message}</p>
              <button type="button" onClick={() => setDismissedNoticeId(latestCardActivity.id)} className="absolute right-3 top-3 text-[#b8c2cf] transition hover:text-white" aria-label="Close card activity notification"><X size={18} /></button>
            </section>
          ) : null}

          {!game ? (
            <Card className="mt-7 p-8 text-center text-sm text-[#aab5c3]">
              Restoring the authoritative game state…
            </Card>
          ) : (
            <>
              <div className="mt-7 grid gap-5 lg:grid-cols-[1.45fr_0.8fr]">
              <Card className="relative overflow-hidden p-6 sm:p-8">
                <div aria-hidden="true" className="absolute -right-10 -top-8 text-[#d9ae4d]/10">
                  <Flag size={160} strokeWidth={0.8} />
                </div>
                <div className="relative">
                  <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">CURRENT TURN</p>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="flex size-12 items-center justify-center rounded-full border border-[#d9ae4d]/40 bg-[#d9ae4d]/10 text-xl font-bold text-[#edca76]">
                      {currentPlayer?.username.slice(0, 1).toUpperCase() ?? "?"}
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{currentPlayer?.username ?? "Awaiting a player"}</h2>
                      <p className="mt-1 text-sm text-[#aab5c3]">{isYourTurn ? "Your political decision is next." : "The table is waiting for their decision."}</p>
                    </div>
                  </div>
                  <div className="mt-8 border-y border-white/[0.08] py-5 text-sm leading-6 text-[#9da9b9]">
                    {game.currentDecision ? (
                      <>
                        <p className="text-xs font-bold tracking-[0.15em] text-[#d9ae4d]">POLITICAL DECISION</p>
                        <h3 className="mt-2 text-lg font-semibold text-[#f5ead5]">{game.currentDecision.title}</h3>
                        <p className="mt-2">{game.currentDecision.scenario}</p>
                        {isYourTurn && game.phase === "POLITICAL_DECISION" ? (
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" onClick={() => makeDecision("Yes")}>YES</Button>
                            <Button size="sm" variant="outline" onClick={() => makeDecision("No")}>NO</Button>
                          </div>
                        ) : null}
                      </>
                    ) : "The next political decision is being prepared."}
                  </div>
                  <Button className="mt-7 w-full sm:w-auto" onClick={endTurn} disabled={!isYourTurn || isEndingTurn}>
                    <Hourglass size={17} aria-hidden="true" />
                    {isEndingTurn ? "ENDING TURN…" : isYourTurn ? "END TURN" : "WAIT FOR YOUR TURN"}
                  </Button>
                </div>
              </Card>

              <div className="space-y-5">
                <Card className="p-5">
                  <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#e9dcc3]">
                    <UsersRound size={17} className="text-[#d9ae4d]" aria-hidden="true" /> TURN ORDER
                  </h2>
                  <div className="mt-4 space-y-2">
                    {game.players.map((player, index) => (
                      <div
                        key={player.id}
                        className={player.id === game.currentPlayerId ? "flex items-center justify-between border border-[#d9ae4d]/35 bg-[#d9ae4d]/10 px-3 py-2.5" : "flex items-center justify-between border border-white/[0.07] px-3 py-2.5"}
                      >
                        <span className="flex items-center gap-2.5 text-sm">
                          <span className="text-xs font-bold text-[#d9ae4d]">0{index + 1}</span>
                          <span className="font-medium text-white">{player.username}{player.id === session?.playerId ? " (you)" : ""}</span>
                        </span>
                        <span className={player.isConnected ? "size-2 rounded-full bg-[#67c197]" : "size-2 rounded-full bg-[#c95158]"} aria-label={player.isConnected ? "Connected" : "Disconnected"} />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#e9dcc3]">
                    <CircleDotDashed size={17} className="text-[#d9ae4d]" aria-hidden="true" /> CAMPAIGN LOG
                  </h2>
                  <ol className="mt-4 space-y-3">
                    {game.actionLog.slice(-4).reverse().map((entry) => (
                      <li key={entry.id} className="border-l border-[#d9ae4d]/35 pl-3 text-sm leading-5 text-[#aab5c3]">
                        {entry.message}
                      </li>
                    ))}
                  </ol>
                </Card>
              </div>
            </div>

              <Card className="mt-5 p-5 sm:p-7">
                <ElectionBoard board={game.board} players={game.players} currentPlayerId={game.currentPlayerId} />
              </Card>

              <Card className="mt-5 p-5 sm:p-7">
                <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">YOUR POLITICAL CARDS</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#d7e0ea]">
                  {Object.entries(game.yourCards.resourceCards).map(([resource, amount]) => (
                    <span key={resource} className="border border-white/[0.1] bg-white/[0.04] px-2 py-1 capitalize">{resource} cards: {amount}</span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#8290a1]">Every 3 matching resource cards award 4 matching resources. Every 8 matching cards unlock one ideology ability charge.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.entries(game.yourCards.resourceAbilityCharges) as [ResourceType, number][]).filter(([, charges]) => charges > 0).map(([resource, charges]) => (
                    <Button key={resource} size="sm" variant="outline" disabled={!isYourTurn} onClick={() => triggerResourceAbility(resource)}>
                      USE {resource.toUpperCase()} ({charges})
                    </Button>
                  ))}
                </div>
                {game.yourCards.powerCards.length > 0 ? (
                  <>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {game.yourCards.powerCards.map((card) => (
                        <article key={card.id} className="border border-[#d9ae4d]/20 bg-[#0b111d]/80 p-4">
                          <p className="text-sm font-semibold text-[#f5ead5]">{card.name}</p>
                          <p className="mt-2 text-xs leading-5 text-[#95a2b2]">{card.description}</p>
                          <Button size="sm" className="mt-4" disabled={!isYourTurn} onClick={() => triggerPower(card.id)}>USE POWER</Button>
                        </article>
                      ))}
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <select value={powerTargetPlayerId} onChange={(event) => setPowerTargetPlayerId(event.target.value)} className="border border-white/[0.12] bg-[#0b111d] px-3 py-2 text-sm text-white">
                        <option value="">Choose rival player</option>
                        {game.players.filter((player) => player.id !== session?.playerId).map((player) => <option key={player.id} value={player.id}>{player.username}</option>)}
                      </select>
                      <select value={powerTargetConstituencyId} onChange={(event) => setPowerTargetConstituencyId(event.target.value)} className="border border-white/[0.12] bg-[#0b111d] px-3 py-2 text-sm text-white">
                        <option value="">Choose constituency</option>
                        {game.board.map((constituency) => <option key={constituency.id} value={constituency.id}>{constituency.name}</option>)}
                      </select>
                    </div>
                  </>
                ) : <p className="mt-5 text-sm text-[#8290a1]">You do not hold a sealed power card.</p>}
              </Card>

              <Card className="mt-5 p-5 sm:p-7">
                <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">SHARED VOTER MARKET</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#f7ebd3]">Choose your campaign reach.</h2>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#d7e0ea]">
                  {Object.entries(game.yourCards.resources).map(([resource, amount]) => (
                    <span key={resource} className="border border-white/[0.1] bg-white/[0.04] px-2 py-1 capitalize">{resource}: {amount}</span>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {game.yourCards.voterOffers.map((card) => (
                    <article key={card.id} className="border border-white/[0.09] bg-[#0b111d]/80 p-4">
                      <p className="text-xs font-bold tracking-[0.14em] text-[#a5b1c1]">VOTER OFFER</p>
                      <p className="mt-3 text-2xl font-semibold text-[#e9c570]">+{card.voters} voter{card.voters === 1 ? "" : "s"}</p>
                      <p className="mt-3 text-xs leading-5 text-[#95a2b2]">Cost: {Object.entries(card.cost).filter(([, value]) => value > 0).map(([resource, value]) => `${value} ${resource}`).join(" · ")}</p>
                      <Button size="sm" variant="outline" className="mt-4 w-full" disabled={!isYourTurn || game.phase !== "ACTION_PHASE" || game.turnState.actionTaken} onClick={() => buyVoter(card.id)}>BUY OFFER</Button>
                    </article>
                  ))}
                </div>
                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center">
                  <p className="text-xs text-[#8290a1]">Everyone sees these offers. Bought offers leave the market; after all three sell, three new offers arrive.</p>
                  <Button size="sm" variant="ghost" className="w-fit px-0 text-[#e5c36e]" disabled={!isYourTurn || game.phase !== "ACTION_PHASE" || game.turnState.actionTaken} onClick={buyPower}>BUY POWER: 1 EACH RESOURCE</Button>
                </div>
              </Card>

              <Card className="mt-5 p-5 sm:p-7">
                <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">SHARED POWER MARKET</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#f7ebd3]">{game.powerOffer.name}</h2>
                <p className="mt-3 text-sm leading-6 text-[#aab5c3]">{game.powerOffer.description}</p>
                <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-[#e5c36e]">PRICE: 1 CAPITALISM · 1 COMMUNISM · 1 SOCIALISM · 1 FASCISM</p>
                <Button className="mt-4" disabled={!isYourTurn || game.phase !== "ACTION_PHASE" || game.turnState.actionTaken} onClick={buyPower}>BUY THIS POWER</Button>
                <p className="mt-3 text-xs text-[#8290a1]">Everyone sees this power. When bought, it moves privately to the buyer and a new shared power appears.</p>
              </Card>

              {isYourTurn && game.phase === "ACTION_PHASE" ? (
                <Card className="mt-5 p-5 sm:p-7">
                  <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">MAJORITY SHIFT</p>
                  <p className="mt-2 text-sm text-[#aab5c3]">Once per turn, move one of your voters from a constituency you control with more than half of its voters to an adjacent constituency.</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <select value={majoritySourceId} onChange={(event) => setMajoritySourceId(event.target.value)} className="border border-white/[0.12] bg-[#0b111d] px-3 py-2 text-sm text-white">
                      <option value="">Majority constituency</option>
                      {game.board.filter((constituency) => constituency.controllingPlayerId === session?.playerId).map((constituency) => <option key={constituency.id} value={constituency.id}>{constituency.name}</option>)}
                    </select>
                    <select value={majorityDestinationId} onChange={(event) => setMajorityDestinationId(event.target.value)} className="border border-white/[0.12] bg-[#0b111d] px-3 py-2 text-sm text-white">
                      <option value="">Adjacent destination</option>
                      {game.board.find((constituency) => constituency.id === majoritySourceId)?.adjacentConstituencyIds.map((id) => {
                        const constituency = game.board.find((candidate) => candidate.id === id);
                        return constituency ? <option key={id} value={id}>{constituency.name}</option> : null;
                      })}
                    </select>
                  </div>
                  <Button className="mt-3" variant="outline" disabled={game.turnState.majorityShiftTaken || !majoritySourceId || !majorityDestinationId} onClick={shiftMajorityVoter}>
                    {game.turnState.majorityShiftTaken ? "MAJORITY SHIFT USED" : "SHIFT 1 VOTER"}
                  </Button>
                </Card>
              ) : null}

              {isYourTurn && game.phase === "INFLUENCE" && game.yourCards.pendingVoters > 0 ? (
                <Card className="mt-5 border-[#d9ae4d]/35 p-5 sm:p-7">
                  <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">PLACE INFLUENCE</p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-[#f7ebd3]">Deploy {game.yourCards.pendingVoters} voter{game.yourCards.pendingVoters === 1 ? "" : "s"}.</h2>
                  <p className="mt-2 text-sm text-[#aab5c3]">Choose a constituency for one voter at a time. You can split them across the board.</p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {game.board.map((constituency) => <Button key={constituency.id} variant="outline" size="sm" onClick={() => placeInfluence(constituency.id)}>PLACE 1 IN {constituency.name}</Button>)}
                  </div>
                </Card>
              ) : null}
            </>
          )}

          {game?.status === "FINISHED" ? (
            <Card className="mt-6 border-[#d9ae4d]/35 p-6 text-center">
              <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">ELECTION RESULTS</p>
              <h2 className="mt-3 font-serif text-3xl font-bold text-[#f7ebd3]">
                {game.electionResults?.isTie ? "The mandate is tied." : "A new leader has risen."}
              </h2>
              <p className="mt-3 text-sm text-[#aab5c3]">
                {game.electionResults?.isTie
                  ? "No single campaign secured the mandate by constituency weight."
                  : `${game.players.find((player) => player.id === game.electionResults?.winnerPlayerIds[0])?.username ?? "The winner"} claims the THRONE.`}
              </p>
              <div className="mx-auto mt-6 max-w-2xl overflow-hidden border border-white/[0.09] text-left">
                {game.electionResults?.standings.map((standing, index) => {
                  const player = game.players.find((candidate) => candidate.id === standing.playerId);
                  const isWinner = game.electionResults?.winnerPlayerIds.includes(standing.playerId);
                  return (
                    <div key={standing.playerId} className={isWinner ? "flex items-center justify-between gap-4 border-b border-[#d9ae4d]/20 bg-[#d9ae4d]/10 px-4 py-3 last:border-b-0" : "flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3 last:border-b-0"}>
                      <span className="text-sm font-semibold text-white">{index + 1}. {player?.username ?? "Unknown player"}</span>
                      <span className="text-right text-xs text-[#c8d1dc]">{standing.weightConstituenciesControlled} seats · {standing.constituenciesControlled} constituencies</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  );
}
