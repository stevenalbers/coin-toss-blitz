"use client";

import type { Player } from "../lib/types/game";
import { sortPlayersWithTiebreaker, formatLockInTime, calculateAvgLockInTime } from "../lib/utils/tiebreaker";

interface LeaderboardProps {
  players: Player[];
  myPlayerId: string | null;
  currentRound: number;
  totalRounds: number;
  showTiebreaker?: boolean;
}

export function Leaderboard({
  players,
  myPlayerId,
  currentRound,
  totalRounds,
  showTiebreaker = false,
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

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myPlayerId;
          const placement = index + 1;

          return (
            <div
              key={player.id}
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
                <div
                  className={`text-lg font-bold ${
                    player.chips > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {player.chips} 🪙
                </div>
                {player.eliminated && (
                  <div className="text-xs text-yellow-500">
                    Eliminated
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
