"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Pair, Player } from "../lib/types/game";
import { getAllPots, isMyPair } from "@/lib/utils/gameHelpers";
import { useNumberRollup } from "@/lib/hooks/useNumberRollup";
import { ANIMATION_DURATIONS, SPRING_CONFIGS } from "@/party/consts";

interface PotSummaryProps {
  pairs: Pair[];
  players: Record<string, Player>;
  myPlayerId: string;
  countdownValue: number;
}

function PotRow({
  player1,
  player2,
  pot,
  isMyMatchup,
  delay = 0,
}: {
  player1: Player;
  player2: Player;
  pot: number;
  isMyMatchup: boolean;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const animatedPot = useNumberRollup(pot, ANIMATION_DURATIONS.numberRollup.pot);

  const player1Bet = player1.currentBet || 0;
  const player2Bet = player2.currentBet || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: ANIMATION_DURATIONS.generic.reducedMotion / 1000, delay }
          : { ...SPRING_CONFIGS.default, delay }
      }
      className={`
        p-4 rounded-lg
        ${isMyMatchup ? "bg-blue-900/40 border-2 border-blue-500" : "bg-gray-800/50 opacity-70"}
      `}
    >
      <div className="flex items-center justify-between gap-2 text-sm sm:text-base">
        {/* Player 1 */}
        <div className="flex-1 text-left">
          <span className="font-semibold">
            {player1.name} {player1.isBot && "🤖"}
          </span>
          <span className="text-gray-400 ml-1">({player1Bet})</span>
        </div>

        {/* Pot calculation */}
        <div className="flex-shrink-0 text-center">
          <span className="text-gray-400">+</span>
        </div>

        {/* Player 2 */}
        <div className="flex-1 text-center">
          <span className="font-semibold">
            {player2.name} {player2.isBot && "🤖"}
          </span>
          <span className="text-gray-400 ml-1">({player2Bet})</span>
        </div>

        {/* Equals */}
        <div className="flex-shrink-0 text-center">
          <span className="text-gray-400">=</span>
        </div>

        {/* Animated pot value */}
        <div className="flex-shrink-0 text-right min-w-[80px]">
          <motion.span
            key={pot}
            className={`font-bold text-lg ${isMyMatchup ? "text-yellow-400" : "text-green-400"}`}
          >
            {animatedPot} 🪙
          </motion.span>
        </div>
      </div>

      {/* Side assignments */}
      {isMyMatchup && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {player1.assignedSide} vs {player2.assignedSide}
        </div>
      )}
    </motion.div>
  );
}

export function PotSummary({
  pairs,
  players,
  myPlayerId,
  countdownValue,
}: PotSummaryProps) {
  const allPots = getAllPots(pairs, players);

  // Separate my matchup from others
  const myMatchup = allPots.find((potInfo) =>
    isMyPair(potInfo.pair, myPlayerId)
  );
  const otherMatchups = allPots.filter(
    (potInfo) => !isMyPair(potInfo.pair, myPlayerId)
  );

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      {/* Countdown timer */}
      <div className="text-center mb-6">
        <motion.div
          key={countdownValue}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_CONFIGS.countdown}
          className="text-6xl font-bold text-red-400"
        >
          {countdownValue}
        </motion.div>
        <div className="text-sm text-gray-400 mt-2">Flipping soon...</div>
      </div>

      {/* My matchup */}
      {myMatchup && (
        <div>
          <div className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wide">
            Your Matchup
          </div>
          <PotRow
            player1={myMatchup.player1}
            player2={myMatchup.player2}
            pot={myMatchup.pot}
            isMyMatchup={true}
            delay={0}
          />
        </div>
      )}

      {/* Other matchups */}
      {otherMatchups.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
            Other Matchups
          </div>
          <div className="space-y-2">
            {otherMatchups.map((potInfo, index) => (
              <PotRow
                key={potInfo.pair.player1Id + potInfo.pair.player2Id}
                player1={potInfo.player1}
                player2={potInfo.player2}
                pot={potInfo.pot}
                isMyMatchup={false}
                delay={ANIMATION_DURATIONS.potSummary.staggerDelay / 1000 * (index + 1)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No matchup message (sitting out) */}
      {!myMatchup && otherMatchups.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-2xl mb-2">💤</div>
          <div>You're sitting out this round</div>
        </div>
      )}
    </div>
  );
}
