"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EMPTY_RESOURCES, RESOURCE_TYPES, type GameView, type PowerCard, type PowerParams, type ResourceType, type Resources } from "@/game/types";
import { IDEOLOGY_STYLES } from "@/lib/ideology";

import { ResourceStepper } from "./resource-chips";

interface PowerFormProps {
  power: PowerCard;
  game: GameView;
  viewerId?: string;
  disabled: boolean;
  actionLabel: string;
  onSubmit: (params: PowerParams) => void;
}

const selectClass = "w-full rounded-sm border border-white/[0.12] bg-[#070c15] px-2 py-1.5 text-xs text-white";

/** Renders exactly the inputs a power needs, then sends them to the server for validation. */
export function PowerForm({ power, game, viewerId, disabled, actionLabel, onSubmit }: PowerFormProps) {
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType | "">("");
  const [secondResourceType, setSecondResourceType] = useState<ResourceType | "">("");
  const [resources, setResources] = useState<Resources>({ ...EMPTY_RESOURCES });

  const needs = (input: PowerCard["inputs"][number]) => power.inputs.includes(input);
  const pickCount = power.resourcePickCount ?? 0;
  const picked = RESOURCE_TYPES.reduce((sum, type) => sum + resources[type], 0);
  const spendsOwn = power.id === "coalition-gift" || power.id === "clean-image";
  const source = game.board.find((constituency) => constituency.id === constituencyId);
  const adjacentOnly = power.id === "migrant-wave";
  const destinations = game.board.filter((constituency) =>
    constituency.id !== constituencyId && (!adjacentOnly || source?.adjacentConstituencyIds.includes(constituency.id)));

  const ready =
    (!needs("targetPlayer") || targetPlayerId) &&
    (!needs("constituency") || constituencyId) &&
    (!needs("destination") || destinationId) &&
    (!needs("resourceType") || resourceType) &&
    (!needs("secondResourceType") || secondResourceType) &&
    (!needs("resourcePick") || (power.id === "coalition-gift" ? picked >= 1 : picked === pickCount));

  function submit() {
    onSubmit({
      targetPlayerId: targetPlayerId || undefined,
      constituencyId: constituencyId || undefined,
      destinationId: destinationId || undefined,
      resourceType: resourceType || undefined,
      secondResourceType: secondResourceType || undefined,
      resources: needs("resourcePick") ? resources : undefined,
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {needs("targetPlayer") ? (
        <select aria-label="Rival" value={targetPlayerId} onChange={(event) => setTargetPlayerId(event.target.value)} className={selectClass}>
          <option value="">Choose a rival…</option>
          {game.players.filter((player) => player.id !== viewerId).map((player) => <option key={player.id} value={player.id}>{player.username}</option>)}
        </select>
      ) : null}
      {needs("constituency") ? (
        <select aria-label="Constituency" value={constituencyId} onChange={(event) => { setConstituencyId(event.target.value); setDestinationId(""); }} className={selectClass}>
          <option value="">{needs("destination") ? "Move from…" : "Choose a constituency…"}</option>
          {game.board.map((constituency) => <option key={constituency.id} value={constituency.id}>{constituency.name} ({constituency.totalVoters}/{constituency.seats})</option>)}
        </select>
      ) : null}
      {needs("destination") ? (
        <select aria-label="Destination" value={destinationId} onChange={(event) => setDestinationId(event.target.value)} className={selectClass}>
          <option value="">{adjacentOnly ? "Move to (adjacent)…" : "Move to…"}</option>
          {destinations.map((constituency) => <option key={constituency.id} value={constituency.id}>{constituency.name} ({constituency.totalVoters}/{constituency.seats})</option>)}
        </select>
      ) : null}
      {needs("resourcePick") ? (
        <div>
          <p className="mb-1 text-[10px] text-[#8d9aab]">
            {power.id === "coalition-gift" ? "Resources to donate (1–3)" : spendsOwn ? `Resources to discard (${pickCount})` : `Resources to gain (${pickCount})`}
          </p>
          <ResourceStepper owned={spendsOwn ? game.yourCards.resources : undefined} value={resources} onChange={setResources} max={pickCount} />
        </div>
      ) : null}
      {needs("resourceType") ? (
        <select aria-label="Ideology" value={resourceType} onChange={(event) => setResourceType(event.target.value as ResourceType)} className={selectClass}>
          <option value="">{needs("secondResourceType") ? "Convert from…" : "Choose an ideology…"}</option>
          {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{IDEOLOGY_STYLES[type].label}</option>)}
        </select>
      ) : null}
      {needs("secondResourceType") ? (
        <select aria-label="Second ideology" value={secondResourceType} onChange={(event) => setSecondResourceType(event.target.value as ResourceType)} className={selectClass}>
          <option value="">Convert into…</option>
          {RESOURCE_TYPES.filter((type) => type !== resourceType).map((type) => <option key={type} value={type}>{IDEOLOGY_STYLES[type].label}</option>)}
        </select>
      ) : null}
      <Button size="sm" className="w-full" disabled={disabled || !ready} onClick={submit}>{actionLabel}</Button>
    </div>
  );
}
