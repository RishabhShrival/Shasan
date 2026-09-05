"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Crown, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveLobbySession } from "@/lib/lobby-session";
import { getSocket } from "@/lib/socket";

type PendingAction = "create" | "join" | null;

export function LandingActions() {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const router = useRouter();

  function createGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();

    setPendingAction("create");
    setNotice(null);
    const socket = getSocket();
    socket.connect();
    socket.emit("createRoom", { username }, (result) => {
      setPendingAction(null);
      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      saveLobbySession({
        roomCode: result.data.room.code,
        playerId: result.data.playerId,
        playerToken: result.data.playerToken,
        username: result.data.username,
      });
      router.push(`/lobby/${result.data.room.code}`);
    });
  }

  function joinGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const roomCode = String(formData.get("roomCode") ?? "").trim().toUpperCase();
    const username = String(formData.get("username") ?? "").trim();

    setPendingAction("join");
    setNotice(null);
    const socket = getSocket();
    socket.connect();
    socket.emit("joinRoom", { roomCode, username }, (result) => {
      setPendingAction(null);
      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      saveLobbySession({
        roomCode: result.data.room.code,
        playerId: result.data.playerId,
        playerToken: result.data.playerToken,
        username: result.data.username,
      });
      router.push(`/lobby/${result.data.room.code}`);
    });
  }

  return (
    <section aria-label="Start a game" className="mx-auto grid w-full max-w-5xl gap-5 md:grid-cols-2">
      <Card className="group relative overflow-hidden p-6 md:p-7">
        <div className="absolute -right-6 -top-7 text-[#d9ae4d]/10 transition-transform duration-500 group-hover:scale-110">
          <Crown aria-hidden="true" size={132} strokeWidth={1} />
        </div>
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">ASSEMBLE YOUR CAMPAIGN</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Create a game</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#9eabba]">
            Open a private table, choose your name, and invite up to four rivals.
          </p>
          <form className="mt-6 flex gap-2" onSubmit={createGame}>
            <Input aria-label="Your guest name" maxLength={20} minLength={2} name="username" placeholder="Your guest name" required />
            <Button type="submit" aria-label="Create game" disabled={pendingAction === "create"}>
              Create <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </Card>

      <Card className="group relative overflow-hidden p-6 md:p-7">
        <div className="absolute -right-7 -top-7 text-[#c23a41]/10 transition-transform duration-500 group-hover:scale-110">
          <UsersRound aria-hidden="true" size={132} strokeWidth={1} />
        </div>
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.18em] text-[#d8a4a6]">TAKE YOUR SEAT</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Join a game</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#9eabba]">
            Enter the six-character room code shared by the host to enter the campaign.
          </p>
          <form className="mt-6 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={joinGame}>
            <Input
              aria-label="Room code"
              className="uppercase tracking-[0.15em]"
              maxLength={6}
              minLength={6}
              name="roomCode"
              placeholder="ROOM CODE"
              required
            />
            <Input aria-label="Your guest name" maxLength={20} minLength={2} name="username" placeholder="Your guest name" required />
            <Button type="submit" variant="outline" disabled={pendingAction === "join"}>
              Join <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </Card>

      {notice ? (
        <p aria-live="polite" className="md:col-span-2 -mt-1 text-center text-sm text-[#bac4d1]">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
