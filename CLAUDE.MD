# THRONE — Game Rules & Development Guide (v2)

THRONE is an online multiplayer (2–5 players) political strategy board game inspired by the high-level mechanics of SHASN. All content uses **fictional** constituencies and political entities with Indian political and social context, in simple English.

This file is the source of truth for rules. When rules change, update this file together with the engine and tests.

---

## 1. Tech stack & architecture

- Next.js (App Router) · TypeScript · Tailwind CSS · ShadCN-style UI primitives · Socket.IO
- Zustand only where client-side state really helps (not needed yet)
- No authentication and no database yet — active games live in server memory (`GameManager` holds a `Map`)

```text
Next.js Frontend ──Socket.IO──► Multiplayer server (server.ts)
                                   │
                                   ▼
                          GameManager (in-memory Map)
                                   │
                                   ▼
                    GameEngine (pure TypeScript rules)
```

### Server-authoritative
The client sends **intentions only** (e.g. "buy voter card X", "pay these 4 resources"). The server validates turn, phase, ownership, affordability, adjacency, capacity and card availability, updates `GameState`, and broadcasts a **personalised view** to each player. Every engine action runs on a draft copy and is committed only if all validation passes — a rejected action never half-changes the game.

### Folder map
```text
server.ts                         Socket.IO + Next custom server
src/server/GameManager.ts         in-memory store, per-player views
src/server/RoomManager.ts         lobby, tokens, reconnection
src/server/socket/events.ts       typed client↔server events
src/game/types/                   GameState, GameView, cards, board, resources
src/game/constants/board.ts       constituencies (odd seats, adjacency)
src/game/cards/decisions.ts       ~100 political questions
src/game/cards/powers.ts          26 sealed powers + 4 ideology abilities
src/game/cards/voters.ts          voter cards
src/game/cards/events.ts          round events
src/game/engine/GameEngine.ts     turn flow & all actions
src/game/engine/PowerResolver.ts  every sealed power / ability effect
src/game/engine/BoardManager.ts   seats, majority, moves
src/components/game/*             game UI (split into small components)
src/components/board/*            electoral map
src/lib/ideology.ts               ideology & player colours
```

Commands: `npm run dev` (builds server + runs), `npm test`, `npm run lint`, `npm run build`.

---

## 2. Ideologies (= resource types)

| Ideology | Colour | Meaning |
|---|---|---|
| Capitalism | green `#2f9e57` | markets, private business, growth, low tax |
| Idealism | yellow `#e3b928` | ethics, transparency, public welfare, equal opportunity, institutional integrity, long-term goals, principles over short-term gain |
| Conservatism | orange `#e0761f` | religion, community, tradition, family and customs |
| Supremacy | maroon red `#8c1d2f` | strong central state, order, security, national pride |

Socialism and Communism are **not** used. Ideology colours are used only for ideology information (chips, badges, profile bars, question options). The rest of the UI stays dark navy/black with gold accents.

---

## 3. Players
Each player has: id, username, resources (private), voters on the board and in reserve, a public **ideology profile** (how many answers of each ideology they gave), sealed cards (private; rivals see only the count), ideology ability charges, and temporary effects.

- Players start with **1 resource of each ideology**.
- Maximum **12 resources** held at once (extra is lost).

---

## 4. Board & majority
- 9 fictional constituencies on a 3 × 3 map; adjacency = sharing a border (up/down/left/right).
- Every constituency has an **odd number of seats between 5 and 20** (validated at start-up). Seats = voter capacity.
- **Majority** = strictly more than half of the seats: `playerVoters > seats / 2` (5 → 3, 7 → 4, 11 → 6 …). Having the most voters is NOT a majority.
- Each tile shows `Majority: X / seats`, a seat-dot track, every player's voters there, and either the majority holder (tile glows in their colour) or **No Majority**.
- **Hung constituency re-poll** (anti-deadlock): if a constituency is full but nobody has a majority, at the end of the turn every player not tied for the most voters there gets their voters back into reserve (if everyone there is tied, each takes 1 back).

