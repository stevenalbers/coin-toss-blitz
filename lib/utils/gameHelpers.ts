import type { Pair, Player } from "../types/game";

/**
 * Calculate the total pot for a pair of players
 * @param player1Bet - First player's bet amount
 * @param player2Bet - Second player's bet amount
 * @returns Total pot (sum of both bets)
 */
export function calculatePot(
  player1Bet: number,
  player2Bet: number
): number {
  return player1Bet + player2Bet;
}

/**
 * Get all pots for display with player information
 * @param pairs - Array of player pairs
 * @param players - Record of all players by ID
 * @returns Array of pot information including pair, players, and pot total
 */
export function getAllPots(
  pairs: Pair[],
  players: Record<string, Player>
): Array<{
  pair: Pair;
  player1: Player;
  player2: Player;
  pot: number;
}> {
  return pairs.map((pair) => {
    const player1 = players[pair.player1Id];
    const player2 = players[pair.player2Id];
    const pot = calculatePot(
      player1.currentBet || 0,
      player2.currentBet || 0
    );

    return { pair, player1, player2, pot };
  });
}

/**
 * Check if a pair involves a specific player
 * @param pair - The pair to check
 * @param myPlayerId - The player ID to look for
 * @returns True if the player is in this pair
 */
export function isMyPair(pair: Pair, myPlayerId: string): boolean {
  return pair.player1Id === myPlayerId || pair.player2Id === myPlayerId;
}
