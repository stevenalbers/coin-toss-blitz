import type * as Party from "partykit/server";
import type {
  GamePhase,
  Player,
  GameState,
  ClientMessage,
  ServerMessage,
  CoinSide,
  Pair,
  RoundResult,
  FinalStanding,
  SerializedGameState,
} from "../lib/types/game";
import { calculatePotResult, applyPotResult } from "../lib/utils/potCalculation";
import { sortPlayersWithTiebreaker, calculateAvgLockInTime } from "../lib/utils/tiebreaker";
import { generateBotBet, generateBotLockInDelay, createBotPlayer } from "./botLogic";
import { BET_OPTIONS, COIN_FLIP_COUNTDOWN_SECONDS, ROUND_TIME, ANIMATION_DURATIONS } from "./consts";

export default class GameServer implements Party.Server {
  private gameState: GameState;
  private bettingTimer: NodeJS.Timeout | null = null;
  private countdownTimer: NodeJS.Timeout | null = null;
  private resultsTimer: NodeJS.Timeout | null = null;
  private botTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(readonly room: Party.Room) {
    // Initialize game state
    this.gameState = {
      phase: "LOBBY",
      currentRound: 0,
      players: new Map(),
      pairs: [],
      bettingDeadline: null,
      countdownValue: null,
      flipResult: null,
      flipTimestamp: null,
      isPaused: false,
      pausedBy: null,
      hostId: null,
    };
  }

  // Handle new connections
  async onConnect(conn: Party.Connection) {
    const playerId = conn.id;

    // If this is the first player, make them the host
    if (this.gameState.players.size === 0 && !this.gameState.hostId) {
      this.gameState.hostId = playerId;
    }

    // Send current game state to new connection
    this.sendToConnection(conn, {
      type: "state",
      state: this.serializeGameState(),
    });
  }

  // Handle player disconnections
  async onClose(conn: Party.Connection) {
    const playerId = conn.id;
    const player = this.gameState.players.get(playerId);

    if (player && !player.isBot) {
      player.connected = false;

      // If player disconnects during betting and hasn't locked in, they'll timeout
      // If they locked in, their bet stands

      this.broadcast({
        type: "player_left",
        playerId,
      });
    }
  }

