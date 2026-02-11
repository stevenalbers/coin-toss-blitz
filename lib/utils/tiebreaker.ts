
import { ROUND_TIME } from "@/party/consts";
import type { Player } from "../types/game";

/**
 * Calculates average lock-in time for a player
 *
 * Only counts rounds where player manually locked in (not timed out).
 * If player never locked in manually (all timeouts), returns maximum penalty (30000ms).
 *
 * @param lockInTimes - Array of timestamps (null = timed out)
 * @returns Average lock-in time in milliseconds
 */
export function calculateAvgLockInTime(lockInTimes: (number | null)[]): number {
  // Filter out null values (timeouts)
  const manualLockIns = lockInTimes.filter((t): t is number => t !== null);

  // If player never locked in manually, maximum penalty
  if (manualLockIns.length === 0) {
    return ROUND_TIME;
  }

  // Calculate average
  const sum = manualLockIns.reduce((acc, time) => acc + time, 0);
  return sum / manualLockIns.length;
}

/**
 * Sorts players by chips (descending), with tiebreaker by average lock-in time (ascending)
 *
 * Sorting rules:
 * 1. Primary: Chip count (higher is better)
 * 2. Tiebreaker: Average lock-in time (faster/lower is better)
 *
 * @param players - Array of players to sort
 * @returns Sorted array (does not mutate original)
 */
export function sortPlayersWithTiebreaker(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    // Primary sort: chips (descending - higher chips = higher placement)
    if (a.chips !== b.chips) {
      return b.chips - a.chips;
    }

    // Tiebreaker: average lock-in time (ascending - faster = higher placement)
    const avgA = calculateAvgLockInTime(a.lockInTimes);
    const avgB = calculateAvgLockInTime(b.lockInTimes);
    return avgA - avgB;
  });
}

/**
 * Formats milliseconds to seconds with 1 decimal place
 * @example formatLockInTime(12345) => "12.3s"
 */
export function formatLockInTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
