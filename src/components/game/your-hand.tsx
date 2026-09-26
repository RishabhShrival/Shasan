"use client";

import { Eye, Sparkles, Wallet } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { IDEOLOGY_ABILITIES } from "@/game/cards/powers";
import { RESOURCE_TYPES, type GameView, type PowerParams, type ResourceType } from "@/game/types";
import { IDEOLOGY_STYLES } from "@/lib/ideology";

import { PowerForm } from "./power-form";
import { ResourceList } from "./resource-chips";

const CATEGORY_COLOR: Record<string, string> = { resource: "#d9ae4d", board: "#5aa7ff", strategic: "#b18cff" };

interface YourHandProps {
  game: GameView;
  viewerId?: string;
  canAct: boolean;
  onUseSealed: (instanceId: string, params: PowerParams) => void;
  onUseAbility: (ideology: ResourceType, params: PowerParams) => void;
}

/** The viewer's private resources and cards. */
export function YourResources({ game }: { game: GameView }) {
  const { resources } = game.yourCards;
  const total = RESOURCE_TYPES.reduce((sum, type) => sum + resources[type], 0);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><Wallet size={15} aria-hidden="true" /> YOUR RESOURCES</p>
        <span className={`text-xs font-bold ${total >= game.rules.maxResources ? "text-[#f2a3a8]" : "text-[#aab5c3]"}`}>{total} / {game.rules.maxResources}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {RESOURCE_TYPES.map((type) => {
          const style = IDEOLOGY_STYLES[type];
          return (
            <div key={type} className="rounded-sm border px-3 py-2 transition-colors" style={{ borderColor: `${style.color}66`, backgroundColor: `${style.color}14` }} title={style.tagline}>
              <p className="text-[10px] font-bold tracking-[0.1em]" style={{ color: style.text }}>{style.label.toUpperCase()}</p>
              <p className="text-2xl font-semibold text-white tabular-nums">{resources[type]}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-sm border border-[#d9ae4d]/25 bg-[#d9ae4d]/[0.06] px-3 py-2">
        <span className="text-xs font-semibold text-[#e9dcc3]">Voters in reserve</span>
        <span className="text-xl font-semibold text-[#f3d584] tabular-nums">{game.yourCards.reserveVoters}</span>
      </div>
      {game.yourCards.reserveVoters > 0 ? <p className="mt-1.5 text-[10px] text-[#8d9aab]">Use the +1 buttons on the board during your action phase to place them.</p> : null}
    </Card>
  );
}

export function YourHand({ game, viewerId, canAct, onUseSealed, onUseAbility }: YourHandProps) {
  const [openId, setOpenId] = useState<string>();
  const { sealedCards, abilityCharges, intel, nextTurn } = game.yourCards;
  const blocked = game.turnState.sealedUseBlocked && canAct;
  const abilities = RESOURCE_TYPES.filter((type) => abilityCharges[type] > 0);
  const intelTarget = game.players.find((player) => player.id === intel?.targetPlayerId);
  const warnings = [
    nextTurn.skipQuestion && "You are suspended from your next political question.",
    nextTurn.voterPurchaseBlocked && "You cannot buy voter cards next turn.",
    nextTurn.sealedUseBlocked && "You cannot play sealed cards next turn.",
    nextTurn.voterSurcharge > 0 && `Voter cards cost ${nextTurn.voterSurcharge} extra next turn.`,
  ].filter(Boolean) as string[];

  return (
    <Card className="p-5 sm:p-6">
      <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><Sparkles size={15} aria-hidden="true" /> YOUR SEALED CARDS ({sealedCards.length})</p>
      <p className="mt-1 text-xs text-[#8d9aab]">Only you can see these. Rivals only see how many you hold.</p>
      {blocked ? <p className="mt-2 text-xs text-[#f2a3a8]">Show-Cause Notice: you cannot play sealed cards this turn.</p> : null}
      {warnings.map((warning) => <p key={warning} className="mt-2 text-xs text-[#f2a3a8]">⚠ {warning}</p>)}

      {sealedCards.length === 0 ? <p className="mt-4 text-sm text-[#7d8a9b]">You do not hold any sealed cards yet.</p> : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sealedCards.map((card) => (
            <article key={card.instanceId} className="flex animate-fade-up flex-col rounded-sm border bg-[#0b111d]/85 p-3" style={{ borderColor: `${CATEGORY_COLOR[card.category]}55` }}>
              <p className="text-[9px] font-bold tracking-[0.14em]" style={{ color: CATEGORY_COLOR[card.category] }}>{card.category.toUpperCase()} POWER</p>
              <p className="mt-1 text-sm font-semibold text-[#f5ead5]">{card.name}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#a5b1c1]">{card.description}</p>
              {card.passive ? (
                <p className="mt-auto pt-3 text-[10px] font-semibold text-[#67c197]">ACTIVE — TRIGGERS AUTOMATICALLY</p>
              ) : openId === card.instanceId ? (
                <PowerForm key={card.instanceId} power={card} game={game} viewerId={viewerId} disabled={!canAct || blocked} actionLabel="PLAY CARD" onSubmit={(params) => { onUseSealed(card.instanceId, params); setOpenId(undefined); }} />
              ) : (
                <button type="button" disabled={!canAct || blocked} onClick={() => setOpenId(card.instanceId)} className="mt-auto pt-3 text-left text-xs font-bold tracking-[0.1em] text-[#e5c36e] disabled:text-[#5f6b7b]">
                  {canAct ? "PLAY →" : "PLAY ON YOUR TURN"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-white/[0.08] pt-4">
        <p className="text-[10px] font-bold tracking-[0.16em] text-[#8290a1]">IDEOLOGY ABILITIES</p>
        <p className="mt-1 text-[11px] text-[#7d8a9b]">
          Every {game.rules.profileBonusEvery} answers of one ideology give +{game.rules.profileBonusAmount} of it. Every {game.rules.abilityEvery} answers unlock that ideology&apos;s ability.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {RESOURCE_TYPES.map((type) => {
            const ability = IDEOLOGY_ABILITIES[type];
            const style = IDEOLOGY_STYLES[type];
            const charges = abilityCharges[type];
            return (
              <div key={type} className={`rounded-sm border p-2.5 ${charges > 0 ? "" : "opacity-55"}`} style={{ borderColor: `${style.color}55` }}>
                <p className="text-[10px] font-bold" style={{ color: style.text }}>{style.label.toUpperCase()} · {ability.name} {charges > 0 ? `×${charges}` : ""}</p>
                <p className="mt-1 text-[11px] leading-4 text-[#a5b1c1]">{ability.description}</p>
                {charges > 0 && openId === ability.id ? (
                  <PowerForm power={ability} game={game} viewerId={viewerId} disabled={!canAct} actionLabel="USE ABILITY" onSubmit={(params) => { onUseAbility(type, params); setOpenId(undefined); }} />
                ) : charges > 0 ? (
                  <button type="button" disabled={!canAct} onClick={() => setOpenId(ability.id)} className="mt-1.5 text-[11px] font-bold text-[#e5c36e] disabled:text-[#5f6b7b]">USE →</button>
                ) : null}
              </div>
            );
          })}
        </div>
        {abilities.length === 0 ? null : <p className="mt-2 text-[10px] text-[#67c197]">You have {abilities.length} ability charge type(s) ready.</p>}
      </div>

      {intel ? (
        <div className="mt-5 border-t border-white/[0.08] pt-4 text-xs">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-[#8290a1]"><Eye size={12} aria-hidden="true" /> OPINION POLL · ROUND {intel.round}</p>
          <p className="mt-1 text-[#c7d0db]">{intelTarget?.username ?? "Rival"} held:</p>
          <div className="mt-1"><ResourceList resources={intel.resources} emptyLabel="No resources" /></div>
          <p className="mt-1 text-[#8d9aab]">Sealed: {intel.sealedCardNames.length ? intel.sealedCardNames.join(", ") : "none"}</p>
        </div>
      ) : null}
    </Card>
  );
}
