import { Crown, Lock, MapPinned, ShieldCheck } from "lucide-react";

import type { Constituency, GamePlayer } from "@/game/types";
import { playerColor } from "@/lib/ideology";
import { cn } from "@/lib/utils";

interface ElectionBoardProps {
  board: Constituency[];
  players: GamePlayer[];
  viewerId?: string;
  /** Voters the viewer can place right now (0 when it is not their action phase). */
  placeableVoters: number;
  onPlace: (constituencyId: string, count: number) => void;
  highlightIds?: Record<string, "source" | "target">;
}

export function ElectionBoard({ board, players, viewerId, placeableVoters, onPlace, highlightIds = {} }: ElectionBoardProps) {
  const indexOf = (playerId: string) => players.findIndex((player) => player.id === playerId);
  const nameOf = (playerId?: string) => (playerId === viewerId ? "You" : players.find((player) => player.id === playerId)?.username ?? "—");
  const decided = board.filter((constituency) => constituency.controllingPlayerId).length;
  const rows = Math.max(...board.map((constituency) => constituency.row)) + 1;
  const cols = Math.max(...board.map((constituency) => constituency.col)) + 1;

  return (
    <section aria-label="Election board">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">THE ELECTORAL MAP</p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#f7ebd3] sm:text-3xl">
            {decided} of {board.length} constituencies decided
          </h2>
          <p className="mt-1 text-xs text-[#8d9aab]">The election ends the moment every constituency has a majority.</p>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-[#96a3b3]"><MapPinned size={15} className="text-[#d9ae4d]" aria-hidden="true" /> Touching tiles are adjacent.</p>
      </div>

      <div
        className="mt-4 grid gap-1.5 sm:mt-5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, auto)` }}
      >
        {board.map((constituency) => {
          const holder = constituency.controllingPlayerId;
          const holderColor = holder ? playerColor(indexOf(holder)) : undefined;
          const free = constituency.seats - constituency.totalVoters;
          const canPlace = placeableVoters > 0 && free > 0 && !constituency.lockedByPlayerId;
          const highlight = highlightIds[constituency.id];
          const seatOwners = players
            .map((player, index) => ({ color: playerColor(index), count: constituency.voterCounts[player.id] ?? 0 }))
            .sort((left, right) => right.count - left.count)
            .flatMap(({ color, count }) => Array<string>(count).fill(color));

          return (
            <article
              key={constituency.id}
              className={cn(
                "relative flex min-h-[11rem] min-w-0 flex-col rounded-sm border bg-[#0b111d]/95 p-2 transition-all duration-500 sm:min-h-[13rem] sm:p-4",
                !holder && "border-white/[0.09]",
                highlight === "source" && "ring-2 ring-[#d9ae4d]",
                highlight === "target" && "ring-2 ring-[#d9ae4d]/50",
              )}
              style={{
                gridRow: constituency.row + 1,
                gridColumn: constituency.col + 1,
                ...(holderColor ? { borderColor: holderColor, boxShadow: `inset 0 0 0 1px ${holderColor}66, 0 0 28px ${holderColor}22`, background: `linear-gradient(160deg, ${holderColor}1f, #0b111df2 55%)` } : {}),
              }}
            >
              <div className="flex flex-col-reverse items-start justify-between gap-1 sm:flex-row sm:gap-2">
                <div className="min-w-0">
                  <p className="hidden text-[9px] font-bold tracking-[0.14em] text-[#7f8c9d] sm:block">{constituency.region.toUpperCase()}</p>
                  <h3 className="mt-0.5 break-words text-xs font-semibold leading-tight text-white sm:text-base">{constituency.name}</h3>
                </div>
                <span className="shrink-0 rounded-sm border border-[#d9ae4d]/30 bg-[#d9ae4d]/10 px-1 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[#e5c36e] sm:px-1.5 sm:text-[10px]">
                  {constituency.seats} SEATS
                </span>
              </div>

              <div className="mt-2 flex flex-col items-start justify-between gap-0.5 text-[10px] sm:flex-row sm:items-center sm:text-[11px]">
                <span className="font-semibold text-[#c7d0db]">Majority: {constituency.majorityThreshold} / {constituency.seats}</span>
                {holder ? (
                  <span className="inline-flex items-center gap-1 font-bold" style={{ color: holderColor }}>
                    <Crown size={13} aria-hidden="true" /> {nameOf(holder)}
                  </span>
                ) : (
                  <span className="font-semibold text-[#7f8c9d]">No Majority</span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-[3px]" aria-label={`${constituency.totalVoters} of ${constituency.seats} seats filled`}>
                {Array.from({ length: constituency.seats }, (_, seat) => (
                  <span
                    key={seat}
                    className={cn("size-2 rounded-full border sm:size-3", seat === constituency.majorityThreshold - 1 && "outline outline-1 outline-offset-1 outline-[#d9ae4d]/40")}
                    style={seatOwners[seat] ? { backgroundColor: seatOwners[seat], borderColor: seatOwners[seat] } : { borderColor: "rgb(255 255 255 / 0.18)" }}
                  />
                ))}
              </div>

              <ul className="mt-2 space-y-0.5 text-[11px] text-[#aeb8c4]">
                {players.map((player, index) => {
                  const count = constituency.voterCounts[player.id] ?? 0;
                  if (count === 0) return null;
                  return (
                    <li key={player.id} className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: playerColor(index) }} />
                        {player.id === viewerId ? "You" : player.username}
                      </span>
                      <span className="font-semibold text-white">{count}</span>
                    </li>
                  );
                })}
                {constituency.totalVoters === 0 ? <li className="text-[#6d7a8b]">No voters yet</li> : null}
              </ul>

              <div className="mt-auto flex flex-wrap items-center gap-1 pt-2 text-[10px]">
                {free === 0 && !holder ? (
                  <span className="rounded-sm bg-[#c95158]/15 px-1 font-bold text-[#f2a3a8]" title="Full with no majority: trailing voters return to reserve at the end of the turn">HUNG · RE-POLL</span>
                ) : (
                  <span className="text-[#7f8c9d]">{free} free</span>
                )}
                {constituency.protectedByPlayerId ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-[#5aa7ff]/10 px-1 text-[#9fcaff]" title="Security Cover">
                    <ShieldCheck size={11} aria-hidden="true" /> {nameOf(constituency.protectedByPlayerId)}
                  </span>
                ) : null}
                {constituency.lockedByPlayerId ? (
                  <span className="inline-flex items-center gap-1 rounded-sm bg-[#c95158]/15 px-1 text-[#f2a3a8]" title="Section 144: no voters can be added">
                    <Lock size={11} aria-hidden="true" /> 144
                  </span>
                ) : null}
                {canPlace ? (
                  <span className="ml-auto flex gap-1">
                    <button type="button" onClick={() => onPlace(constituency.id, 1)} className="rounded-sm border border-[#d9ae4d]/60 bg-[#d9ae4d]/10 px-1.5 py-0.5 font-bold text-[#f3d584] transition hover:bg-[#d9ae4d]/25">+1</button>
                    {Math.min(placeableVoters, free) > 1 ? (
                      <button type="button" onClick={() => onPlace(constituency.id, Math.min(placeableVoters, free))} className="rounded-sm border border-[#d9ae4d]/60 bg-[#d9ae4d]/10 px-1.5 py-0.5 font-bold text-[#f3d584] transition hover:bg-[#d9ae4d]/25">+{Math.min(placeableVoters, free)}</button>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#9ba7b7]">
        {players.map((player, index) => (
          <span key={player.id} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: playerColor(index) }} /> {player.username}{player.id === viewerId ? " (you)" : ""}
          </span>
        ))}
      </div>
    </section>
  );
}
