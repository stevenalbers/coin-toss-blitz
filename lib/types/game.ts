// Game phase states
export type GamePhase =
  | "LOBBY"
  | "BETTING"
  | "COUNTDOWN"
  | "FLIPPING"
  | "RESULTS"
  | "GAME_OVER"
  | "PAUSED";

// Coin sides
export type CoinSide = "HEADS" | "TAILS";

// Bet amounts for active players
export type BetAmount = 10 | 25 | 50 | "ALL_IN";

// Bet amounts for eliminated players (restricted)
export type EliminatedBetAmount = 0 | 10 | 25;

// Player betting status
export type BetStatus = "selecting" | "locked" | "timed_out";

// Player interface
export interface Player {
  id: string;
  name: string;
  chips: number;
  connected: boolean;
  isBot: boolean;
  isHost: boolean;
  eliminated: boolean;
  lockInTimes: (number | null)[]; // Timestamp for each round's lock-in (null if timed out)
  currentBet: number | null; // Current bet amount for this round
  currentBetLockTime: number | null; // Timestamp when current bet was locked
  betStatus: BetStatus;
  assignedSide: CoinSide | null; // HEADS or TAILS for current round
  pairedWith: string | null; // ID of opponent for current round
  sittingOut: boolean; // True if sitting out this round (odd number of players)
}

// Pairing for a round
export interface Pair {
  player1Id: string;
  player2Id: string;
  player1Side: CoinSide;
  player2Side: CoinSide;
}

// Game state (server-authoritative)
export interface GameState {
  phase: GamePhase;
  currentRound: number; // 1-10
  players: Map<string, Player>; // Keyed by player ID
  pairs: Pair[];
  bettingDeadline: number | null; // Timestamp when betting phase ends
  countdownValue: number | null; // 3, 2, 1, or null
  flipResult: CoinSide | null; // Result of coin flip
  flipTimestamp: number | null; // When coin flip animation should start
  isPaused: boolean;
  pausedBy: string | null; // Player ID who paused
  hostId: string | null; // Player ID of host
}

// Client->Server messages
export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "select_bet"; amount: number }
  | { type: "lock_bet" }
  | { type: "host_start" }
  | { type: "host_reset" }
  | { type: "host_pause" }
  | { type: "host_resume" }
  | { type: "ping" };

// Server->Client messages
export type ServerMessage =
  | { type: "state"; state: SerializedGameState }
  | { type: "player_joined"; playerId: string; playerName: string; isHost: boolean }
  | { type: "player_left"; playerId: string }
  | { type: "betting_start"; deadline: number }
  | { type: "bet_selected"; playerId: string; amount: number }
  | { type: "bet_locked"; playerId: string; lockTime: number }
  | { type: "countdown"; value: number }
  | { type: "flip"; result: CoinSide; timestamp: number; animationDuration: number }
  | { type: "round_results"; results: RoundResult[] }
  | { type: "game_over"; finalStandings: FinalStanding[] }
  | { type: "paused"; pausedBy: string }
  | { type: "resumed" }
  | { type: "error"; message: string }
  | { type: "pong" };

// Result of a single pairing in a round
export interface RoundResult {
  player1Id: string;
  player2Id: string;
  pot: number;
  winner: string | null; // Player ID, or null if both eliminated
  player1ChipChange: number;
  player2ChipChange: number;
  player1NewChips: number;
  player2NewChips: number;
}

// Final standing for a player
export interface FinalStanding {
  playerId: string;
  playerName: string;
  chips: number;
  placement: number; // 1-10
  avgLockInTime: number; // In milliseconds
  isBot: boolean;
}

// Serialized version of GameState (for JSON transmission)
export interface SerializedGameState {
  phase: GamePhase;
  currentRound: number;
  players: Record<string, Player>; // Object instead of Map
  pairs: Pair[];
  bettingDeadline: number | null;
  countdownValue: number | null;
  flipResult: CoinSide | null;
  flipTimestamp: number | null;
  isPaused: boolean;
  pausedBy: string | null;
  hostId: string | null;
}
