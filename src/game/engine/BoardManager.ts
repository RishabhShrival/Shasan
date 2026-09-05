import type { Constituency, ConstituencyDefinition } from "../types/board";

export class BoardManagerError extends Error {}

export class BoardManager {
  constructor(private readonly definitions: ConstituencyDefinition[]) {
    this.assertValidDefinitions();
  }

  createBoard(playerIds: string[]) {
    const voterCounts = Object.fromEntries(playerIds.map((playerId) => [playerId, 0]));
    return this.definitions.map((definition) => ({
      ...definition,
      voterCounts: { ...voterCounts },
      totalVoters: 0,
      controllingPlayerId: undefined,
    }));
  }

  addVoters(board: Constituency[], constituencyId: string, playerId: string, count: number) {
    if (!Number.isInteger(count) || count <= 0) {
      throw new BoardManagerError("Voter count must be a positive whole number.");
    }

    const constituency = this.getConstituency(board, constituencyId);
    if (!(playerId in constituency.voterCounts)) {
      throw new BoardManagerError("This player is not eligible to influence this constituency.");
    }

    constituency.voterCounts[playerId] += count;
    this.recalculateControl(constituency);
    return constituency;
  }

  transferVoter(board: Constituency[], fromConstituencyId: string, toConstituencyId: string, playerId: string) {
    const source = this.getConstituency(board, fromConstituencyId);
    const destination = this.getConstituency(board, toConstituencyId);

    if (!source.adjacentConstituencyIds.includes(destination.id)) {
      throw new BoardManagerError("Voters can only move between adjacent constituencies.");
    }
    if (!(playerId in source.voterCounts) || !(playerId in destination.voterCounts)) {
      throw new BoardManagerError("This player is not eligible to move voters on this board.");
    }
    if (source.voterCounts[playerId] < 1) {
      throw new BoardManagerError("This player has no voter to transfer from that constituency.");
    }

    source.voterCounts[playerId] -= 1;
    destination.voterCounts[playerId] += 1;
    this.recalculateControl(source);
    this.recalculateControl(destination);
    return { source, destination };
  }

  recalculateControl(constituency: Constituency) {
    constituency.totalVoters = Object.values(constituency.voterCounts).reduce((total, count) => total + count, 0);
    const orderedCounts = Object.entries(constituency.voterCounts).sort(([, left], [, right]) => right - left);
    const leader = orderedCounts[0];
    constituency.controllingPlayerId = leader && leader[1] > constituency.totalVoters / 2 ? leader[0] : undefined;
    return constituency.controllingPlayerId;
  }

  private getConstituency(board: Constituency[], constituencyId: string) {
    const constituency = board.find((candidate) => candidate.id === constituencyId);
    if (!constituency) {
      throw new BoardManagerError("That constituency does not exist.");
    }
    return constituency;
  }

  private assertValidDefinitions() {
    const ids = new Set(this.definitions.map((definition) => definition.id));
    if (ids.size !== this.definitions.length) {
      throw new BoardManagerError("Board constituencies must have unique ids.");
    }

    for (const definition of this.definitions) {
      for (const adjacentId of definition.adjacentConstituencyIds) {
        const adjacent = this.definitions.find((candidate) => candidate.id === adjacentId);
        if (!adjacent) {
          throw new BoardManagerError(`Unknown adjacent constituency: ${adjacentId}.`);
        }
        if (!adjacent.adjacentConstituencyIds.includes(definition.id)) {
          throw new BoardManagerError(`Adjacency must be reciprocal: ${definition.id} and ${adjacentId}.`);
        }
      }
    }
  }
}
