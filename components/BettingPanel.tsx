"use client";

import { useState, useEffect } from "react";
import type { Player } from "../lib/types/game";
import type { ClientMessage } from "../lib/types/game";
import { BET_OPTIONS } from "@/party/consts";

interface BettingPanelProps {
  myPlayer: Player;
  opponent: Player | null;
  deadline: number;
  currentRound: number;
  onSelectBet: (amount: number) => void;
  onLockBet: () => void;
}

export function BettingPanel({
  myPlayer,
  opponent,
  deadline,
  currentRound,
  onSelectBet,
  onLockBet,
}: BettingPanelProps) {
  const [selectedBet, setSelectedBet] = useState<number | null>(myPlayer.currentBet);
  const [timeLeft, setTimeLeft] = useState(0);

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [deadline]);

  // Determine available bet options
  const betOptions = myPlayer.eliminated
    ? BET_OPTIONS.eliminated // Eliminated players
    : currentRound >= 7
      ? BET_OPTIONS.high
      : BET_OPTIONS.low;
  // ? [10, 25, 50, myPlayer.chips] // Round 10: include all-in
  // : [10, 25, 50]; // Active players rounds 1-9

  const isLocked = myPlayer.betStatus === "locked";
  const isTimedOut = myPlayer.betStatus === "timed_out";

  const handleBetSelect = (amount: number) => {
    if (isLocked || isTimedOut) return;
    setSelectedBet(amount);
    onSelectBet(amount);
  };

  const handleLockIn = () => {
    if (!selectedBet || isLocked || isTimedOut) return;
    onLockBet();
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      {/* Timer */}
      <div className="text-center">
        <div className={`text-4xl font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-blue-400"}`}>
          {timeLeft}s
        </div>
        <div className="text-sm text-gray-400">
          {isLocked ? "Locked in ✓" : isTimedOut ? "Time's up!" : "Time remaining"}
        </div>
      </div>

      {/* Player info */}
      <div className="bg-gray-800 rounded p-3 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Your chips:</span>
          <span className="font-bold text-green-400">{myPlayer.chips} 🪙</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Your side:</span>
          <span className="font-bold">{myPlayer.assignedSide}</span>
        </div>
        {opponent && (
          <div className="flex justify-between">
            <span className="text-gray-400">Opponent:</span>
            <span className="font-bold">
              {opponent.name} {opponent.isBot && "🤖"}
            </span>
          </div>
        )}
      </div>

      {/* Eliminated warning */}
      {myPlayer.eliminated && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded p-3 text-sm">
          <div className="font-bold text-yellow-400 mb-1">⚠️ ELIMINATED</div>
          <div className="text-gray-300">You cannot win chips, but can still affect the pot!</div>
        </div>
      )}

      {/* Betting buttons */}
      {isLocked ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">✅</div>
          <div className="font-bold text-green-400">Locked In</div>
          <div className="text-sm text-gray-400">Bet: {myPlayer.currentBet} chips</div>
        </div>
      ) : isTimedOut ? (
        <div className="text-center py-8">
          <div className="text-2xl mb-2">⏱️</div>
          <div className="font-bold text-yellow-400">Time's Up!</div>
          <div className="text-sm text-gray-400">Auto-bet: {myPlayer.currentBet} chips</div>
        </div>
      ) : (
        <>
          {/* Bet selection */}
          <div className="grid grid-cols-2 gap-3">
            {betOptions.map((amount) => {
              const isAllIn = amount === myPlayer.chips && currentRound === 10;
              const label = isAllIn ? "ALL-IN" : `${amount}`;

              return (
                <button
                  key={amount}
                  onClick={() => handleBetSelect(amount)}
                  disabled={amount > myPlayer.chips && !myPlayer.eliminated}
                  className={`
                    py-4 px-6 rounded-lg font-bold text-lg transition-all
                    ${
                      selectedBet === amount
                        ? "bg-blue-600 text-white ring-4 ring-blue-400"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }
                    ${amount > myPlayer.chips && !myPlayer.eliminated ? "opacity-30 cursor-not-allowed" : ""}
                    ${isAllIn ? "bg-red-600 hover:bg-red-700" : ""}
                  `}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Lock in button */}
          <button
            onClick={handleLockIn}
            disabled={!selectedBet}
            className={`
              w-full py-4 rounded-lg font-bold text-lg transition-all
              ${
                selectedBet
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {selectedBet ? `Lock In (${selectedBet} chips)` : "Select a bet"}
          </button>
        </>
      )}
    </div>
  );
}
