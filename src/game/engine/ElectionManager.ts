import type { Constituency, ElectionResults, GamePlayer } from "../types";

export class ElectionManager {
  calculate(board: Constituency[], players: GamePlayer[]): ElectionResults {
    const standings = players.map((player) => {
      const controlled = board.filter((constituency) => constituency.controllingPlayerId === player.id);
      return {
        playerId: player.id,
        constituenciesControlled: controlled.length,
        seatsWon: controlled.reduce((total, constituency) => total + constituency.seats, 0),
        totalVoters: board.reduce((total, constituency) => total + (constituency.voterCounts[player.id] ?? 0), 0),
      };
    }).sort((left, right) =>
      right.seatsWon - left.seatsWon ||
      right.totalVoters - left.totalVoters ||
      right.constituenciesControlled - left.constituenciesControlled,
    );

    const best = standings[0];
    const winners = best
      ? standings.filter((standing) =>
        standing.seatsWon === best.seatsWon &&
        standing.totalVoters === best.totalVoters &&
        standing.constituenciesControlled === best.constituenciesControlled)
      : [];
    return {
      standings,
      winnerPlayerIds: winners.map((standing) => standing.playerId),
      isTie: winners.length > 1,
    };
  }
}