## 5. Game end
There is **no fixed number of rounds**. The game ends immediately when **every constituency has a majority**. Winner = most seats won (sum of seats of constituencies where they hold the majority); tie-breakers: total voters on the board, then number of majorities.

---

## 6. Turn flow
1. **Political question** (mandatory): Yes/No question. Each answer gives exactly 4 resources and shows its main ideology before choosing. Everyone sees the question, the answer and the resources received.
   - Every 3 answers of the same ideology → +2 of that ideology.
   - Every 5 answers of the same ideology → one charge of that ideology's ability.
2. **Action phase** — any number of valid actions, in any order, until the player clicks **END TURN**:
   - Buy **multiple** voter cards (reserve voters).
   - Place reserve voters into constituencies with free seats.
   - Buy **multiple** sealed cards.
   - Play sealed cards / ideology abilities.
   - Gerrymander (once per turn by default).
   - Refresh the voter market once per turn by discarding 1 resource (anti-stall).
3. End turn → next player. When turn order wraps, a new round starts and a **round event** is revealed.

## 7. Voter cards
- Always **3 voter cards** on the shared market. A bought card is **replaced immediately in the same slot**.
- Pricing: 1 voter = 2 resources · 2 voters = 3 · 3 voters = 5 · 4 voters = 7.

## 8. Sealed cards
- Market of 3 face-down sealed cards (only the category — resource / board / strategic — is visible). Deck contains 2 copies of each power; used cards are reshuffled.
- Price: **any 4 resources** chosen by the buyer. The server checks exactly 4 were selected, all are owned, and the card is still available. (Card-specific requirements are supported by design but none currently exist.)
- Players may hold any number of sealed cards. Only the owner sees names and text; rivals see the count.
- Powers (26): Party Fund Drive, Tax Raid, Coalition Gift, Policy U-Turn, Income Tax Notice, Electoral Bonds, Clean Image Makeover, Nationwide Audit, Mega Rally, Volunteer Army, Defection, Recount, Transfer Order, Migrant Wave, Security Cover, Loyal Cadre, Section 144, Model Code of Conduct, Show-Cause Notice, House Suspension, Price Rise, Campaign Subsidy, Double Agenda, Delimitation Commission, Opinion Poll, Stay Order (passive negation). Full text lives in `powers.ts`.
- Protection: Security Cover (a constituency) and Loyal Cadre (all your voters) stop rivals removing, converting or moving voters until your next turn. Section 144 stops anyone adding voters to a constituency until your next turn.

## 9. Ideology abilities
Capitalism — Hostile Takeover · Idealism — People's Movement · Conservatism — Community Bloc · Supremacy — Iron Fist.

## 10. Gerrymandering
Move exactly **one** voter (a rival's or your own) from a constituency where you have the **strictly highest** number of voters to an **adjacent** constituency that has a free seat and is not under Section 144. Once per turn (config `gerrymandersPerTurn`; `gerrymanderAllowTiedLead` can allow ties). Blocked by Security Cover / Loyal Cadre and by the "Court Freezes Delimitation" event.

## 11. Events
One event per round from round 2: grants, discards, voter bonuses for ideology leaders or the underdog, penalties for the board leader, and round modifiers (sealed market closed, +1 voter per card, no gerrymandering, extra gerrymander, answer bonus).

## 12. Content
- ~100 original questions (`decisions.ts`) across Economy, Education, Healthcare, Agriculture, Infrastructure, Governance, Society, Religion & Culture, Environment, Technology, National Security, Media, Elections. Each creates a real trade-off; Yes and No always lead to different main ideologies. Simple English, Indian context, fictional entities.
- Tests enforce: ≥100 questions, 4 resources per answer, ≥20 distinct sealed powers, odd seat counts, consistent voter pricing, no socialism/communism.

## 13. Coding rules
TypeScript everywhere, avoid `any`, game logic stays out of React, server validates every action, never trust client values, keep state serializable, keep components small, keep rules configurable (`GameConfig` in `GameEngine.ts`), no DB/auth yet.
