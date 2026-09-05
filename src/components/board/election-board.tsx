import { Crown, MapPinned, Users } from "lucide-react";

import type { Constituency, GamePlayer } from "@/game/types";
import { cn } from "@/lib/utils";

interface ElectionBoardProps {
  board: Constituency[];
  players: GamePlayer[];
  currentPlayerId: string;
}

const playerAccents = ["bg-[#d9ae4d]", "bg-[#c95158]", "bg-[#5f9fd3]", "bg-[#8d72c7]", "bg-[#5ead88]"];

export function ElectionBoard({ board, players, currentPlayerId }: ElectionBoardProps) {
  return (
    <section aria-label="Election board">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">THE ELECTORAL MAP</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-[#f7ebd3]">Nine constituencies. One mandate.</h2>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-[#96a3b3]"><MapPinned size={15} className="text-[#d9ae4d]" aria-hidden="true" /> Adjacency is marked by shared borders.</p>
      </div>

      <div className="mt-5 grid overflow-hidden border border-white/[0.1] bg-white/[0.08] sm:grid-cols-3">
        {board.map((constituency) => {
          const controller = players.find((player) => player.id === constituency.controllingPlayerId);
          const isCurrentTurnRegion = constituency.controllingPlayerId === currentPlayerId;
          return (
            <article
              key={constituency.id}
              className={cn(
                "relative min-h-44 border-b border-r border-white/[0.08] bg-[#0b111d]/95 p-4 transition-colors sm:min-h-48",
                isCurrentTurnRegion && "bg-[#261d0c]/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[#8290a1]">{constituency.region.toUpperCase()}</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{constituency.name}</h3>
                </div>
                <span className="border border-[#d9ae4d]/30 bg-[#d9ae4d]/10 px-2 py-1 text-[10px] font-bold tracking-[0.1em] text-[#e5c36e]">
                  {constituency.electoralWeight} SEATS
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-[#a3aebc]">
                <span className="inline-flex items-center gap-1.5"><Users size={14} aria-hidden="true" /> {constituency.totalVoters} VOTERS</span>
                {controller ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#f0cd79]"><Crown size={14} aria-hidden="true" /> {controller.username}</span>
                ) : (
                  <span className="font-semibold text-[#8491a0]">CONTESTED</span>
                )}
              </div>

              <div className="mt-4 flex h-2 overflow-hidden bg-white/[0.07]">
                {players.map((player, index) => {
                  const count = constituency.voterCounts[player.id] ?? 0;
                  const width = constituency.totalVoters > 0 ? (count / constituency.totalVoters) * 100 : 0;
                  return <span key={player.id} className={playerAccents[index % playerAccents.length]} style={{ width: `${width}%` }} />;
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#aeb8c4]">
                {players.map((player, index) => (
                  <span key={player.id} className="inline-flex items-center gap-1.5">
                    <span className={cn("size-1.5 rounded-full", playerAccents[index % playerAccents.length])} />
                    {player.username}: {constituency.voterCounts[player.id] ?? 0}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-4 text-[#788596]">Borders: {constituency.adjacentConstituencyIds.length} linked constituencies</p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#9ba7b7]">
        {players.map((player, index) => (
          <span key={player.id} className="inline-flex items-center gap-1.5"><span className={cn("size-2 rounded-full", playerAccents[index % playerAccents.length])} /> {player.username}</span>
        ))}
      </div>
    </section>
  );
}
