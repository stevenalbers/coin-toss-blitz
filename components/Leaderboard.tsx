"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Player } from "../lib/types/game";
import { sortPlayersWithTiebreaker, formatLockInTime, calculateAvgLockInTime } from "../lib/utils/tiebreaker";
import { useNumberRollup } from "@/lib/hooks/useNumberRollup";
import { ANIMATION_DURATIONS, SPRING_CONFIGS } from "@/party/consts";

interface LeaderboardProps {
  players: Player[];
  myPlayerId: string | null;
  currentRound: number;
  totalRounds: number;
  showTiebreaker?: boolean;
  animatePositions?: boolean;
}

function PlayerRow({
  player,
  placement,
  isMe,
  showTiebreaker,
  animatePositions,
}: {
  player: Player;
  placement: number;
  isMe: boolean;
  showTiebreaker: boolean;
  animatePositions: boolean;
}) {
  const shouldReduceMotion = useReducedMotion();
  const previousChipsRef = useRef(player.chips);

  // Always call useNumberRollup to maintain hook order
  const animatedChips = useNumberRollup(player.chips, ANIMATION_DURATIONS.numberRollup.chips);

  // Use animated or static value based on animatePositions prop
  const displayChips = animatePositions ? animatedChips : player.chips;

  // Calculate chip change for color flash
  const chipChange = player.chips - previousChipsRef.current;

  // Update previous chips after animation
  useEffect(() => {
    if (!animatePositions) {
      previousChipsRef.current = player.chips;
    } else {
      const timer = setTimeout(() => {
        previousChipsRef.current = player.chips;
      }, ANIMATION_DURATIONS.numberRollup.chips);
      return () => clearTimeout(timer);
    }
  }, [player.chips, animatePositions]);

  const transition = shouldReduceMotion
    ? { duration: ANIMATION_DURATIONS.generic.reducedMotion / 1000 }
    : SPRING_CONFIGS.default;

  return (
    <motion.div
      layoutId={animatePositions ? `player-${player.id}` : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={transition}
      className={`
        flex items-center justify-between p-3 rounded
        ${isMe ? "bg-blue-900/50 border-2 border-blue-500" : "bg-gray-800"}
        ${player.eliminated ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Placement */}
        <div className="text-lg font-bold text-gray-400 w-8">
          #{placement}
        </div>

        {/* Player name and badges */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isMe ? "text-blue-300" : ""}`}>
              {player.name}
              {isMe && " (You)"}
            </span>

            {/* Badges */}
            <div className="flex gap-1">
              {player.isHost && (
                <span className="text-xs" title="Host">
                  👑
                </span>
              )}
              {player.isBot && (
                <span className="text-xs" title="Bot">
                  🤖
                </span>
              )}
              {player.eliminated && (
                <span className="text-xs" title="Eliminated">
                  ⚠️
                </span>
              )}
            </div>
          </div>

          {/* Tiebreaker info */}
          {showTiebreaker && player.lockInTimes.length > 0 && (
            <span className="text-xs text-gray-500">
              Avg lock-in: {formatLockInTime(calculateAvgLockInTime(player.lockInTimes))}
            </span>
          )}
        </div>
      </div>

      {/* Chips */}
      <div className="text-right">
        {animatePositions && chipChange !== 0 ? (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: ANIMATION_DURATIONS.generic.medium / 1000 }}
            className={`text-lg font-bold ${
              chipChange > 0
                ? "text-green-400"
                : chipChange < 0
                  ? "text-red-400"
                  : player.chips > 0
                    ? "text-green-400"
                    : "text-red-400"
            }`}
          >
            {displayChips} 🪙
          </motion.div>
        ) : (
          <div
            className={`text-lg font-bold ${
              player.chips > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {displayChips} 🪙
          </div>
        )}
        {player.eliminated && (
          <div className="text-xs text-yellow-500">Eliminated</div>
        )}
      </div>
    </motion.div>
  );
}

export function Leaderboard({
  players,
  myPlayerId,
  currentRound,
  totalRounds,
  showTiebreaker = false,
  animatePositions = false,
}: LeaderboardProps) {
  const sortedPlayers = sortPlayersWithTiebreaker(players);

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Leaderboard</h2>
        <div className="text-sm text-gray-400">
          Round {currentRound}/{totalRounds}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const isMe = player.id === myPlayerId;
            const placement = index + 1;

            return (
              <PlayerRow
                key={player.id}
                player={player}
                placement={placement}
                isMe={isMe}
                showTiebreaker={showTiebreaker}
                animatePositions={animatePositions}
              />
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
}
