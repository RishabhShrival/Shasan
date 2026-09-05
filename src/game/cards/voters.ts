import type { VoterCard } from "../types";

export const VOTER_CARDS: VoterCard[] = [
  { id: "local-volunteers", voters: 1, cost: { capitalism: 0, communism: 0, socialism: 0, fascism: 2 } },
  { id: "ward-network", voters: 1, cost: { capitalism: 1, communism: 0, socialism: 1, fascism: 0 } },
  { id: "neighbourhood-campaign", voters: 2, cost: { capitalism: 2, communism: 0, socialism: 1, fascism: 0 } },
  { id: "union-outreach", voters: 2, cost: { capitalism: 0, communism: 2, socialism: 1, fascism: 0 } },
  { id: "community-rally", voters: 2, cost: { capitalism: 1, communism: 0, socialism: 1, fascism: 1 } },
  { id: "regional-campaign", voters: 3, cost: { capitalism: 2, communism: 1, socialism: 1, fascism: 1 } },
  { id: "civic-coalition", voters: 3, cost: { capitalism: 1, communism: 1, socialism: 2, fascism: 1 } },
  { id: "order-and-growth", voters: 3, cost: { capitalism: 2, communism: 0, socialism: 1, fascism: 2 } },
];
