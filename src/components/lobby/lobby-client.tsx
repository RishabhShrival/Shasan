"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clipboard, Crown, DoorOpen, Radio, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LobbyRoom } from "@/game/types/lobby";
import { clearLobbySession, getLobbySession, saveLobbySession, type LobbySession } from "@/lib/lobby-session";
import { getSocket } from "@/lib/socket";

interface LobbyClientProps {
  roomCode: string;
}

export function LobbyClient({ roomCode }: LobbyClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState<LobbyRoom>();
  const [session, setSession] = useState<LobbySession>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const socket = useMemo(() => getSocket(), []);
  const normalizedRoomCode = roomCode.toUpperCase();

  const restoreSession = useCallback(() => {
    const savedSession = getLobbySession();
    if (!savedSession || savedSession.roomCode !== normalizedRoomCode) {
      setError("This browser does not have a seat reserved in this lobby. Join from the home page.");
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
      (result) => {
        if (!result.ok) {
          clearLobbySession();
          setError(result.error);
          return;
        }

        const restoredSession = {
          roomCode: result.data.room.code,
          playerId: result.data.playerId,
          playerToken: result.data.playerToken,
          username: result.data.username,
        };
        setSession(restoredSession);
        saveLobbySession(restoredSession);
        setRoom(result.data.room);
      },
    );
  }, [normalizedRoomCode, socket]);

  useEffect(() => {
    const onRoomUpdated = (updatedRoom: LobbyRoom) => setRoom(updatedRoom);
    const onGameStarted = ({ roomCode: startedRoomCode }: { roomCode: string }) => {
      if (startedRoomCode === normalizedRoomCode) {
        router.push(`/game/${startedRoomCode}`);
      }
    };
    const onGameError = ({ message }: { message: string }) => setError(message);

    socket.on("roomUpdated", onRoomUpdated);
    socket.on("gameStarted", onGameStarted);
    socket.on("gameError", onGameError);
    socket.on("connect", restoreSession);
    socket.connect();

    if (socket.connected) {
      restoreSession();
    }

    return () => {
      socket.off("roomUpdated", onRoomUpdated);
      socket.off("gameStarted", onGameStarted);
      socket.off("gameError", onGameError);
      socket.off("connect", restoreSession);
    };
  }, [normalizedRoomCode, restoreSession, router, socket]);

  const currentPlayer = room?.players.find((player) => player.id === session?.playerId);
  const isHost = room?.hostPlayerId === session?.playerId;
  const allPlayersReady = room?.players.every((player) => player.isReady) ?? false;
  const canStart = Boolean(isHost && room && room.players.length >= 2 && allPlayersReady);

  function toggleReady() {
    if (!room || !currentPlayer) {
      return;
    }

    setError(undefined);
    socket.emit("setReady", { roomCode: room.code, isReady: !currentPlayer.isReady }, (result) => {
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function startGame() {
    if (!room) {
      return;
    }

    setIsStarting(true);
    setError(undefined);
    socket.emit("startGame", { roomCode: room.code }, (result) => {
      if (!result.ok) {
        setIsStarting(false);
        setError(result.error);
      }
    });
  }

  function leaveRoom() {
    if (!room) {
      clearLobbySession();
      router.push("/");
      return;
    }

    socket.emit("leaveRoom", { roomCode: room.code }, () => {
      clearLobbySession();
      router.push("/");
    });
  }

  async function copyRoomCode() {
    await navigator.clipboard.writeText(normalizedRoomCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b13] px-5 py-5 text-white sm:px-8 lg:px-10">
      <div aria-hidden="true" className="paper-texture absolute inset-0" />
      <div aria-hidden="true" className="absolute left-1/2 top-[-28rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-[#c58e30]/[0.1] blur-3xl" />
      <div className="relative mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="THRONE home">
            <span className="flex size-8 items-center justify-center border border-[#d9ae4d]/60 bg-[#d9ae4d]/10 text-[#e6c16d]">
              <Crown size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="font-serif text-lg font-bold tracking-[0.2em] text-[#f9edcf]">THRONE</span>
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.13em] text-[#aab5c3]">
            <Radio className={room ? "text-[#67c197]" : "animate-soft-pulse text-[#d9ae4d]"} size={14} aria-hidden="true" />
            {room ? "LIVE LOBBY" : "CONNECTING"}
          </span>
        </header>

        <section className="py-12 sm:py-16">
          <p className="text-center text-xs font-bold tracking-[0.2em] text-[#d9ae4d]">PRIVATE CAMPAIGN TABLE</p>
          <h1 className="mt-3 text-center font-serif text-5xl font-bold text-[#f7ebd3] sm:text-6xl">The lobby is open.</h1>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-6 text-[#aab5c3]">
            Assemble your rivals. Once every player is ready, the host may begin the campaign.
          </p>

          <Card className="mx-auto mt-9 max-w-xl p-5 sm:p-7">
            <p className="text-center text-xs font-bold tracking-[0.18em] text-[#aab5c3]">ROOM CODE</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="font-mono text-4xl font-bold tracking-[0.25em] text-[#f2cf7d] sm:text-5xl">{normalizedRoomCode}</span>
              <Button variant="outline" size="sm" onClick={copyRoomCode} aria-label="Copy room code">
                {copied ? <Check size={15} aria-hidden="true" /> : <Clipboard size={15} aria-hidden="true" />}
                {copied ? "COPIED" : "COPY"}
              </Button>
            </div>
          </Card>

          {error ? (
            <p role="alert" className="mx-auto mt-5 max-w-xl border border-[#c95158]/40 bg-[#c95158]/10 px-4 py-3 text-center text-sm text-[#f2c2c4]">
              {error}
            </p>
          ) : null}

          <section className="mx-auto mt-6 max-w-3xl">
            <div className="flex items-center justify-between px-1">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#e9dcc3]">
                <UsersRound size={17} className="text-[#d9ae4d]" aria-hidden="true" /> CAMPAIGN TABLE
              </h2>
              <span className="text-xs font-semibold tracking-[0.12em] text-[#91a0b1]">
                {room?.players.length ?? 0} / {room?.maxPlayers ?? 5} PLAYERS
              </span>
            </div>

            <div className="mt-3 overflow-hidden border border-white/[0.09] bg-[#101827]/80">
              {room?.players.map((player, index) => {
                const isYou = player.id === session?.playerId;
                const isPlayerHost = player.id === room.hostPlayerId;
                return (
                  <div key={player.id} className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 last:border-b-0 sm:px-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#d9ae4d]/30 bg-[#d9ae4d]/10 text-xs font-bold text-[#e7c36d]">
                          {index + 1}
                        </span>
                        <span className="truncate font-semibold text-white">{player.username}{isYou ? " (you)" : ""}</span>
                        {isPlayerHost ? <Crown size={15} className="shrink-0 text-[#d9ae4d]" aria-label="Host" /> : null}
                      </div>
                      {!player.isConnected ? <p className="ml-9 mt-1 text-xs text-[#c48d90]">Reconnecting…</p> : null}
                    </div>
                    <span className={player.isReady ? "text-xs font-bold tracking-[0.13em] text-[#6cc99b]" : "text-xs font-bold tracking-[0.13em] text-[#8894a4]"}>
                      {player.isReady ? "READY" : "WAITING"}
                    </span>
                  </div>
                );
              })}
              {!room ? <div className="px-5 py-8 text-center text-sm text-[#93a0b0]">Restoring your seat at the table…</div> : null}
            </div>
          </section>

          <div className="mx-auto mt-7 flex max-w-3xl flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={leaveRoom} className="w-full justify-center text-[#b7c0cd] sm:w-auto">
              <DoorOpen size={17} aria-hidden="true" /> LEAVE LOBBY
            </Button>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button variant={currentPlayer?.isReady ? "outline" : "default"} onClick={toggleReady} disabled={!currentPlayer} className="w-full sm:w-auto">
                {currentPlayer?.isReady ? "NOT READY" : "I'M READY"}
              </Button>
              {isHost ? (
                <Button onClick={startGame} disabled={!canStart || isStarting} className="w-full sm:w-auto">
                  {isStarting ? "STARTING…" : "START GAME"}
                </Button>
              ) : null}
            </div>
          </div>

          {isHost && room && !canStart ? (
            <p className="mt-4 text-center text-xs text-[#8e9baa]">At least two players must join, and every player must be ready.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
