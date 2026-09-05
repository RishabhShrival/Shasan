# Build: THRONE — Online Multiplayer Political Strategy Board Game

I want you to build a complete web-based multiplayer political strategy board game called **THRONE**.
copy of SHASN board game. (i wont make it public so do not worry about copywrite)

---

# 1. TECH STACK

Use:

- Next.js
- TypeScript
- Tailwind CSS
- ShadCN UI
- Socket.IO for real-time multiplayer
- Zustand for client-side UI state if needed

For the initial MVP:

- Do NOT add authentication.
- Do NOT add a database yet.
- Store active games in server memory.
- Use guest usernames.
- Generate unique room codes.

Architecture:

```text
Next.js Frontend
        │
        │ Socket.IO
        ▼
Multiplayer Game Server
        │
        ▼
Game Engine
        │
        ▼
In-Memory Game State
```

The game logic must be independent from the UI so it can later be reused for mobile applications or other clients.

---

# 2. CORE GAME CONCEPT

THRONE is a multiplayer political strategy game for **2–5 players**.

Each player is a politician attempting to gain vote and majority and win the election.

Players must:

- Respond to political and ethical situations.
- Gain resources based on decisions.
- can buy voter using resources.
- Influence constituencies by adding voters.
- Control important regions by making majority.
- Compete with other politicians.
- Use strategic actions and powers.
- Win the election.

The game should have a strong Indian political atmosphere, using real political parties, real politicians and groups/organizations.

The scenarios should feel relevant to Indian democracy and society.

---

# 3. IMPORTANT GAMEPLAY PRINCIPLE

The server must be authoritative.

The frontend must NEVER decide whether a move is valid.

Example:

```text
Player clicks an action
        ↓
Frontend sends intent to server
        ↓
Server validates the move
        ↓
Server updates GameState
        ↓
Server broadcasts the new state
        ↓
All players update their UI
```

Never trust the client for:

- Resource calculations.
- Card ownership.
- Turn validation.
- Board control.
- Winning conditions.
- Random card selection.

All critical logic must run on the server.

---

# 4. GAME PHASES

The game should have the following phases:

```text
LOBBY
   ↓
GAME_SETUP
   ↓
POLITICAL_DECISION
   ↓
ACTION_PHASE (answer situation or question and can buy voter or random power)
   ↓
Can use power (optional)
   ↓
NEXT_PLAYER
   ↓
ROUND_COMPLETE
   ↓
ELECTION_RESULTS
```

The exact rules should be implemented in a modular way so balancing can easily be changed later.

---

# 5. PLAYER RESOURCES

Each player should manage several resources.

Initial resources:

```ts
interface Resources {
  Capitalism: number;
  Communism: number;
  Socialism: number;
  Fascism: number;
}
```

Make the resource system configurable and easy to balance.
will get resource according to answer of situation.
always get 4 resource (combination of given types)

player can hold maximum of 12 total resources at a time.

---

# 6 .Voter Card

at a time 3 voter card will show.
each card will have no of voter and which and how many resource needed.
example.
3 voters. (2 capitalist, 1 socialist, 1 facism ) needed
1 voter (2 facism needed)

etc...
use random combination
3 voter 5 total resources
2 voter 3 total resources
1 voter 2 total resources

---

# 7. POLITICAL DECISION CARDS

Create a deck of original political scenario cards.

Each card should present:

- A fictional political situation.
- A dilemma.
- yes or no response

after player response:

- player will get resource according to response.

Example structure:

```ts
interface DecisionCard {
  id: string;

  title: string;

  scenario: string;

  Yes: list<Resources>

  No: list<Resources>
  }[];
}
```

example:
situation: should government take all control of education and make education free?

yes: 2 communism, 1 fasiasm, 1 socialism
No: 3 capitalism, 1 socialism.

Create original scenarios inspired by issues relevant to India, such as:

- Rural development.
- Employment.
- Infrastructure.
- Public healthcare.
- Education.
- Environmental protection.
- Urban development.
- Agriculture.
- Digital privacy.
- Social welfare.
- Disaster response.
- Corruption allegations involving fictional characters.
- Public protests.
- Media controversies.
- Budget allocation.
- LGBT
- religians
- reservation
- casteism
  etc

USE SENSITIVE TOPICS

you can use real political party or groups names. (BJP, congress, AAP, JDU, bajrangdaal, RSS etc )

---

# 8. BOARD SYSTEM

Create a strategic election board.

The board should contain real states / constituencies.

use given states

```text
┌───────────┬───────────┬───────────┐
│ gujrat    │ UP        │ Delhi     │
├───────────┼───────────┼───────────┤
│ Mp        │ Manipur   │ haryana   │
├───────────┼───────────┼───────────┤
│ Rajasthan │ Kashmir   │ Karnatak  │
└───────────┴───────────┴───────────┘
```

