"use client";

import { Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EMPTY_RESOURCES, RESOURCE_TYPES, type GameView, type PowerCategory, type Resources } from "@/game/types";

import { ResourceStepper } from "./resource-chips";

const CATEGORY_LABEL: Record<PowerCategory, string> = {
  resource: "Resource power",
  board: "Board power",
  strategic: "Strategic power",
};

interface SealedMarketProps {
  game: GameView;
  canAct: boolean;
  onBuy: (instanceId: string, payment: Resources) => void;
}

export function SealedMarket({ game, canAct, onBuy }: SealedMarketProps) {
  const [selected, setSelected] = useState<string>();
  const [payment, setPayment] = useState<Resources>({ ...EMPTY_RESOURCES });
  const price = game.rules.sealedCardPrice;
  const paid = RESOURCE_TYPES.reduce((sum, type) => sum + payment[type], 0);
  const owned = game.yourCards.resources;
  const ownedTotal = RESOURCE_TYPES.reduce((sum, type) => sum + owned[type], 0);
  const closed = Boolean(game.roundModifiers.sealedMarketClosed);

  function confirm() {
    if (!selected) return;
    onBuy(selected, payment);
    setSelected(undefined);
    setPayment({ ...EMPTY_RESOURCES });
  }

  return (
    <Card className="p-5 sm:p-6">
      <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><Mail size={15} aria-hidden="true" /> SEALED CARDS</p>
      <p className="mt-1 text-xs text-[#8d9aab]">Pay any {price} resources. The power stays sealed until you buy it — only you will see it.</p>
      {closed ? <p className="mt-2 text-xs text-[#f2a3a8]">Election dates announced: the sealed market is closed this round.</p> : null}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {game.sealedMarket.map((slot) => (
          <button
            key={slot.instanceId}
            type="button"
            disabled={!canAct || closed || ownedTotal < price}
            onClick={() => { setSelected(slot.instanceId); setPayment({ ...EMPTY_RESOURCES }); }}
            className={`group relative flex aspect-[3/4] animate-fade-up flex-col items-center justify-center rounded-sm border bg-gradient-to-b from-[#1b2335] to-[#0b111d] p-2 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${selected === slot.instanceId ? "border-[#d9ae4d] shadow-gold-glow" : "border-[#d9ae4d]/25 hover:border-[#d9ae4d]/70"}`}
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-[#d9ae4d]/50 bg-[#7c1d2a]/40 font-serif text-lg font-bold text-[#f3d584]">T</span>
            <span className="mt-2 text-[10px] font-bold tracking-[0.1em] text-[#e8d6aa]">SEALED</span>
            <span className="mt-1 text-[10px] text-[#8d9aab]">{CATEGORY_LABEL[slot.category]}</span>
            <span className="mt-2 text-[10px] font-semibold text-[#d9ae4d]">ANY {price}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-[#6d7a8b]">{game.sealedDeckCount} sealed cards left in the deck.</p>

      {selected ? (
        <div className="mt-4 border-t border-white/[0.08] pt-4">
          <p className="text-xs font-semibold text-[#e9dcc3]">Choose {price} resources to pay ({paid}/{price})</p>
          <div className="mt-2"><ResourceStepper owned={owned} value={payment} onChange={setPayment} max={price} /></div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={paid !== price} onClick={confirm}>BUY SEALED CARD</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(undefined)}>CANCEL</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
