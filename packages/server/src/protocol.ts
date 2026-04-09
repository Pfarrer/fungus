import type { GameAction, GameState } from "@fungus/game";
import type { WebSocket } from "ws";

export interface ClientConnection {
  ws: WebSocket;
  matchId: string;
  playerId: string;
  playerName?: string;
}

export interface QueueActionsMessage {
  type: "queue-actions";
  actions: GameAction[];
}

export interface JoinMatchMessage {
  type: "join-match";
}

export type ClientMessage = QueueActionsMessage | JoinMatchMessage;

export interface TickResultMessage {
  type: "tick-result";
  gameState: GameState;
}

export interface TickCountdownMessage {
  type: "tick-countdown";
  secondsRemaining: number;
}

export interface MatchStateMessage {
  type: "match-state";
  gameState: GameState;
}

export interface WaitingMessage {
  type: "waiting";
}

export interface PresenceMessage {
  type: "presence";
  playerId: string;
  connected: boolean;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ServerMessage =
  | TickResultMessage
  | TickCountdownMessage
  | MatchStateMessage
  | WaitingMessage
  | PresenceMessage
  | ErrorMessage;

export function parseClientMessage(data: string): ClientMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === "queue-actions" && Array.isArray(parsed.actions)) {
      return { type: "queue-actions", actions: parsed.actions };
    }
    if (parsed.type === "join-match") {
      return { type: "join-match" };
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