Each constituency should have:

```ts
interface Constituency {
  id: string;

  name: string;

  voters: number;

  controllingPlayerId?: string;

  No_of_voters_of_each_player: {player1: number, player2: number ....}
}
```

Players compete for influence in each constituency.

The player with the majority control the constituency.

Some constituencies should be more valuable than others.

On turn Player can use powers on controling constituency like:
transfering any one voter to adjecent constituency.

---

# 9. TURN SYSTEM

Each turn should follow this structure:

```text
START TURN
    ↓
Political Decision
    ↓
Receive Effects
    ↓
Action Phase
    ↓
Optional Event Resolution
    ↓
End Turn
```

During the Action Phase, players can perform a limited number of actions.

Examples:

1. use majority constituency power (transfering any one voter to adjecent constituency)
2. buy power card. (power card will be assign randomly, player dont know what it will be, it could be power to buyer or any opposition players)
3. add voters to board.

Actions must consume appropriate resources.

---

# 10. Power cards

1. it could be fetch 8 resource from other player.
2. give our 8 resource to any player.
3. evict 4 voters.
4. get new voters.
5. convert any 5 voters.
6. 2 chances miss
7. double chance (2 situation cards)
8. reduce 1 chance of any other player.

etc

---

# 11. Resource cards

each situation question's answer will be more dominate toward one ideology. after that answer u will get that ideology card.

example:
situation: should government take all control of education and make education free?

yes: 2 communism, 1 fasiasm, 1 socialism (Communism Card)
No: 3 capitalism, 1 socialism. (Capitalist Card)

after collecting 3 card you will get 4 resources of same type in exchange.
after collecting 8 cards you will get bellow powers

Capitalism: convert any 3 voters. (you can covert any 3 to any players voters)
Communism: fetch all resources of any 2 players.
Socialism: get 5 new voters
Fascism: evict any 5 voters from non majority states.

# 14. WINNING THE GAME

The winner should be determined through an election scoring system.

At the end of the game:

```text
Election Results
```

Calculate:

weightConstituenciesControlled
(sum of weight of controlled constituentcies)
weight is determined by no of voters.

Example:

```ts
interface ElectionResult {
  playerId: string;

  SumOfweightConstituenciesControlled: number;
}
```

The player with the highest score wins the **THRONE**.

---

# 15. MULTIPLAYER SYSTEM

Use Socket.IO.

Required events:

### Lobby

```text
CREATE_ROOM
JOIN_ROOM
LEAVE_ROOM
PLAYER_READY
START_GAME
```

### Gameplay

```text
MAKE_DECISION
PERFORM_ACTION
PLACE_INFLUENCE
USE_POWER
END_TURN
```

### Server Events

```text
ROOM_UPDATED
GAME_STARTED
GAME_STATE_UPDATED
TURN_STARTED
PLAYER_DISCONNECTED
PLAYER_RECONNECTED
GAME_FINISHED
ERROR
```

Use typed Socket.IO events.

Example:

```ts
interface ClientToServerEvents {
  createRoom: (...args: any[]) => void;
  joinRoom: (...args: any[]) => void;
  makeDecision: (...args: any[]) => void;
  performAction: (...args: any[]) => void;
  placeInfluence: (...args: any[]) => void;
  endTurn: (...args: any[]) => void;
}

interface ServerToClientEvents {
  gameStateUpdated: (game: GameState) => void;
  error: (message: string) => void;
}
```

Improve these types properly instead of leaving `any`.

---

# 16. GAME STATE

Create a central game state.

Example:

```ts
interface GameState {
  id: string;

  roomCode: string;

  status: "LOBBY" | "PLAYING" | "FINISHED";

  players: Player[];

  board: Constituency[];

  currentPlayerId: string;

  currentRound: number;

  maxRounds: number;

  phase: "DECISION" | "ACTION" | "INFLUENCE" | "EVENT";

  decisionDeck: string[];

  eventDeck: string[];

  actionLog: GameLog[];

  createdAt: number;
}
```

Do not expose hidden information to clients.

If cards are private, send each player only the information they are allowed to see.

---

# 17. IN-MEMORY GAME STORAGE

For the MVP:

```ts
const games = new Map<string, GameState>();
```

Implement a proper GameManager class.

Example:

```ts
class GameManager {
  private games = new Map<string, GameState>();

  createGame(): GameState {}

  joinGame(): void {}

  startGame(): void {}

  getGame(): GameState | undefined {}

  makeMove(): void {}

  deleteGame(): void {}
}
```

Make this architecture easy to replace later with:

- PostgreSQL.
- Redis.
- Supabase.

