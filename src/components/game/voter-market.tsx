import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RESOURCE_TYPES, type GameView, type Resources } from "@/game/types";

import { IdeologyChip, ResourceList } from "./resource-chips";

interface VoterMarketProps {
  game: GameView;
  canAct: boolean;
  onBuy: (voterCardId: string) => void;
  onRefresh: (discard: Partial<Resources>) => void;
}

function discounted(cost: Resources, amount: number) {
  const reduced = { ...cost };
  for (let step = 0; step < amount; step += 1) {
    const largest = [...RESOURCE_TYPES].sort((left, right) => reduced[right] - reduced[left])[0];
    if (reduced[largest] === 0) break;
    reduced[largest] -= 1;
  }
  return reduced;
}

export function VoterMarket({ game, canAct, onBuy, onRefresh }: VoterMarketProps) {
  const { turnState, roundModifiers, yourCards } = game;
  const bonus = roundModifiers.voterCardBonus ?? 0;
  const blocked = turnState.voterPurchaseBlocked;

  return (
    <Card className="p-5 sm:p-6">
      <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><UserPlus size={15} aria-hidden="true" /> VOTER CARDS</p>
      <p className="mt-1 text-xs text-[#8d9aab]">Buy as many as you can afford — but you must place a card&apos;s voters on the board right after buying it. A bought card is replaced immediately.</p>
      {blocked && canAct ? <p className="mt-2 text-xs text-[#f2a3a8]">Model Code of Conduct: you cannot buy voter cards this turn.</p> : null}
      {turnState.voterSurcharge > 0 && canAct ? <p className="mt-2 text-xs text-[#f2a3a8]">Price Rise: each card costs {turnState.voterSurcharge} extra random resource.</p> : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {game.voterMarket.map((card, slot) => {
          const cost = canAct ? discounted(card.cost, turnState.voterDiscount) : card.cost;
          const affordable = RESOURCE_TYPES.every((type) => yourCards.resources[type] >= cost[type]);
          return (
            <article key={`${slot}-${card.id}`} className="flex animate-fade-up flex-col rounded-sm border border-white/[0.09] bg-[#0b111d]/80 p-3">
              <p className="text-[10px] font-bold tracking-[0.12em] text-[#8f9bab]">{card.name.toUpperCase()}</p>
              <p className="mt-2 text-2xl font-semibold text-[#e9c570]">+{card.voters + bonus} <span className="text-sm text-[#c9b27a]">voter{card.voters + bonus === 1 ? "" : "s"}</span></p>
              <div className="mt-2 min-h-6"><ResourceList resources={cost} emptyLabel="Free" /></div>
              <Button size="sm" variant="outline" className="mt-3 w-full" disabled={!canAct || blocked || !affordable} onClick={() => onBuy(card.id)}>
                {affordable ? "BUY" : "NEED MORE"}
              </Button>
            </article>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-3">
        <span className="text-[11px] text-[#8d9aab]">Nothing useful? Discard 1 resource to replace all 3 cards (once per turn):</span>
        {RESOURCE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            disabled={!canAct || turnState.voterMarketRefreshed || yourCards.resources[type] < 1}
            onClick={() => onRefresh({ [type]: 1 })}
            className="transition disabled:opacity-35"
            aria-label={`Refresh voter cards by discarding 1 ${type}`}
          >
            <IdeologyChip type={type} amount={1} />
          </button>
        ))}
      </div>
    </Card>
  );
}
