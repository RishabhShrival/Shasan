import { MessageSquareQuote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { GamePlayer, GameView } from "@/game/types";
import { IDEOLOGY_STYLES } from "@/lib/ideology";

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
            {isYourTurn ? "Your answer decides which resources you receive." : `Waiting for ${currentPlayer?.username ?? "the player"} to answer.`}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {([question.yes, question.no] as const).map((option) => {
              const style = IDEOLOGY_STYLES[option.dominantResource];
              return (
                <div key={option.label} className="rounded-sm border p-3" style={{ borderColor: `${style.color}66`, backgroundColor: `${style.color}10` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{option.label.toUpperCase()}</span>
                    <span className="text-[10px] font-bold tracking-[0.1em]" style={{ color: style.text }}>{style.label.toUpperCase()}</span>
                  </div>
                  <div className="mt-2"><ResourceList resources={option.rewards} /></div>
                  {isYourTurn ? (
                    <Button size="sm" className="mt-3 w-full" variant={option.label === "Yes" ? "default" : "outline"} onClick={() => onDecide(option.label)}>
                      ANSWER {option.label.toUpperCase()}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
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
