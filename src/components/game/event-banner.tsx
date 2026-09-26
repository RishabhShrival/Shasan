import { Newspaper } from "lucide-react";

import type { EventCard } from "@/game/types";

export function EventBanner({ event, round }: { event?: EventCard; round: number }) {
  if (!event) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-white/[0.08] bg-[#101827]/70 px-4 py-2.5 text-xs text-[#8d9aab]">
        <Newspaper size={16} className="text-[#d9ae4d]" aria-hidden="true" /> Round {round}: no national event yet. A new event is revealed at the start of every round.
      </div>
    );
  }
  return (
    <div className="flex animate-fade-up items-start gap-3 rounded-sm border border-[#b18cff]/35 bg-[#b18cff]/[0.07] px-4 py-2.5">
      <Newspaper size={16} className="mt-0.5 shrink-0 text-[#c9b0ff]" aria-hidden="true" />
      <p className="text-xs leading-5 text-[#d7cff0]">
        <span className="font-bold tracking-[0.12em] text-[#c9b0ff]">ROUND {round} EVENT · {event.title.toUpperCase()}</span>
        <span className="mx-2 text-[#6d6590]">—</span>{event.description}
      </p>
    </div>
  );
}
