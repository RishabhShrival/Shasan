import type { VoterCard } from "../types";

function voter(id: string, name: string, voters: number, capitalism: number, idealism: number, conservatism: number, supremacy: number): VoterCard {
  return { id, name, voters, cost: { capitalism, idealism, conservatism, supremacy } };
}

/**
 * Voter card economy:
 *   1 voter  → 2 resources
 *   2 voters → 3 resources
 *   3 voters → 5 resources
 *   4 voters → 7 resources
 */
export const VOTER_CARDS: VoterCard[] = [
  // 1 voter · 2 resources
  voter("chai-stall-chat", "Chai Stall Chats", 1, 2, 0, 0, 0),
  voter("rti-volunteers", "RTI Volunteers", 1, 0, 2, 0, 0),
  voter("temple-committee", "Temple Committee", 1, 0, 0, 2, 0),
  voter("youth-brigade", "Youth Brigade", 1, 0, 0, 0, 2),
  voter("market-traders", "Market Traders", 1, 1, 0, 1, 0),
  voter("nss-camp", "College NSS Camp", 1, 0, 1, 0, 1),

  // 2 voters · 3 resources
  voter("startup-meetup", "Startup Meetup", 2, 2, 1, 0, 0),
  voter("self-help-groups", "Women's Self-Help Groups", 2, 0, 2, 1, 0),
  voter("kisan-panchayat", "Kisan Panchayat", 2, 0, 1, 2, 0),
  voter("ex-servicemen", "Ex-Servicemen League", 2, 0, 0, 1, 2),
  voter("builders-lobby", "Builders' Lobby", 2, 2, 0, 0, 1),
  voter("teachers-union", "Teachers' Association", 2, 1, 2, 0, 0),
  voter("caste-sabha", "Community Sabha", 2, 0, 0, 2, 1),
  voter("rally-crowd", "Roadshow Crowd", 2, 1, 0, 0, 2),

  // 3 voters · 5 resources
  voter("industrial-belt", "Industrial Belt Workers", 3, 2, 1, 1, 1),
  voter("ngo-network", "NGO Network", 3, 1, 2, 1, 1),
  voter("pilgrim-circuit", "Pilgrim Circuit", 3, 1, 1, 2, 1),
  voter("cadre-march", "Cadre March", 3, 1, 1, 1, 2),
  voter("urban-middle-class", "Urban Middle Class", 3, 2, 2, 0, 1),
  voter("village-elders", "Village Elders", 3, 0, 1, 2, 2),

  // 4 voters · 7 resources
  voter("mega-yatra", "Mega Yatra", 4, 2, 2, 2, 1),
  voter("national-wave", "National Wave", 4, 1, 2, 2, 2),
  voter("corporate-media", "Corporate Media Push", 4, 3, 1, 1, 2),
  voter("grand-alliance", "Grand Alliance Rally", 4, 2, 1, 2, 2),
];
