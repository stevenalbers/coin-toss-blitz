import type { CoinSide } from "../types/game";

export interface PotResult {
  player1Change: number;
  player2Change: number;
}

/**
 * Calculates pot-based chip changes for a pair of players
 *
 * Rules:
 * - Pot = player1Bet + player2Bet
 * - Winner gets the entire pot ADDED to their chips
 * - Loser gets the entire pot SUBTRACTED from their chips
 * - Eliminated players (0 chips) CANNOT win chips - they stay at 0
 * - Eliminated players can still add to pot and cause opponent to lose
 *
 * @example
 * // Both active, unequal bets
 * calculatePotResult(10, 25, "HEADS", "HEADS", false, false)
 * // Returns: { player1Change: 35, player2Change: -35 }
 *
 * @example
 * // Eliminated player wins (cruel!)
 * calculatePotResult(25, 25, "TAILS", "HEADS", false, true)
 * // Returns: { player1Change: -50, player2Change: 0 } // P2 eliminated, stays at 0
 */
export function calculatePotResult(
  player1Bet: number,
  player2Bet: number,
  winningSide: CoinSide,
  player1Side: CoinSide,
  player1Eliminated: boolean,
  player2Eliminated: boolean
): PotResult {
  const pot = player1Bet + player2Bet;

  // If pot is 0 (both bet 0), no change
  if (pot === 0) {
    return { player1Change: 0, player2Change: 0 };
  }

  if (winningSide === player1Side) {
    // Player 1 wins
    return {
      player1Change: player1Eliminated ? 0 : pot,  // Eliminated can't gain chips
      player2Change: player2Eliminated ? 0 : -pot  // Eliminated stay at 0
    };
  } else {
    // Player 2 wins
    return {
      player1Change: player1Eliminated ? 0 : -pot, // Eliminated stay at 0
      player2Change: player2Eliminated ? 0 : pot   // Eliminated can't gain chips
    };
  }
}

/**
 * Applies pot result to player chip counts
 * Ensures chips never go negative (Math.max(0, ...))
 */
export function applyPotResult(
  player1Chips: number,
  player2Chips: number,
  result: PotResult
): { player1NewChips: number; player2NewChips: number } {
  return {
    player1NewChips: Math.max(0, player1Chips + result.player1Change),
    player2NewChips: Math.max(0, player2Chips + result.player2Change)
  };
}
