"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Player } from "../lib/types/game";

interface MatchupRevealProps {
  myPlayer: Player;
  opponent: Player | null;
  onComplete: () => void;
}

export function MatchupReveal({
  myPlayer,
  opponent,
  onComplete,
}: MatchupRevealProps) {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Total animation duration: 3 seconds
    // Hold for 2.5s then fade out (0.5s)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Call onComplete after exit animation finishes
  const handleExitComplete = () => {
    onComplete();
  };

  const transition = shouldReduceMotion
    ? { duration: 0.3 }
    : { type: "spring", stiffness: 300, damping: 30 };

  const coinEmoji = myPlayer.assignedSide === "HEADS" ? "👤" : "🦅";
  const coinLabel = myPlayer.assignedSide;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center space-y-8 px-4">
            {/* Coin side display */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.3, delay: 0.2 }
                  : { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }
              }
              className="text-center"
            >
              <div className="text-9xl mb-4">{coinEmoji}</div>
              <div className="text-4xl font-bold text-blue-400">{coinLabel}</div>
            </motion.div>

            {/* VS indicator */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.3, delay: 0.5 }
                  : { type: "spring", stiffness: 300, damping: 25, delay: 0.5 }
              }
              className="text-3xl font-bold text-gray-400"
            >
              VS
            </motion.div>

            {/* Opponent info */}
            {opponent ? (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.3, delay: 0.8 }
                    : { ...transition, delay: 0.8 }
                }
                className="text-center"
              >
                <div className="text-2xl font-bold text-white mb-2">
                  {opponent.name} {opponent.isBot && "🤖"}
                </div>
                <div className="text-lg text-gray-400">
                  {opponent.assignedSide}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.3, delay: 0.8 }
                    : { ...transition, delay: 0.8 }
                }
                className="text-center"
              >
                <div className="text-2xl font-bold text-gray-400">
                  No Opponent
                </div>
                <div className="text-sm text-gray-500">
                  You sit out this round
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
