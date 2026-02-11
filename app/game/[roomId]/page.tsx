"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGameConnection } from "../../../lib/hooks/useGameConnection";
import { useGameStore, selectMyPlayer, selectMyPair } from "../../../lib/stores/gameStore";
import { GamePhase } from "../../../components/GamePhase";

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [name, setName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

  const gameState = useGameStore((state) => state.gameState);
  const myPlayerId = useGameStore((state) => state.myPlayerId);
  const isHost = useGameStore((state) => state.isHost);
  const wsConnected = useGameStore((state) => state.wsConnected);
  const reconnecting = useGameStore((state) => state.reconnecting);
  const error = useGameStore((state) => state.error);

  const myPlayer = useGameStore(selectMyPlayer);
  const opponent = useGameStore(selectMyPair);

  const { sendMessage } = useGameConnection(roomId);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim()) {
      sendMessage({ type: "join", name: name.trim() });
      setHasJoined(true);
    }
  };

  // Show join form if not connected or haven't joined
  if (!wsConnected || !hasJoined || !myPlayerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">🪙 Coin Toss Blitz</h1>
            <p className="text-gray-400">Enter your name to join the game</p>
          </div>

          {!wsConnected && !reconnecting && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded">
              <div className="text-sm text-yellow-400">
                ⚠️ Connecting to server...
              </div>
            </div>
          )}

          {reconnecting && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded animate-pulse">
              <div className="text-sm text-blue-400">
                🔄 Reconnecting...
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded">
              <div className="text-sm text-red-400">
                ❌ {error}
              </div>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                required
                autoFocus
                disabled={!wsConnected}
              />
            </div>

            <button
              type="submit"
              disabled={!wsConnected || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {wsConnected ? "Join Game" : "Connecting..."}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Room: {roomId}
          </div>
        </div>
      </div>
    );
  }

  // Show loading if waiting for game state
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🪙</div>
          <div className="text-gray-400">Loading game...</div>
        </div>
      </div>
    );
  }

  // Main game view
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">🪙 Coin Toss Blitz</h1>

          {/* Connection status */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
            <span className="text-gray-400">
              {wsConnected ? "Connected" : reconnecting ? "Reconnecting..." : "Disconnected"}
            </span>
          </div>

          {/* Host badge */}
          {isHost && (
            <div className="mt-2 inline-block bg-purple-900/50 border border-purple-500 px-3 py-1 rounded-full text-sm">
              👑 You are the host
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg">
            <div className="text-sm text-red-400">
              ❌ {error}
            </div>
          </div>
        )}

        {/* Game Phase Component */}
        <GamePhase
          gameState={gameState}
          myPlayer={myPlayer}
          opponent={opponent}
          isHost={isHost}
          onSendMessage={sendMessage}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600">
          Room: {roomId} | Built with Next.js + Partykit
        </div>
      </div>
    </div>
  );
}
