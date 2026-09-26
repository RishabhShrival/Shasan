import type { PowerCard, ResourceType } from "../types";

/**
 * Sealed cards. They are bought face-down (only the category is visible),
 * paid with ANY 4 resources, and revealed only to the buyer.
 */
export const POWER_CARDS: PowerCard[] = [
  // ── Resource powers ────────────────────────────────────────────────
  {
    id: "party-fund",
    name: "Party Fund Drive",
    category: "resource",
    description: "Gain any 3 resources of your choice. (You still cannot hold more than 12.)",
    inputs: ["resourcePick"],
    resourcePickCount: 3,
  },
  {
    id: "tax-raid",
    name: "Tax Raid",
    category: "resource",
    description: "Snatch 3 random resources from one rival and add them to your stock.",
    inputs: ["targetPlayer"],
  },
  {
    id: "coalition-gift",
    name: "Coalition Gift",
    category: "resource",
    description: "Donate 1 to 3 of your resources to a rival. For every resource you donate, gain 1 voter in your reserve.",
    inputs: ["targetPlayer", "resourcePick"],
    resourcePickCount: 3,
  },
  {
    id: "policy-u-turn",
    name: "Policy U-Turn",
    category: "resource",
    description: "Convert ALL of your resources of one ideology into another ideology of your choice.",
    inputs: ["resourceType", "secondResourceType"],
  },
  {
    id: "income-tax-notice",
    name: "Income Tax Notice",
    category: "resource",
    description: "One rival must discard 3 random resources.",
    inputs: ["targetPlayer"],
  },
  {
    id: "electoral-bonds",
    name: "Electoral Bonds",
    category: "resource",
    description: "Choose an ideology. Gain 2 resources of it for every constituency where you hold a majority (maximum 6).",
    inputs: ["resourceType"],
  },
  {
    id: "clean-image",
    name: "Clean Image Makeover",
    category: "resource",
    description: "Discard any 2 of your own resources, then gain 3 resources of one ideology of your choice.",
    inputs: ["resourcePick", "resourceType"],
    resourcePickCount: 2,
  },
  {
    id: "nationwide-audit",
    name: "Nationwide Audit",
    category: "resource",
    description: "Every rival discards 1 random resource.",
    inputs: [],
  },

  // ── Board powers ───────────────────────────────────────────────────
  {
    id: "mega-rally",
    name: "Mega Rally",
    category: "board",
    description: "Place 2 new voters of yours directly into one constituency that has at least 2 free seats.",
    inputs: ["constituency"],
  },
  {
    id: "volunteer-army",
    name: "Volunteer Army",
    category: "board",
    description: "Gain 3 voters in your reserve. Place them on the board any time during your turns.",
    inputs: [],
  },
  {
    id: "defection",
    name: "Defection",
    category: "board",
    description: "In one constituency, 1 rival voter switches sides and becomes your voter.",
    inputs: ["targetPlayer", "constituency"],
  },
  {
    id: "recount",
    name: "Recount",
    category: "board",
    description: "Remove up to 2 rival voters from a constituency where nobody holds a majority.",
    inputs: ["targetPlayer", "constituency"],
  },
  {
    id: "transfer-order",
    name: "Transfer Order",
    category: "board",
    description: "Move up to 2 of your own voters from one constituency to ANY other constituency (it does not need to be adjacent).",
    inputs: ["constituency", "destination"],
  },
  {
    id: "migrant-wave",
    name: "Migrant Wave",
    category: "board",
    description: "Move 1 rival voter to an adjacent constituency. You do NOT need the most voters there.",
    inputs: ["targetPlayer", "constituency", "destination"],
  },
  {
    id: "security-cover",
    name: "Security Cover",
    category: "board",
    description: "Protect one constituency until your next turn. Rivals cannot remove, convert or move any voter there.",
    inputs: ["constituency"],
  },
  {
    id: "loyal-cadre",
    name: "Loyal Cadre",
    category: "board",
    description: "Until your next turn, rivals cannot remove, convert or move any of your voters anywhere on the board.",
    inputs: [],
  },
  {
    id: "section-144",
    name: "Section 144",
    category: "board",
    description: "Lock one constituency until your next turn. Nobody (not even you) can add voters there.",
    inputs: ["constituency"],
  },

  // ── Strategic powers ───────────────────────────────────────────────
  {
    id: "model-code",
    name: "Model Code of Conduct",
    category: "strategic",
    description: "Block a rival: they cannot buy voter cards during their next turn.",
    inputs: ["targetPlayer"],
  },
  {
    id: "show-cause",
    name: "Show-Cause Notice",
    category: "strategic",
    description: "Block a rival: they cannot play sealed cards during their next turn.",
    inputs: ["targetPlayer"],
  },
  {
    id: "suspension",
    name: "House Suspension",
    category: "strategic",
    description: "A rival skips the political question on their next turn and earns no resources from it.",
    inputs: ["targetPlayer"],
  },
  {
    id: "price-rise",
    name: "Price Rise",
    category: "strategic",
    description: "During a rival's next turn, every voter card they buy costs 1 extra random resource from their stock.",
    inputs: ["targetPlayer"],
  },
  {
    id: "campaign-subsidy",
    name: "Campaign Subsidy",
    category: "strategic",
    description: "The next voter card you buy this turn costs 2 fewer resources (the largest costs are reduced first).",
    inputs: [],
  },
  {
    id: "double-agenda",
    name: "Double Agenda",
    category: "strategic",
    description: "Answer one extra political question this turn and collect its resources.",
    inputs: [],
  },
  {
    id: "delimitation",
    name: "Delimitation Commission",
    category: "strategic",
    description: "You may gerrymander one extra time this turn.",
    inputs: [],
  },
  {
    id: "opinion-poll",
    name: "Opinion Poll",
    category: "strategic",
    description: "Secretly see one rival's exact resources and the names of their sealed cards.",
    inputs: ["targetPlayer"],
  },
  {
    id: "stay-order",
    name: "Stay Order",
    category: "strategic",
    description: "Keep this card. It works automatically: the next sealed card a rival plays against you is cancelled. Both cards are then discarded.",
    inputs: [],
    passive: true,
  },
];

/** Unlocked by answering the same ideology repeatedly (see GameConfig.abilityEvery). */
export const IDEOLOGY_ABILITIES: Record<ResourceType, PowerCard> = {
  capitalism: {
    id: "ability-capitalism",
    name: "Hostile Takeover",
    category: "board",
    description: "In one constituency, convert up to 2 rival voters into your voters.",
    inputs: ["targetPlayer", "constituency"],
  },
  idealism: {
    id: "ability-idealism",
    name: "People's Movement",
    category: "board",
    description: "Gain 3 voters in your reserve.",
    inputs: [],
  },
  conservatism: {
    id: "ability-conservatism",
    name: "Community Bloc",
    category: "board",
    description: "Place 2 new voters in one constituency and protect it until your next turn.",
    inputs: ["constituency"],
  },
  supremacy: {
    id: "ability-supremacy",
    name: "Iron Fist",
    category: "board",
    description: "Remove up to 3 rival voters from a constituency where nobody holds a majority.",
    inputs: ["targetPlayer", "constituency"],
  },
};
