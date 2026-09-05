import type { PowerCard, Resources } from "../types";

export const POWER_CARD_COST: Resources = { capitalism: 1, communism: 1, socialism: 1, fascism: 1 };

export const POWER_CARDS: PowerCard[] = [
  { id: "resource-levy", name: "Resource Levy", description: "Take up to eight resources from a rival, subject to the action rules.", target: "player" },
  { id: "public-grant", name: "Public Grant", description: "Transfer up to eight of your resources to another player.", target: "player" },
  { id: "voter-eviction", name: "Voter Eviction", description: "Remove up to four opposing voters from an eligible constituency.", target: "constituency" },
  { id: "fresh-mandate", name: "Fresh Mandate", description: "Draw a new voter offer.", target: "self" },
  { id: "conversion-drive", name: "Conversion Drive", description: "Convert up to five voters, subject to constituency rules.", target: "constituency" },
  { id: "missed-sittings", name: "Missed Sittings", description: "Cause a rival to miss two future turns.", target: "player" },
  { id: "double-hearing", name: "Double Hearing", description: "Take an additional political-decision draw on your turn.", target: "self" },
  { id: "procedural-delay", name: "Procedural Delay", description: "Reduce a rival's future decision opportunity by one.", target: "player" },
];
