"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CoinSide } from "../lib/types/game";
import { ANIMATION_DURATIONS, SPRING_CONFIGS } from "@/party/consts";

interface CoinFlipProps {
  result: CoinSide;
  timestamp: number;
  animationDuration?: number;
}

export function CoinFlip({
  result,
  timestamp,
  animationDuration = ANIMATION_DURATIONS.coinFlip.duration
}: CoinFlipProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Calculate delay until synchronized start
    const delay = Math.max(0, timestamp - Date.now());

    const startTimeout = setTimeout(() => {
      setIsAnimating(true);

      // Show result after animation completes
      const resultTimeout = setTimeout(() => {
        setIsAnimating(false);
        setShowResult(true);
      }, animationDuration);

      return () => clearTimeout(resultTimeout);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [timestamp, animationDuration]);

  if (!isAnimating && !showResult) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-400">Preparing flip...</div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={SPRING_CONFIGS.gentle}
          className="text-6xl mb-4"
        >
          {result === "HEADS" ? "👤" : "🦅"}
        </motion.div>
        <div className="text-2xl font-bold">{result}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-48">
      {shouldReduceMotion ? (
        // Simple pulsing animation for reduced motion
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-6xl"
        >
          🪙
        </motion.div>
      ) : (
        // 3D flip animation
        <motion.div
          className="text-6xl"
          animate={{
            rotateY: [0, 1800], // 5 full rotations
          }}
          transition={{
            duration: animationDuration / 1000,
            ease: "easeInOut",
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          🪙
        </motion.div>
      )}
    </div>
  );
}
