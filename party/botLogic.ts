/**
 * Bot AI logic for automated players
 *
 * Bots behave differently based on whether they're eliminated:
 * - Active bots: Bet 10, 25, or 50 (weighted random, never all-in)
 * - Eliminated bots: Bet 0, 10, or 25 (weighted random)
 * - Lock-in timing: Random delay between 5-25 seconds
 */

import { BET_OPTIONS, ROUND_TIME } from "./consts";

/**
 * Weighted random selection from array
 * @param options - Array of values to choose from
 * @param weights - Array of weights (must sum to 1.0 or close to it)
 */
function weightedRandom<T>(options: T[], weights: number[]): T {
  const random = Math.random();
  let sum = 0;

  for (let i = 0; i < options.length; i++) {
    sum += weights[i];
    if (random < sum) {
      return options[i];
    }
  }

  // Fallback (should never happen if weights sum to ~1.0)
  return options[options.length - 1];
}

/**
 * Generates a random bet amount for a bot
 *
 * Active bots (>0 chips):
 * - 40% chance: 10 chips
 * - 40% chance: 25 chips
 * - 20% chance: 50 chips
 *
 * Eliminated bots (0 chips):
 * - 20% chance: 0 chips
 * - 50% chance: 10 chips
 * - 30% chance: 25 chips
 *
 * @param isEliminated - Whether bot has 0 chips
 * @param currentRound - Current round number (1-10), unused for now but could affect strategy
 * @returns Bet amount
 */
export function generateBotBet(isEliminated: boolean, currentRound: number): number {
  if (isEliminated) {
    // Eliminated bots: 0, 10, or 25
    const options = BET_OPTIONS.eliminated;
    const weights = [0.2, 0.5, 0.3]; // 20% = 0, 50% = 10, 30% = 25
    return weightedRandom(options, weights);
  } else {
    // Active bots: 10, 25, or 50 (NEVER all-in, even in round 10)
    const options = currentRound >= 7 ? BET_OPTIONS.high : BET_OPTIONS.low;
    const weights = [0.4, 0.4, 0.2]; // 40% = 10, 40% = 25, 20% = 50
    return weightedRandom(options, weights);
  }
}

/**
 * Generates a random lock-in delay for a bot (in milliseconds)
 *
 * Bots lock in between 5-25 seconds to appear realistic.
 * This creates staggered lock-ins instead of all bots locking simultaneously.
 *
 * @returns Delay in milliseconds (5000-25000ms)
 */
export function generateBotLockInDelay(): number {
  // Random delay between 20%-80% of total time
  const minDelay = ROUND_TIME * .2;
  const maxDelay = ROUND_TIME * .8;
  return Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
}

/**
 * Creates a bot player object
 *
 * @param botNumber - Bot number (1, 2, 3, etc.)
 * @returns Player object configured as a bot
 */
export function createBotPlayer(botNumber: number) {
  return {
    id: `bot-${botNumber}`,
    name: `Bot ${botNumber}`,
    chips: 100,
    connected: true,
    isBot: true,
    isHost: false,
    eliminated: false,
    lockInTimes: [],
    currentBet: null,
    currentBetLockTime: null,
    betStatus: "selecting" as const,
    assignedSide: null,
    pairedWith: null,
    sittingOut: false
  };
}
