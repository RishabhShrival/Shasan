import type { Constituency, ElectionResults, GamePlayer } from "../types";

export class ElectionManager {
  calculate(board: Constituency[], players: GamePlayer[]): ElectionResults {
    const standings = players.map((player) => {
      const controlledConstituencies = board.filter((constituency) => constituency.controllingPlayerId === player.id);
      return {
        playerId: player.id,
        constituenciesControlled: controlledConstituencies.length,
        weightConstituenciesControlled: controlledConstituencies.reduce(
          (total, constituency) => total + constituency.electoralWeight,
          0,
        ),
      };
    }).sort((left, right) =>
      right.weightConstituenciesControlled - left.weightConstituenciesControlled ||
      right.constituenciesControlled - left.constituenciesControlled ||
      left.playerId.localeCompare(right.playerId),
    );

    const highestScore = standings[0]?.weightConstituenciesControlled ?? 0;
    const winners = standings.filter((standing) => standing.weightConstituenciesControlled === highestScore);
    return {
      standings,
      winnerPlayerIds: winners.map((standing) => standing.playerId),
      isTie: winners.length > 1,
    };
  }
}
