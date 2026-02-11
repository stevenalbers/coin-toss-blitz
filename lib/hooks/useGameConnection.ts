import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import type { ClientMessage, ServerMessage } from "../types/game";
import { useGameStore } from "../stores/gameStore";

export function useGameConnection(roomId: string) {
  const socketRef = useRef<PartySocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    setGameState,
    setMyPlayerId,
    setIsHost,
    setWsConnected,
    setReconnecting,
    setError,
  } = useGameStore();

  // Send message to server
  const sendMessage = useCallback((message: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

    const connect = () => {
      console.log(`Connecting to Partykit: ${host}/parties/main/${roomId}`);

      const socket = new PartySocket({
        host,
        room: roomId,
      });

      socket.addEventListener("open", () => {
        console.log("WebSocket connected");
        setWsConnected(true);
        setReconnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          sendMessage({ type: "ping" });
        }, 30000); // 30 seconds
      });

      socket.addEventListener("message", (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);

          switch (message.type) {
            case "state":
              setGameState(message.state);
              break;

            case "player_joined":
              // Check if this is me
              if (socket.id === message.playerId) {
                setMyPlayerId(message.playerId);
                setIsHost(message.isHost);
              }
              break;

            case "error":
              setError(message.message);
              break;

            case "pong":
              // Heartbeat response
              break;

            default:
              // Other messages handled by game state updates
              break;
          }
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      });

      socket.addEventListener("close", () => {
        console.log("WebSocket closed");
        setWsConnected(false);

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          setReconnecting(true);

          setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError("Connection lost. Please refresh the page.");
        }
      });

      socket.addEventListener("error", (err) => {
        console.error("WebSocket error:", err);
        setError("Connection error occurred");
      });

      socketRef.current = socket;
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [roomId, setGameState, setMyPlayerId, setIsHost, setWsConnected, setReconnecting, setError, sendMessage]);

  // Handle page visibility changes (mobile backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible - check connection
        if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
          setReconnecting(true);
          // Will trigger reconnection via close handler
          socketRef.current.close();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setReconnecting]);

  return {
    sendMessage,
  };
}
