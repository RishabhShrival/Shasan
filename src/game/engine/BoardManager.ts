import { MAX_SEATS, MIN_SEATS, majorityThreshold } from "../constants/board";
import type { Constituency, ConstituencyDefinition } from "../types/board";

export class BoardManagerError extends Error {}

export class BoardManager {
  constructor(private readonly definitions: ConstituencyDefinition[]) {
    this.assertValidDefinitions();
  }

  createBoard(playerIds: string[]): Constituency[] {
    const voterCounts = Object.fromEntries(playerIds.map((playerId) => [playerId, 0]));
    return this.definitions.map((definition) => ({
      ...definition,
      adjacentConstituencyIds: [...definition.adjacentConstituencyIds],
      voterCounts: { ...voterCounts },
      totalVoters: 0,
      majorityThreshold: majorityThreshold(definition.seats),
      controllingPlayerId: undefined,
    }));
  }

  getConstituency(board: Constituency[], constituencyId: unknown) {
    const constituency = typeof constituencyId === "string" ? board.find((candidate) => candidate.id === constituencyId) : undefined;
    if (!constituency) throw new BoardManagerError("That constituency does not exist.");
    return constituency;
  }

  freeSeats(constituency: Constituency) {
    return constituency.seats - constituency.totalVoters;
  }

  addVoters(board: Constituency[], constituencyId: string, playerId: string, count: number) {
    if (!Number.isInteger(count) || count <= 0) throw new BoardManagerError("Voter count must be a positive whole number.");
    const constituency = this.getConstituency(board, constituencyId);
    if (!(playerId in constituency.voterCounts)) throw new BoardManagerError("This player is not on this board.");
    if (constituency.lockedByPlayerId) throw new BoardManagerError(`${constituency.name} is under Section 144. No voters can be added there right now.`);
    if (this.freeSeats(constituency) < count) {
      throw new BoardManagerError(`${constituency.name} has only ${this.freeSeats(constituency)} free seat(s).`);
    }
    constituency.voterCounts[playerId] += count;
    this.recalculateControl(constituency);
    return constituency;
  }

  removeVoters(board: Constituency[], constituencyId: string, playerId: string, count: number) {
    const constituency = this.getConstituency(board, constituencyId);
    const amount = Math.min(count, constituency.voterCounts[playerId] ?? 0);
    if (amount < 1) throw new BoardManagerError("That player has no voters in this constituency.");
    constituency.voterCounts[playerId] -= amount;
    this.recalculateControl(constituency);
    return amount;
  }

  /** Converts rival voters into the actor's voters (seat count is unchanged). */
  convertVoters(board: Constituency[], constituencyId: string, fromPlayerId: string, toPlayerId: string, count: number) {
    const constituency = this.getConstituency(board, constituencyId);
    const amount = Math.min(count, constituency.voterCounts[fromPlayerId] ?? 0);
    if (amount < 1) throw new BoardManagerError("That player has no voters in this constituency.");
    constituency.voterCounts[fromPlayerId] -= amount;
    constituency.voterCounts[toPlayerId] += amount;
    this.recalculateControl(constituency);
    return amount;
  }

  /** Moves `count` voters owned by `ownerId`. Adjacency is required unless `anywhere` is set. */
  moveVoters(board: Constituency[], fromId: string, toId: string, ownerId: string, count: number, anywhere = false) {
    const source = this.getConstituency(board, fromId);
    const destination = this.getConstituency(board, toId);
    if (source.id === destination.id) throw new BoardManagerError("Choose two different constituencies.");
    if (!anywhere && !source.adjacentConstituencyIds.includes(destination.id)) {
      throw new BoardManagerError("Voters can only move to an adjacent constituency.");
    }
    if ((source.voterCounts[ownerId] ?? 0) < count) throw new BoardManagerError("There are not enough of those voters to move.");
    if (destination.lockedByPlayerId) throw new BoardManagerError(`${destination.name} is under Section 144. No voters can enter.`);
    if (this.freeSeats(destination) < count) throw new BoardManagerError(`${destination.name} does not have enough free seats.`);
    source.voterCounts[ownerId] -= count;
    destination.voterCounts[ownerId] += count;
    this.recalculateControl(source);
    this.recalculateControl(destination);
    return { source, destination };
  }

  /** A player has a majority only with MORE than half of all seats — not merely the most voters. */
  recalculateControl(constituency: Constituency) {
    constituency.totalVoters = Object.values(constituency.voterCounts).reduce((total, count) => total + count, 0);
    const leader = Object.entries(constituency.voterCounts).find(([, count]) => count > constituency.seats / 2);
    constituency.controllingPlayerId = leader?.[0];
    return constituency.controllingPlayerId;
  }

  /** Whether the player has the highest voter count (optionally allowing ties). */
  hasLead(constituency: Constituency, playerId: string, allowTie: boolean) {
    const own = constituency.voterCounts[playerId] ?? 0;
    if (own < 1) return false;
    return Object.entries(constituency.voterCounts).every(([otherId, count]) =>
      otherId === playerId || (allowTie ? own >= count : own > count),
    );
  }

  allHaveMajority(board: Constituency[]) {
    return board.length > 0 && board.every((constituency) => Boolean(constituency.controllingPlayerId));
  }

  totalVoters(board: Constituency[], playerId: string) {
    return board.reduce((total, constituency) => total + (constituency.voterCounts[playerId] ?? 0), 0);
  }

  private assertValidDefinitions() {
    const ids = new Set(this.definitions.map((definition) => definition.id));
    if (ids.size !== this.definitions.length) throw new BoardManagerError("Board constituencies must have unique ids.");

    for (const definition of this.definitions) {
      if (!Number.isInteger(definition.seats) || definition.seats % 2 === 0 || definition.seats < MIN_SEATS || definition.seats > MAX_SEATS) {
        throw new BoardManagerError(`${definition.name} must have an odd number of seats between ${MIN_SEATS} and ${MAX_SEATS}.`);
      }
      for (const adjacentId of definition.adjacentConstituencyIds) {
        const adjacent = this.definitions.find((candidate) => candidate.id === adjacentId);
        if (!adjacent) throw new BoardManagerError(`Unknown adjacent constituency: ${adjacentId}.`);
        if (!adjacent.adjacentConstituencyIds.includes(definition.id)) {
          throw new BoardManagerError(`Adjacency must be reciprocal: ${definition.id} and ${adjacentId}.`);
        }
      }
    }
  }
}
