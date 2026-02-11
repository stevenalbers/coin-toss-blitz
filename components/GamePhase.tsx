"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { SerializedGameState, Player } from "../lib/types/game";
import { CoinFlip } from "./CoinFlip";
import { Leaderboard } from "./Leaderboard";
import { BettingPanel } from "./BettingPanel";
import { HostControls } from "./HostControls";
import { MatchupReveal } from "./MatchupReveal";
import { PotSummary } from "./PotSummary";
import { ResultsSummary } from "./ResultsSummary";

interface GamePhaseProps {
  gameState: SerializedGameState;
  myPlayer: Player | null;
  opponent: Player | null;
  isHost: boolean;
  onSendMessage: (message: any) => void;
}

export function GamePhase({
  gameState,
  myPlayer,
  opponent,
  isHost,
  onSendMessage,
}: GamePhaseProps) {
  const players = Object.values(gameState.players);

  // Track matchup reveal animation
  const [showMatchupReveal, setShowMatchupReveal] = useState(false);
  const [hasSeenMatchupForRound, setHasSeenMatchupForRound] = useState<number | null>(null);

  // Track results animation completion
  const [resultAnimationComplete, setResultAnimationComplete] = useState(false);

  // Reset matchup reveal when round changes
  useEffect(() => {
    if (gameState.phase === "BETTING" && gameState.currentRound !== hasSeenMatchupForRound) {
      setShowMatchupReveal(true);
      setHasSeenMatchupForRound(null);
    }
  }, [gameState.phase, gameState.currentRound, hasSeenMatchupForRound]);

  // Reset result animation when entering RESULTS phase
  useEffect(() => {
    if (gameState.phase === "RESULTS") {
      setResultAnimationComplete(false);
    }
  }, [gameState.phase]);

  // Lobby phase
  if (gameState.phase === "LOBBY") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">🪙 Coin Toss Blitz</h2>
          <p className="text-gray-400">Waiting for host to start the game...</p>
          <div className="mt-4 text-xl">
            Players: {players.length}/10
          </div>
        </div>

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={0}
          totalRounds={10}
        />

        {isHost && (
          <HostControls
            phase={gameState.phase}
            playerCount={players.length}
            onStart={() => onSendMessage({ type: "host_start" })}
            onReset={() => onSendMessage({ type: "host_reset" })}
            onPause={() => onSendMessage({ type: "host_pause" })}
            onResume={() => onSendMessage({ type: "host_resume" })}
            isPaused={gameState.isPaused}
          />
        )}
      </div>
    );
  }

  // Paused overlay
  if (gameState.isPaused) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-900/30 border-2 border-yellow-500 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">⏸️</div>
          <div className="text-2xl font-bold text-yellow-400 mb-2">Game Paused</div>
          <div className="text-gray-300">Waiting for host to resume...</div>
        </div>

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={gameState.currentRound}
          totalRounds={10}
        />

        {isHost && (
          <HostControls
            phase={gameState.phase}
            playerCount={players.length}
            onStart={() => onSendMessage({ type: "host_start" })}
            onReset={() => onSendMessage({ type: "host_reset" })}
            onPause={() => onSendMessage({ type: "host_pause" })}
            onResume={() => onSendMessage({ type: "host_resume" })}
            isPaused={gameState.isPaused}
          />
        )}
      </div>
    );
  }

  // Betting phase
  if (gameState.phase === "BETTING" && myPlayer) {
    // Show matchup reveal animation before betting UI
    if (showMatchupReveal && hasSeenMatchupForRound !== gameState.currentRound) {
      return (
        <MatchupReveal
          myPlayer={myPlayer}
          opponent={opponent}
          onComplete={() => {
            setShowMatchupReveal(false);
            setHasSeenMatchupForRound(gameState.currentRound);
          }}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-1">Round {gameState.currentRound}/10</h3>
          <p className="text-gray-400">Place your bets!</p>
        </div>

        {myPlayer.sittingOut ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">💤</div>
            <div className="font-bold mb-2">Sitting Out This Round</div>
            <div className="text-sm text-gray-400">Odd number of players - you'll play next round</div>
          </div>
        ) : (
          <BettingPanel
            myPlayer={myPlayer}
            opponent={opponent}
            deadline={gameState.bettingDeadline!}
            currentRound={gameState.currentRound}
            onSelectBet={(amount) => onSendMessage({ type: "select_bet", amount })}
            onLockBet={() => onSendMessage({ type: "lock_bet" })}
          />
        )}

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={gameState.currentRound}
          totalRounds={10}
        />

        {isHost && (
          <HostControls
            phase={gameState.phase}
            playerCount={players.length}
            onStart={() => onSendMessage({ type: "host_start" })}
            onReset={() => onSendMessage({ type: "host_reset" })}
            onPause={() => onSendMessage({ type: "host_pause" })}
            onResume={() => onSendMessage({ type: "host_resume" })}
            isPaused={gameState.isPaused}
          />
        )}
      </div>
    );
  }

  // Countdown phase
  if (gameState.phase === "COUNTDOWN") {
    return (
      <div className="space-y-6">
        <PotSummary
          pairs={gameState.pairs}
          players={gameState.players}
          myPlayerId={myPlayer?.id || ""}
          countdownValue={gameState.countdownValue || 1}
        />

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={gameState.currentRound}
          totalRounds={10}
        />

        {isHost && (
          <HostControls
            phase={gameState.phase}
            playerCount={players.length}
            onStart={() => onSendMessage({ type: "host_start" })}
            onReset={() => onSendMessage({ type: "host_reset" })}
            onPause={() => onSendMessage({ type: "host_pause" })}
            onResume={() => onSendMessage({ type: "host_resume" })}
            isPaused={gameState.isPaused}
          />
        )}
      </div>
    );
  }

  // Flipping phase
  if (gameState.phase === "FLIPPING" && gameState.flipResult && gameState.flipTimestamp) {
    return (
      <div className="space-y-6">
        <CoinFlip
          result={gameState.flipResult}
          timestamp={gameState.flipTimestamp}
          animationDuration={2000}
        />

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={gameState.currentRound}
          totalRounds={10}
        />
      </div>
    );
  }

  // Results phase
  if (gameState.phase === "RESULTS") {
    // Calculate chip change for myPlayer
    const calculateChipChange = (): number => {
      if (!myPlayer || !opponent) return 0;

      const myBet = myPlayer.currentBet || 0;
      const opponentBet = opponent.currentBet || 0;
      const pot = myBet + opponentBet;

      const didWin = myPlayer.assignedSide === gameState.flipResult;

      // If eliminated, chips don't change
      if (myPlayer.eliminated) return 0;

      // Winner gets pot, loser loses pot
      return didWin ? pot : -pot;
    };

    const chipChange = calculateChipChange();

    return (
      <div className="space-y-6">
        <ResultsSummary
          myPlayer={myPlayer}
          flipResult={gameState.flipResult!}
          chipChange={chipChange}
          onAnimationComplete={() => setResultAnimationComplete(true)}
        />

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={gameState.currentRound}
          totalRounds={10}
          animatePositions={true}
        />

        {resultAnimationComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center text-gray-400"
          >
            Next round starting soon...
          </motion.div>
        )}

        {isHost && (
          <HostControls
            phase={gameState.phase}
            playerCount={players.length}
            onStart={() => onSendMessage({ type: "host_start" })}
            onReset={() => onSendMessage({ type: "host_reset" })}
            onPause={() => onSendMessage({ type: "host_pause" })}
            onResume={() => onSendMessage({ type: "host_resume" })}
            isPaused={gameState.isPaused}
          />
        )}
      </div>
    );
  }

  // Game over phase
  if (gameState.phase === "GAME_OVER") {
    const sortedPlayers = Object.values(gameState.players).sort((a, b) => b.chips - a.chips);
    const winner = sortedPlayers[0];

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-3xl font-bold mb-2">Game Over!</div>
          <div className="text-xl mb-4">
            Winner: <span className="text-yellow-400">{winner.name}</span>
          </div>
          <div className="text-lg text-gray-300">
            Final chips: {winner.chips} 🪙
          </div>
        </div>

        <Leaderboard
          players={players}
          myPlayerId={myPlayer?.id || null}
          currentRound={10}
          totalRounds={10}
          showTiebreaker={true}
        />

        {isHost && (
          <button
            onClick={() => onSendMessage({ type: "host_reset" })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors"
          >
            🔄 New Game
          </button>
        )}
      </div>
    );
  }

  return null;
}
