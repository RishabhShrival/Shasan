import { MessageSquareQuote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GamePlayer, GameView } from "@/game/types";

import { ResourceList } from "./resource-chips";

interface DecisionPanelProps {
  game: GameView;
  viewerId?: string;
  isYourTurn: boolean;
  currentPlayer?: GamePlayer;
  onDecide: (choice: "Yes" | "No") => void;
}

export function DecisionPanel({ game, viewerId, isYourTurn, currentPlayer, onDecide }: DecisionPanelProps) {
  const question = game.currentDecision;
  const awaitingAnswer = game.phase === "POLITICAL_DECISION";
  const resolution = game.currentDecisionResolution;
  const resolver = game.players.find((player) => player.id === resolution?.playerId);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-[#d9ae4d]">
          <MessageSquareQuote size={15} aria-hidden="true" /> POLITICAL QUESTION
        </p>
        {question && awaitingAnswer ? <span className="text-[10px] font-bold tracking-[0.14em] text-[#8290a1]">{question.topic.toUpperCase()}</span> : null}
      </div>

      {question && awaitingAnswer ? (
        <>
          <h3 className="mt-3 text-lg font-semibold leading-snug text-[#f5ead5]">{question.question}</h3>
          <p className="mt-2 text-xs text-[#8d9aab]">
            {isYourTurn ? "Answer YES or NO." : `Waiting for ${currentPlayer?.username ?? "the player"} to answer.`}
          </p>
          <p className="mt-3 text-[11px] leading-5 text-[#7d8a9b]">
            The resources and ideology behind each answer are secret. Think about which ideology your answer supports — you will see what you earned only after you choose.
          </p>
          {isYourTurn ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => onDecide("Yes")}>YES</Button>
              <Button variant="outline" onClick={() => onDecide("No")}>NO</Button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-[#9da9b9]">
          {game.status === "FINISHED" ? "The election is over." : `${currentPlayer?.id === viewerId ? "You have" : `${currentPlayer?.username ?? "The player"} has`} answered. Action phase in progress.`}
        </p>
      )}

      {resolution ? (
        <div className="mt-4 border-t border-white/[0.08] pt-3 text-xs text-[#aab5c3]">
          <p className="text-[10px] font-bold tracking-[0.16em] text-[#8290a1]">LAST ANSWER</p>
          <p className="mt-1 leading-5">
            <span className="font-semibold text-white">{resolution.playerId === viewerId ? "You" : resolver?.username ?? "A player"}</span>{" "}
            said <span className="font-semibold text-white">{resolution.choice.toUpperCase()}</span> to “{resolution.question}”
          </p>
          <div className="mt-1.5"><ResourceList resources={resolution.awarded} emptyLabel="No resources (holding limit)" /></div>
        </div>
      ) : null}
    </Card>
  );
}
