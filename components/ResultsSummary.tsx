"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Player, CoinSide } from "../lib/types/game";
import { useNumberRollup, formatChipChange } from "@/lib/hooks/useNumberRollup";
import { ANIMATION_DURATIONS, SPRING_CONFIGS } from "@/party/consts";

interface ResultsSummaryProps {
  myPlayer: Player | null;
  flipResult: CoinSide;
  chipChange: number;
  onAnimationComplete: () => void;
}

export function ResultsSummary({
  myPlayer,
  flipResult,
  chipChange,
  onAnimationComplete,
}: ResultsSummaryProps) {
  const shouldReduceMotion = useReducedMotion();

  // Animate chip change from 0 to actual change
  const animatedChange = useNumberRollup(Math.abs(chipChange), ANIMATION_DURATIONS.numberRollup.chipChange);

  // Determine if player won
  const didWin = myPlayer && myPlayer.assignedSide === flipResult;
  const isEliminated = myPlayer?.eliminated;

  useEffect(() => {
    // Call completion callback after animation duration
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, ANIMATION_DURATIONS.results.total);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  // If no player or sitting out
  if (!myPlayer) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-lg p-8 text-center"
      >
        <div className="text-4xl mb-4">💤</div>
        <div className="text-xl font-bold text-gray-400">You sat out this round</div>
      </motion.div>
    );
  }

  // Flip result display
  const resultEmoji = flipResult === "HEADS" ? "👤" : "🦅";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: ANIMATION_DURATIONS.generic.reducedMotion / 1000 }
          : SPRING_CONFIGS.default
      }
      className="bg-gray-900 rounded-lg p-8 text-center space-y-6"
    >
      {/* Flip result */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: ANIMATION_DURATIONS.generic.reducedMotion / 1000, delay: ANIMATION_DURATIONS.results.flipResultDelay / 1000 }
            : { ...SPRING_CONFIGS.gentle, delay: ANIMATION_DURATIONS.results.flipResultDelay / 1000 }
        }
      >
        <div className="text-6xl mb-2">{resultEmoji}</div>
        <div className="text-2xl font-bold text-gray-300">{flipResult}</div>
      </motion.div>

      {/* Win/Loss indicator */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: ANIMATION_DURATIONS.generic.reducedMotion / 1000, delay: ANIMATION_DURATIONS.results.outcomeDelay / 1000 }
            : { ...SPRING_CONFIGS.snappy, delay: ANIMATION_DURATIONS.results.outcomeDelay / 1000 }
        }
      >
        <div className="text-4xl mb-2">
          {didWin ? "🎉" : "😔"}
        </div>
        <div
          className={`text-3xl font-bold ${didWin ? "text-green-400" : "text-red-400"}`}
        >
          {didWin ? "You Won!" : "You Lost"}
        </div>
      </motion.div>

      {/* Animated chip change */}
      {chipChange !== 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: ANIMATION_DURATIONS.generic.reducedMotion / 1000, delay: ANIMATION_DURATIONS.results.chipChangeDelay / 1000 }
              : { ...SPRING_CONFIGS.snappy, delay: ANIMATION_DURATIONS.results.chipChangeDelay / 1000 }
          }
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: ANIMATION_DURATIONS.generic.medium / 1000,
              delay: ANIMATION_DURATIONS.results.chipPulseDelay / 1000,
              repeat: ANIMATION_DURATIONS.results.chipPulseCount,
            }}
            className={`text-4xl font-bold ${
              chipChange > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {chipChange > 0 ? "+" : "-"}
            {animatedChange} 🪙
          </motion.div>

          {/* Eliminated warning */}
          {isEliminated && didWin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: ANIMATION_DURATIONS.results.chipPulseDelay / 1000 + 0.4 }}
              className="mt-4 text-sm text-yellow-400"
            >
              ⚠️ You're eliminated - chips stay at 0
            </motion.div>
          )}
        </motion.div>
      )}

      {/* No change message (both bet 0) */}
      {chipChange === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ANIMATION_DURATIONS.results.chipChangeDelay / 1000 }}
          className="text-gray-400"
        >
          No chips changed hands
        </motion.div>
      )}
    </motion.div>
  );
}