---

# 18. RECONNECTION

Players should be able to reconnect.

Each player should have a persistent temporary player token.

When a socket disconnects:

```text
Player disconnects
       ↓
Mark player as disconnected
       ↓
Do not immediately remove player
       ↓
Allow reconnection
       ↓
Restore game state
```

For the MVP, implement a reasonable reconnection timeout.

---

# 19. UI DESIGN

The game should feel premium, strategic, and cinematic.

Theme:

- Dark political atmosphere.
- Deep navy.
- Black.
- Gold accents.
- Subtle red highlights.
- Elegant typography.
- Modern board game aesthetic.

The main game screen should include:

board at center.
each player can see own resources and card only.
whenever a situation card open.
all player can see card and can see what decision other player take and how many resource they get.
if they buy any power card, other player know that they bought power card but cant see power.
all players can see how many voters present of each player in each constituency.

````

Create these pages:

### `/`

Landing page.

Features:

* THRONE logo.
* Create Game.
* Join Game.
* How to Play.

### `/lobby/[roomCode]`

Lobby.

Features:

* Player list.
* Room code.
* Copy button.
* Ready status.
* Start Game button for host.

### `/game/[roomCode]`

Main game.

Features:

* Board.
* Players.
* Resources.
* Cards.
* Turn indicator.
* Action panel.
* Event notifications.
* Game log.

---

# 20. ANIMATIONS

Use subtle animations.

Examples:

* Card flip.
* Card draw.
* Constituency control transition.
* Resource increase/decrease.
* Turn transition.
* Election result reveal.

Do not overuse animations.

Gameplay clarity is more important.

---

# 21. FOLDER STRUCTURE

Use a clean structure.

Example:

```text
src/
│
├── app/
│   ├── page.tsx
│   ├── lobby/
│   │   └── [roomCode]/
│   └── game/
│       └── [roomCode]/
│
├── components/
│   ├── game/
│   ├── lobby/
│   ├── board/
│   └── ui/
│
├── game/
│   ├── engine/
│   │   ├── GameEngine.ts
│   │   ├── TurnManager.ts
│   │   ├── BoardManager.ts
│   │   └── ResourceManager.ts
│   │
│   ├── cards/
│   │   ├── decisions.ts
│   │   ├── events.ts
│   │   └── powers.ts
│   │
│   ├── types/
│   │   ├── game.ts
│   │   ├── player.ts
│   │   └── board.ts
│   │
│   └── constants/
│
├── server/
│   ├── socket/
│   ├── GameManager.ts
│   └── index.ts
│
├── store/
│
└── lib/
````

---

# 22. DEVELOPMENT APPROACH

DO NOT attempt to build everything at once.

Build in phases.

## PHASE 1 — Project Setup

Create:

- Next.js project.
- TypeScript configuration.
- Tailwind.
- ShadCN.
- Basic UI theme.

## PHASE 2 — Multiplayer Lobby

Implement:

- Socket.IO server.
- Create room.
- Join room.
- Player list.
- Room synchronization.

## PHASE 3 — Game Engine

Implement:

- GameState.
- Players.
- Turns.
- Phases.
- Server validation.

Write the game engine so it can be unit tested independently.

## PHASE 4 — Board

Implement:

- Constituencies.
- Majority.
- Control calculation.

## PHASE 5 — Cards

Implement:

- decisions cards.
- voter cards.
- Special powers.

Create at least 20 original decision cards initially.

## PHASE 6 — Full Gameplay

Connect:

```text
Decision
↓
Resources
↓
Action
↓
Influence
↓
Event
↓
Next Player
```

## PHASE 7 — Election Results

Implement:

- Score calculation.
- Winner.
- Results screen.

---

# 23. CODING RULES

Follow these rules strictly:

1. Use TypeScript everywhere.
2. Avoid `any`.
3. Keep game logic separate from React components.
4. Make the server authoritative.
5. Validate every multiplayer action.
6. Never trust resource values sent by clients.
7. Use reusable components.
8. Keep the game state serializable.
9. Add proper error handling.
10. Add comments only where necessary.
11. Use clean naming conventions.
12. Avoid huge components.
13. Make all game rules configurable.
14. Make the UI responsive.
15. Build one phase at a time.
16. Do not introduce a database yet.
17. Do not introduce authentication yet.

---

# 24. START NOW

Start with **PHASE 1**.

First:

1. Initialize the project architecture.
2. Create the THRONE visual theme.
3. Create the landing page.
4. Add Create Game and Join Game UI.
5. Set up the base folder structure.

After completing Phase 1, explain:

- What files were created.
- Why the architecture was chosen.
- How to run the project.

Then proceed to the next phase only after the current phase is complete and working.
