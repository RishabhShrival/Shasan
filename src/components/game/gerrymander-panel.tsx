"use client";

import { Shuffle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Constituency, GameView } from "@/game/types";

interface GerrymanderPanelProps {
  game: GameView;
  viewerId?: string;
  canAct: boolean;
  onGerrymander: (fromId: string, toId: string, voterOwnerId: string) => void;
  onPreview: (fromId?: string, toId?: string) => void;
}

const selectClass = "w-full rounded-sm border border-white/[0.12] bg-[#070c15] px-2 py-1.5 text-xs text-white";

function hasStrictLead(constituency: Constituency, playerId: string) {
  const own = constituency.voterCounts[playerId] ?? 0;
  return own > 0 && Object.entries(constituency.voterCounts).every(([id, count]) => id === playerId || own > count);
}

export function GerrymanderPanel({ game, viewerId, canAct, onGerrymander, onPreview }: GerrymanderPanelProps) {
  const [fromId, setFromId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [toId, setToId] = useState("");
  const { gerrymandersUsed, gerrymandersAllowed } = game.turnState;
  const disabledByEvent = Boolean(game.roundModifiers.gerrymanderDisabled);
  const left = Math.max(gerrymandersAllowed - gerrymandersUsed, 0);

  const sources = viewerId ? game.board.filter((constituency) => hasStrictLead(constituency, viewerId)) : [];
  const source = game.board.find((constituency) => constituency.id === fromId);
  const owners = source ? game.players.filter((player) => (source.voterCounts[player.id] ?? 0) > 0) : [];
  const targets = source
    ? game.board.filter((constituency) => source.adjacentConstituencyIds.includes(constituency.id) && constituency.totalVoters < constituency.seats && !constituency.lockedByPlayerId)
    : [];

  useEffect(() => onPreview(fromId || undefined, toId || undefined), [fromId, toId, onPreview]);

  function submit() {
    onGerrymander(fromId, toId, ownerId);
    setFromId("");
    setOwnerId("");
    setToId("");
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]"><Shuffle size={15} aria-hidden="true" /> GERRYMANDERING</p>
        <span className="text-[10px] font-bold text-[#8d9aab]">{canAct ? `${left} LEFT THIS TURN` : ""}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#8d9aab]">
        Move ONE voter (a rival&apos;s or your own) from a constituency where you have the <span className="text-[#e9dcc3]">highest number of voters</span> to an <span className="text-[#e9dcc3]">adjacent</span> constituency with a free seat.
      </p>
      {disabledByEvent ? <p className="mt-2 text-xs text-[#f2a3a8]">The court has frozen delimitation: no gerrymandering this round.</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <select aria-label="From" value={fromId} disabled={!canAct} onChange={(event) => { setFromId(event.target.value); setOwnerId(""); setToId(""); }} className={selectClass}>
          <option value="">{sources.length ? "From (you lead)…" : "You lead nowhere yet"}</option>
          {sources.map((constituency) => <option key={constituency.id} value={constituency.id}>{constituency.name}</option>)}
        </select>
        <select aria-label="Whose voter" value={ownerId} disabled={!canAct || !source} onChange={(event) => setOwnerId(event.target.value)} className={selectClass}>
          <option value="">Whose voter…</option>
          {owners.map((player) => <option key={player.id} value={player.id}>{player.id === viewerId ? "Your own" : player.username} ({source?.voterCounts[player.id]})</option>)}
        </select>
        <select aria-label="To" value={toId} disabled={!canAct || !source} onChange={(event) => setToId(event.target.value)} className={selectClass}>
          <option value="">To (adjacent)…</option>
          {targets.map((constituency) => <option key={constituency.id} value={constituency.id}>{constituency.name} ({constituency.totalVoters}/{constituency.seats})</option>)}
        </select>
      </div>
      <Button size="sm" variant="outline" className="mt-3" disabled={!canAct || disabledByEvent || left < 1 || !fromId || !ownerId || !toId} onClick={submit}>
        SHIFT 1 VOTER
      </Button>
    </Card>
  );
}
