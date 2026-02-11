"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Player, CoinSide } from "../lib/types/game";
import { useNumberRollup, formatChipChange } from "@/lib/hooks/useNumberRollup";

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
  const animatedChange = useNumberRollup(Math.abs(chipChange), 1500);

  // Determine if player won
  const didWin = myPlayer && myPlayer.assignedSide === flipResult;
  const isEliminated = myPlayer?.eliminated;

  useEffect(() => {
    // Call completion callback after animation duration
    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2000);

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
          ? { duration: 0.3 }
          : { type: "spring", stiffness: 300, damping: 30 }
      }
      className="bg-gray-900 rounded-lg p-8 text-center space-y-6"
    >
      {/* Flip result */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0.3, delay: 0.2 }
            : { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }
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
            ? { duration: 0.3, delay: 0.4 }
            : { type: "spring", stiffness: 300, damping: 25, delay: 0.4 }
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
              ? { duration: 0.3, delay: 0.6 }
              : { type: "spring", stiffness: 300, damping: 25, delay: 0.6 }
          }
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              delay: 0.8,
              repeat: 2,
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
              transition={{ delay: 1.2 }}
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
          transition={{ delay: 0.6 }}
          className="text-gray-400"
        >
          No chips changed hands
        </motion.div>
      )}
    </motion.div>
  );
}