  // Handle incoming messages from clients
  async onMessage(message: string, sender: Party.Connection) {
    const playerId = sender.id;
    let msg: ClientMessage;

    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      this.sendError(sender, "Invalid message format");
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(playerId, msg.name, sender);
        break;
      case "select_bet":
        this.handleSelectBet(playerId, msg.amount);
        break;
      case "lock_bet":
        this.handleLockBet(playerId);
        break;
      case "host_start":
        this.handleHostStart(playerId);
        break;
      case "host_reset":
        this.handleHostReset(playerId);
        break;
      case "host_pause":
        this.handleHostPause(playerId);
        break;
      case "host_resume":
        this.handleHostResume(playerId);
        break;
      case "host_skip_countdown":
        this.handleHostSkipCountdown(playerId);
        break;
      case "host_skip_results":
        this.handleHostSkipResults(playerId);
        break;
      case "ping":
        this.sendToConnection(sender, { type: "pong" });
        break;
    }
  }

  // ==================== MESSAGE HANDLERS ====================

  private handleJoin(playerId: string, name: string, conn: Party.Connection) {
    // Check if game already started
    if (this.gameState.phase !== "LOBBY") {
      this.sendError(conn, "Game already in progress");
      return;
    }

    // Check if room is full (max 10 players)
    if (this.gameState.players.size >= 10) {
      this.sendError(conn, "Room is full");
      return;
    }

    // Create player
    const player: Player = {
      id: playerId,
      name,
      chips: 100,
      connected: true,
      isBot: false,
      isHost: playerId === this.gameState.hostId,
      eliminated: false,
      lockInTimes: [],
      currentBet: null,
      currentBetLockTime: null,
      betStatus: "selecting",
      assignedSide: null,
      pairedWith: null,
      sittingOut: false,
    };

    this.gameState.players.set(playerId, player);

    this.broadcast({
      type: "player_joined",
      playerId,
      playerName: name,
      isHost: player.isHost,
    });

    this.broadcastState();
  }

  private handleSelectBet(playerId: string, amount: number) {
    const player = this.gameState.players.get(playerId);
    if (!player || player.isBot) return;

    // Can only select bet during BETTING phase
    if (this.gameState.phase !== "BETTING") return;

    // Check if player already locked in
    if (player.betStatus === "locked") return;

    // Validate bet amount based on player status and current round
    const { currentRound } = this.gameState;
    const validBets = player.eliminated
      ? BET_OPTIONS.eliminated
      : currentRound >= 7
        ? BET_OPTIONS.high
        : BET_OPTIONS.low;

    // Allow all-in only in round 10 for active players
    if (currentRound === 10 && !player.eliminated) {
      validBets.push(player.chips); // All-in = current chips
    }

    if (!validBets.includes(amount) && amount !== player.chips) {
      return; // Invalid bet
    }

    // Set current bet (not locked yet)
    player.currentBet = amount;

    this.broadcast({
      type: "bet_selected",
      playerId,
      amount,
    });
  }

  private handleLockBet(playerId: string) {
    const player = this.gameState.players.get(playerId);
    if (!player || player.isBot) return;

    // Can only lock bet during BETTING phase
    if (this.gameState.phase !== "BETTING") return;

    // Check if player already locked in
    if (player.betStatus === "locked") return;

    // Check if player has selected a bet
    if (player.currentBet === null) return;

    // Lock in the bet
    player.betStatus = "locked";
    player.currentBetLockTime = Date.now();

    this.broadcast({
      type: "bet_locked",
      playerId,
      lockTime: player.currentBetLockTime,
    });

    // Broadcast updated game state so clients see the locked status
    this.broadcastState();

    // Check if all players have locked in
    this.checkAllPlayersLocked();
  }

  private handleHostStart(playerId: string) {
    // Verify player is host
    if (playerId !== this.gameState.hostId) {
      return; // Not authorized
    }

    // Can only start from LOBBY
    if (this.gameState.phase !== "LOBBY") return;

    const humanPlayers = Array.from(this.gameState.players.values()).filter(p => !p.isBot);
    const humanCount = humanPlayers.length;

    // Add bots if needed to fill to 10 players
    if (humanCount < 10) {
      const botsNeeded = 10 - humanCount;
      for (let i = 1; i <= botsNeeded; i++) {
        const bot = createBotPlayer(i);
        this.gameState.players.set(bot.id, bot);
      }
    }

    // Start game - go to first round
    this.startRound(1);
  }

  private handleHostReset(playerId: string) {
    // Verify player is host
    if (playerId !== this.gameState.hostId) return;

    // Clear all timers
    this.clearAllTimers();

    // Reset to lobby, keep human players
    const humanPlayers = Array.from(this.gameState.players.values()).filter(p => !p.isBot);

    this.gameState = {
      phase: "LOBBY",
      currentRound: 0,
      players: new Map(),
      pairs: [],
      bettingDeadline: null,
      countdownValue: null,
      flipResult: null,
      flipTimestamp: null,
      isPaused: false,
      pausedBy: null,
      hostId: this.gameState.hostId,
    };

    // Re-add human players with reset stats
    humanPlayers.forEach(p => {
      const resetPlayer: Player = {
        ...p,
        chips: 100,
        eliminated: false,
        lockInTimes: [],
        currentBet: null,
        currentBetLockTime: null,
        betStatus: "selecting",
        assignedSide: null,
        pairedWith: null,
        sittingOut: false,
      };
      this.gameState.players.set(p.id, resetPlayer);
    });

    this.broadcastState();
  }

  private handleHostPause(playerId: string) {
    // Verify player is host
    if (playerId !== this.gameState.hostId) return;

    this.gameState.isPaused = true;
    this.gameState.pausedBy = playerId;

    // Pause timers but don't clear them
    // Note: In a production app, we'd save timer state and resume from there
    // For MVP, pausing just freezes the game state

    this.broadcast({
      type: "paused",
      pausedBy: playerId,
    });

    this.broadcastState();
  }

  private handleHostResume(playerId: string) {
    // Verify player is host
    if (playerId !== this.gameState.hostId) return;

    this.gameState.isPaused = false;
    this.gameState.pausedBy = null;

    this.broadcast({
      type: "resumed",
    });

    this.broadcastState();
  }

  private handleHostSkipCountdown(playerId: string) {
    // Verify player is host
    if (playerId !== this.gameState.hostId) return;

    // Only allow skipping during COUNTDOWN phase
    if (this.gameState.phase !== "COUNTDOWN") return;

    // Clear the countdown timer
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }

    // Reset countdown value
    this.gameState.countdownValue = null;

    // Immediately perform the flip
    this.performFlip();
  }

  private handleHostSkipResults(playerId: string) {
    // Verify player is host
    if (playerId !== this.gameState.hostId) return;

    // Only allow skipping during RESULTS phase
    if (this.gameState.phase !== "RESULTS") return;

    // Clear the results timer
    if (this.resultsTimer) {
      clearTimeout(this.resultsTimer);
      this.resultsTimer = null;
    }

    // Immediately advance to next round
    this.advanceToNextRound();
  }

  // ==================== GAME LOGIC ====================

  private startRound(roundNumber: number) {
    this.gameState.currentRound = roundNumber;
    this.gameState.phase = "BETTING";

    // Reset all player bet states
    this.gameState.players.forEach(player => {
      player.currentBet = null;
      player.currentBetLockTime = null;
      player.betStatus = "selecting";
      player.assignedSide = null;
      player.pairedWith = null;
      player.sittingOut = false;
    });

    // Create pairs
    this.createPairs();

    // Start betting timer
    const deadline = Date.now() + ROUND_TIME;
    this.gameState.bettingDeadline = deadline;

    this.broadcast({
      type: "betting_start",
      deadline,
    });

    // Schedule bot bets
    this.scheduleBotBets();

    // Set timeout for betting phase end
    this.bettingTimer = setTimeout(() => {
      this.endBettingPhase();
    }, ROUND_TIME);

    this.broadcastState();
  }

  private createPairs() {
    const allPlayers = Array.from(this.gameState.players.values());
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);

    this.gameState.pairs = [];

    // Create pairs
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const player1 = shuffled[i];
      const player2 = shuffled[i + 1];

      // Randomly assign heads/tails
      const player1Side: CoinSide = Math.random() < 0.5 ? "HEADS" : "TAILS";
      const player2Side: CoinSide = player1Side === "HEADS" ? "TAILS" : "HEADS";

      player1.assignedSide = player1Side;
      player2.assignedSide = player2Side;
      player1.pairedWith = player2.id;
      player2.pairedWith = player1.id;

      this.gameState.pairs.push({
        player1Id: player1.id,
        player2Id: player2.id,
        player1Side,
        player2Side,
      });
    }

    // Handle odd player (sits out)
    if (shuffled.length % 2 === 1) {
      const sittingPlayer = shuffled[shuffled.length - 1];
      sittingPlayer.sittingOut = true;
    }
  }

  private scheduleBotBets() {
    const bots = Array.from(this.gameState.players.values()).filter(p => p.isBot);

    bots.forEach(bot => {
      const delay = generateBotLockInDelay();
      const timer = setTimeout(() => {
        this.handleBotBet(bot.id);
      }, delay);

      this.botTimers.set(bot.id, timer);
    });
  }

  private handleBotBet(botId: string) {
    const bot = this.gameState.players.get(botId);
    if (!bot || !bot.isBot) return;

    // Only process bot bet if still in BETTING phase
    if (this.gameState.phase !== "BETTING") {
      // Clear the timer if it hasn't been cleared yet
      this.botTimers.delete(botId);
      return;
    }

    // Only bet once per round - check if already locked
    if (bot.betStatus === "locked") {
      this.botTimers.delete(botId);
      return;
    }

    // Generate bot bet
    const bet = generateBotBet(bot.eliminated, this.gameState.currentRound);
    bot.currentBet = bet;
    bot.betStatus = "locked";
    bot.currentBetLockTime = Date.now();

    // Remove timer from map since it has fired
    this.botTimers.delete(botId);

    this.broadcast({
      type: "bet_locked",
      playerId: botId,
      lockTime: bot.currentBetLockTime,
    });

    // Check if all players locked
    this.checkAllPlayersLocked();
  }

  private checkAllPlayersLocked() {
    const allLocked = Array.from(this.gameState.players.values())
      .filter(p => !p.isBot)
      .every(p => p.betStatus === "locked");

    if (allLocked && this.gameState.phase === "BETTING") {
      // All players locked - end betting phase early
      if (this.bettingTimer) {
        clearTimeout(this.bettingTimer);
        this.bettingTimer = null;
      }
      this.endBettingPhase();
    }
  }

  private endBettingPhase() {
    // Clear all bot timers to prevent them from firing during countdown
    this.botTimers.forEach(timer => clearTimeout(timer));
    this.botTimers.clear();

    // Auto-assign bets for unlocked players
    this.gameState.players.forEach(player => {
      if (player.betStatus !== "locked" && !player.sittingOut) {
        const { currentRound } = this.gameState;
        // Timeout - assign random bet
        const betOptions = player.eliminated
          ? BET_OPTIONS.eliminated // Eliminated players
          : currentRound >= 7
            ? BET_OPTIONS.high
            : BET_OPTIONS.low;
        const randomBet = betOptions[Math.floor(Math.random() * betOptions.length)];

        player.currentBet = randomBet;
        player.betStatus = "timed_out";
        player.currentBetLockTime = null; // No lock time for timeout
      }
    });

    // Move to countdown
    this.startCountdown();
  }

  private startCountdown() {
    this.gameState.phase = "COUNTDOWN";
    this.gameState.countdownValue = COIN_FLIP_COUNTDOWN_SECONDS;

    const countdown = () => {
      if (this.gameState.countdownValue === null) return;

      this.broadcast({
        type: "countdown",
        value: this.gameState.countdownValue,
      });

      if (this.gameState.countdownValue > 1) {
        this.gameState.countdownValue--;
        this.countdownTimer = setTimeout(countdown, 1000);
      } else {
        this.gameState.countdownValue = null;
        this.performFlip();
      }

      this.broadcastState();
    };

    countdown();
  }

  private performFlip() {
    this.gameState.phase = "FLIPPING";

    // Generate flip result
    this.gameState.flipResult = Math.random() < 0.5 ? "HEADS" : "TAILS";
    this.gameState.flipTimestamp = Date.now() + 500; // 500ms buffer

    this.broadcast({
      type: "flip",
      result: this.gameState.flipResult,
      timestamp: this.gameState.flipTimestamp,
      animationDuration: 2000,
    });

    // Wait for animation, then show results
    setTimeout(() => {
      this.calculateResults();
    }, 2500); // 500ms buffer + 2000ms animation

    this.broadcastState();
  }

  private calculateResults() {
    this.gameState.phase = "RESULTS";

    const results: RoundResult[] = [];

    // Calculate results for each pair
    this.gameState.pairs.forEach(pair => {
      const player1 = this.gameState.players.get(pair.player1Id)!;
      const player2 = this.gameState.players.get(pair.player2Id)!;

      const pot = (player1.currentBet || 0) + (player2.currentBet || 0);

      const potResult = calculatePotResult(
        player1.currentBet || 0,
        player2.currentBet || 0,
        this.gameState.flipResult!,
        pair.player1Side,
        player1.eliminated,
        player2.eliminated
      );

      const { player1NewChips, player2NewChips } = applyPotResult(
        player1.chips,
        player2.chips,
        potResult
      );

      // Update chips
      player1.chips = player1NewChips;
      player2.chips = player2NewChips;

      // Update elimination status
      player1.eliminated = player1.chips === 0;
      player2.eliminated = player2.chips === 0;

      // Record lock-in times for tiebreaker
      player1.lockInTimes.push(player1.currentBetLockTime);
      player2.lockInTimes.push(player2.currentBetLockTime);

      results.push({
        player1Id: pair.player1Id,
        player2Id: pair.player2Id,
        pot,
        winner: potResult.player1Change > 0 ? pair.player1Id :
          potResult.player2Change > 0 ? pair.player2Id : null,
        player1ChipChange: potResult.player1Change,
        player2ChipChange: potResult.player2Change,
        player1NewChips,
        player2NewChips,
      });
    });

    this.broadcast({
      type: "round_results",
      results,
    });

    this.broadcastState();

    // Wait for results animation to complete, then continue
    this.resultsTimer = setTimeout(() => {
      this.resultsTimer = null;
      this.advanceToNextRound();
    }, ANIMATION_DURATIONS.results.total);
  }

  private advanceToNextRound() {
    // Check if game is over (10 rounds complete)
    if (this.gameState.currentRound >= 10) {
      this.endGame();
      return;
    }

    // Start next round
    this.startRound(this.gameState.currentRound + 1);
  }

  private endGame() {
    this.gameState.phase = "GAME_OVER";

    // Calculate final standings
    const players = Array.from(this.gameState.players.values());
    const sorted = sortPlayersWithTiebreaker(players);

    const finalStandings: FinalStanding[] = sorted.map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      chips: player.chips,
      placement: index + 1,
      avgLockInTime: calculateAvgLockInTime(player.lockInTimes),
      isBot: player.isBot,
    }));

    this.broadcast({
      type: "game_over",
      finalStandings,
    });

    this.broadcastState();
  }

  // ==================== HELPER FUNCTIONS ====================

  private broadcast(message: ServerMessage) {
    this.room.broadcast(JSON.stringify(message));
  }

  private sendToConnection(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  private sendError(conn: Party.Connection, errorMessage: string) {
    this.sendToConnection(conn, {
      type: "error",
      message: errorMessage,
    });
  }

  private broadcastState() {
    this.broadcast({
      type: "state",
      state: this.serializeGameState(),
    });
  }

  private serializeGameState(): SerializedGameState {
    return {
      phase: this.gameState.phase,
      currentRound: this.gameState.currentRound,
      players: Object.fromEntries(this.gameState.players),
      pairs: this.gameState.pairs,
      bettingDeadline: this.gameState.bettingDeadline,
      countdownValue: this.gameState.countdownValue,
      flipResult: this.gameState.flipResult,
      flipTimestamp: this.gameState.flipTimestamp,
      isPaused: this.gameState.isPaused,
      pausedBy: this.gameState.pausedBy,
      hostId: this.gameState.hostId,
    };
  }

  private clearAllTimers() {
    if (this.bettingTimer) {
      clearTimeout(this.bettingTimer);
      this.bettingTimer = null;
    }

    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }

    this.botTimers.forEach(timer => clearTimeout(timer));
    this.botTimers.clear();
  }
}
