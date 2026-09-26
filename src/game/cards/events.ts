import type { EventCard } from "../types";

/** One event is revealed at the start of every round and affects all players for that round. */
export const EVENT_CARDS: EventCard[] = [
  {
    id: "budget-session",
    title: "Budget Session",
    description: "The finance minister announces tax breaks. Every player gains 1 Capitalism.",
    effect: { kind: "grantAll", resources: { capitalism: 1 } },
  },
  {
    id: "anti-corruption-wave",
    title: "Anti-Corruption Wave",
    description: "A citizens' movement sweeps the country. Every player gains 1 Idealism.",
    effect: { kind: "grantAll", resources: { idealism: 1 } },
  },
  {
    id: "festival-season",
    title: "Festival Season",
    description: "Big festivals bring families together. Every player gains 1 Conservatism.",
    effect: { kind: "grantAll", resources: { conservatism: 1 } },
  },
  {
    id: "border-tension",
    title: "Border Tension",
    description: "Tension at the border raises national feeling. Every player gains 1 Supremacy.",
    effect: { kind: "grantAll", resources: { supremacy: 1 } },
  },
  {
    id: "demonetisation-shock",
    title: "Cash Crunch",
    description: "A sudden currency change freezes party funds. Every player discards 1 random resource.",
    effect: { kind: "discardAll", count: 1 },
  },
  {
    id: "model-code-announced",
    title: "Election Dates Announced",
    description: "The Model Code of Conduct is in force. No sealed cards can be bought this round.",
    effect: { kind: "modifier", modifiers: { sealedMarketClosed: true } },
  },
  {
    id: "wave-election",
    title: "Wave Election",
    description: "Voters are excited this season. Every voter card gives +1 voter this round.",
    effect: { kind: "modifier", modifiers: { voterCardBonus: 1 } },
  },
  {
    id: "delimitation-freeze",
    title: "Court Freezes Delimitation",
    description: "The Supreme Court pauses boundary changes. Gerrymandering is not allowed this round.",
    effect: { kind: "modifier", modifiers: { gerrymanderDisabled: true } },
  },
  {
    id: "boundary-review",
    title: "Boundary Review",
    description: "A new commission redraws maps. Every player may gerrymander 1 extra time this round.",
    effect: { kind: "modifier", modifiers: { extraGerrymanders: 1 } },
  },
  {
    id: "prime-time-debate",
    title: "Prime-Time Debate",
    description: "Every political answer this round gives 1 extra resource of its main ideology.",
    effect: { kind: "modifier", modifiers: { answerBonus: 1 } },
  },
  {
    id: "startup-boom",
    title: "Startup Boom",
    description: "The player with the strongest Capitalism profile gains 2 new voters to place on their next turn.",
    effect: { kind: "ideologyLeaderVoters", ideology: "capitalism", voters: 2 },
  },
  {
    id: "whistleblower",
    title: "Whistleblower Hero",
    description: "The player with the strongest Idealism profile gains 2 new voters to place on their next turn.",
    effect: { kind: "ideologyLeaderVoters", ideology: "idealism", voters: 2 },
  },
  {
    id: "religious-gathering",
    title: "Great Pilgrimage",
    description: "The player with the strongest Conservatism profile gains 2 new voters to place on their next turn.",
    effect: { kind: "ideologyLeaderVoters", ideology: "conservatism", voters: 2 },
  },
  {
    id: "military-parade",
    title: "Republic Day Parade",
    description: "The player with the strongest Supremacy profile gains 2 new voters to place on their next turn.",
    effect: { kind: "ideologyLeaderVoters", ideology: "supremacy", voters: 2 },
  },
  {
    id: "sting-operation",
    title: "Sting Operation",
    description: "A news channel targets the front-runner. The player with the most voters on the board discards 2 random resources.",
    effect: { kind: "boardLeaderPenalty", count: 2 },
  },
  {
    id: "sympathy-wave",
    title: "Sympathy Wave",
    description: "The public backs the underdog. The player with the fewest voters on the board gains 2 new voters to place on their next turn.",
    effect: { kind: "underdogVoters", voters: 2 },
  },
];
