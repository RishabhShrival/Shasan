import { Crown, Mail, ShieldCheck, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { RESOURCE_TYPES, type GameView } from "@/game/types";
import { IDEOLOGY_STYLES, playerColor } from "@/lib/ideology";

import { IdeologyBar } from "./resource-chips";

/** Public standings: total voters, majorities and ideology profile for every player. */
export function PlayersPanel({ game, viewerId }: { game: GameView; viewerId?: string }) {
  const rows = game.players
    .map((player, index) => ({ player, index, stats: game.playerStats.find((entry) => entry.playerId === player.id)! }))
    .sort((left, right) => right.stats.seatsControlled - left.stats.seatsControlled || right.stats.totalVoters - left.stats.totalVoters);
  const you = game.playerStats.find((entry) => entry.playerId === viewerId);

  return (
    <Card className="p-5">
      <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><Users size={15} aria-hidden="true" /> TOTAL VOTERS</p>
      {you ? (
        <div className="mt-3 flex items-end justify-between rounded-sm border border-[#d9ae4d]/25 bg-[#d9ae4d]/[0.06] px-3 py-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#c9b27a]">YOUR VOTERS</p>
            <p className="text-3xl font-semibold text-[#f7ebd3] tabular-nums">{you.totalVoters}</p>
          </div>
          <p className="text-right text-[11px] text-[#aab5c3]">{you.constituenciesControlled} majorities<br />{you.seatsControlled} seats won</p>
        </div>
      ) : null}

      <ol className="mt-3 space-y-2">
        {rows.map(({ player, index, stats }) => {
          const isTurn = player.id === game.currentPlayerId && game.status === "PLAYING";
          return (
            <li key={player.id} className={`rounded-sm border px-3 py-2 transition-colors ${isTurn ? "border-[#d9ae4d]/45 bg-[#d9ae4d]/[0.07]" : "border-white/[0.07]"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: playerColor(index) }} />
                  <span className="truncate font-medium text-white">{player.username}{player.id === viewerId ? " (you)" : ""}</span>
                  {!player.isConnected ? <span className="text-[9px] font-bold text-[#f2a3a8]">OFFLINE</span> : null}
                  {isTurn ? <span className="text-[9px] font-bold tracking-[0.1em] text-[#d9ae4d]">TURN</span> : null}
                </span>
                <span className="text-lg font-semibold tabular-nums text-[#f7ebd3]">{stats.totalVoters}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#8d9aab]">
                <span className="inline-flex items-center gap-1"><Crown size={10} aria-hidden="true" /> {stats.constituenciesControlled} maj · {stats.seatsControlled} seats</span>
                <span>{stats.reserveVoters} reserve</span>
                <span>{stats.resourceCount} res</span>
                <span className="inline-flex items-center gap-1"><Mail size={10} aria-hidden="true" /> {stats.sealedCardCount}</span>
                {stats.votersShielded ? <span className="inline-flex items-center gap-1 text-[#9fcaff]"><ShieldCheck size={10} aria-hidden="true" /> shielded</span> : null}
              </div>
              <IdeologyBar profile={stats.ideologyProfile} className="mt-1.5" />
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
        {RESOURCE_TYPES.map((type) => (
          <span key={type} className="inline-flex items-center gap-1" style={{ color: IDEOLOGY_STYLES[type].text }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: IDEOLOGY_STYLES[type].color }} /> {IDEOLOGY_STYLES[type].label}
          </span>
        ))}
      </div>
    </Card>
  );
}
