import { Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { GameView } from "@/game/types";
import { playerColor } from "@/lib/ideology";

export function ResultsPanel({ game, viewerId }: { game: GameView; viewerId?: string }) {
  const results = game.electionResults;
  if (!results) return null;
  const winners = results.winnerPlayerIds.map((id) => game.players.find((player) => player.id === id)?.username ?? "Unknown");

  return (
    <Card className="animate-fade-up border-[#d9ae4d]/45 p-6 text-center shadow-gold-glow sm:p-8">
      <Trophy className="mx-auto text-[#e6c16d]" size={34} strokeWidth={1.4} aria-hidden="true" />
      <p className="mt-3 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">ELECTION RESULTS</p>
      <h2 className="mt-2 font-serif text-3xl font-bold text-[#f7ebd3] sm:text-4xl">
        {results.isTie ? `${winners.join(" & ")} share the THRONE.` : `${winners[0]} claims the THRONE.`}
      </h2>
      <p className="mt-2 text-sm text-[#aab5c3]">Every constituency has a majority. Ranked by seats won, then total voters.</p>
      <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-sm border border-white/[0.09] text-left">
        {results.standings.map((standing, rank) => {
          const index = game.players.findIndex((player) => player.id === standing.playerId);
          const player = game.players[index];
          const isWinner = results.winnerPlayerIds.includes(standing.playerId);
          return (
            <div key={standing.playerId} className={`flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0 ${isWinner ? "border-[#d9ae4d]/20 bg-[#d9ae4d]/10" : "border-white/[0.08]"}`}>
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="w-5 text-[#d9ae4d]">{rank + 1}.</span>
                <span className="size-2.5 rounded-full" style={{ backgroundColor: playerColor(index) }} />
                {player?.username ?? "Unknown"}{standing.playerId === viewerId ? " (you)" : ""}
              </span>
              <span className="text-right text-xs text-[#c8d1dc]">{standing.seatsWon} seats · {standing.constituenciesControlled} majorities · {standing.totalVoters} voters</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
