import { create } from "zustand";
import type { SerializedGameState } from "../types/game";

interface GameStore {
  // Game state from server
  gameState: SerializedGameState | null;

  // Client-specific data
  myPlayerId: string | null;
  isHost: boolean;
  wsConnected: boolean;
  reconnecting: boolean;
  error: string | null;

  // Actions
  setGameState: (state: SerializedGameState) => void;
  setMyPlayerId: (playerId: string) => void;
  setIsHost: (isHost: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  gameState: null,
  myPlayerId: null,
  isHost: false,
  wsConnected: false,
  reconnecting: false,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setGameState: (gameState) => set({ gameState }),

  setMyPlayerId: (myPlayerId) => set({ myPlayerId }),

  setIsHost: (isHost) => set({ isHost }),

  setWsConnected: (wsConnected) => set({ wsConnected }),

  setReconnecting: (reconnecting) => set({ reconnecting }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

// Selectors for common queries
export const selectMyPlayer = (state: GameStore) => {
  if (!state.gameState || !state.myPlayerId) return null;
  return state.gameState.players[state.myPlayerId] || null;
};

export const selectAllPlayers = (state: GameStore) => {
  if (!state.gameState) return [];
  return Object.values(state.gameState.players);
};

export const selectMyPair = (state: GameStore) => {
  if (!state.gameState || !state.myPlayerId) return null;

  const myPlayer = state.gameState.players[state.myPlayerId];
  if (!myPlayer || !myPlayer.pairedWith) return null;

  const opponent = state.gameState.players[myPlayer.pairedWith];
  return opponent || null;
};

export const selectIsMyTurn = (state: GameStore) => {
  if (!state.gameState || state.gameState.phase !== "BETTING") return false;

  const myPlayer = selectMyPlayer(state);
  if (!myPlayer || myPlayer.sittingOut) return false;

  return myPlayer.betStatus !== "locked";
};
