import { CircleDotDashed } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { GameLog } from "@/game/types";

const accent: Partial<Record<GameLog["type"], string>> = {
  MAJORITY: "#d9ae4d",
  EVENT: "#b18cff",
  POWER_USED: "#ff7ab8",
  POWER_BLOCKED: "#c95158",
  GERRYMANDER: "#5aa7ff",
  GAME_FINISHED: "#67c197",
};

export function CampaignLog({ entries }: { entries: GameLog[] }) {
  return (
    <Card className="p-5">
      <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><CircleDotDashed size={15} aria-hidden="true" /> CAMPAIGN LOG</p>
      <ol className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
        {entries.slice().reverse().slice(0, 30).map((entry) => (
          <li key={entry.id} className="border-l-2 pl-2.5 text-xs leading-5 text-[#aab5c3]" style={{ borderColor: accent[entry.type] ?? "rgb(217 174 77 / 0.25)" }}>
            {entry.message}
          </li>
        ))}
      </ol>
    </Card>
  );
}
