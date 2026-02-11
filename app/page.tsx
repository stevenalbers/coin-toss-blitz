"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    router.push(`/game/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/game/${roomId.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-md w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 animate-bounce">🪙</div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Coin Toss Blitz
          </h1>
          <p className="text-gray-400 text-lg">
            Live multiplayer coin toss tournament
          </p>
        </div>

        {/* Game Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 space-y-3">
          <h2 className="font-bold text-xl mb-3">How to Play:</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">👥</span>
              <span>10 players compete (humans + bots)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400">🪙</span>
              <span>Start with 100 chips</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">🎲</span>
              <span>10 rounds of coin flips</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400">🏆</span>
              <span>Player with most chips wins!</span>
            </div>
          </div>
        </div>

        {/* Create Room */}
        <div className="bg-gray-800 rounded-lg p-6 mb-4">
          <h3 className="font-bold mb-3">Create New Game</h3>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors transform hover:scale-105"
          >
            🎮 Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="font-bold mb-3">Join Existing Game</h3>
          <form onSubmit={handleJoinRoom} className="space-y-3">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room code"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 uppercase"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={!roomId.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Join Room
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Built with Next.js + Partykit</p>
          <p className="mt-1">Free to play • Real-time multiplayer</p>
        </div>
      </div>
    </div>
  );
}
