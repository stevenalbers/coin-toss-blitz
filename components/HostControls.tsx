"use client";

import { useState } from "react";
import type { GamePhase } from "../lib/types/game";

interface HostControlsProps {
  phase: GamePhase;
  playerCount: number;
  onStart: () => void;
  onReset: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
}

export function HostControls({
  phase,
  playerCount,
  onStart,
  onReset,
  onPause,
  onResume,
  isPaused,
}: HostControlsProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const botsNeeded = Math.max(0, 10 - playerCount);

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">👑</span>
        <h3 className="font-bold text-purple-200">Host Controls</h3>
      </div>

      {phase === "LOBBY" ? (
        // Lobby controls
        <div className="space-y-3">
          <div className="text-sm text-gray-300">
            <div>Players: {playerCount}/10</div>
            {botsNeeded > 0 && (
              <div className="text-yellow-400">
                ({botsNeeded} bots will be added)
              </div>
            )}
          </div>

          <button
            onClick={onStart}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🎮 Start Game
          </button>
        </div>
      ) : (
        // In-game controls
        <div className="space-y-2">
          {/* Pause/Resume */}
          <button
            onClick={isPaused ? onResume : onPause}
            className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
              isPaused
                ? "bg-green-600 hover:bg-green-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            } text-white`}
          >
            {isPaused ? "▶️ Resume Game" : "⏸️ Pause Game"}
          </button>

          {/* Reset with confirmation */}
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              🔄 Reset Game
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-yellow-400 text-center">
                Are you sure? This will reset the game.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onReset();
                    setShowResetConfirm(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
