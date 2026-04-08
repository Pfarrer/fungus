import { WebSocket } from "ws";
import {
  createInitialState,
  defaultGameConfig,
  simulateTick,
} from "@fungus/game";
import type { GameAction, GameConfig, GameState } from "@fungus/game";
import { serializeServerMessage } from "./protocol.js";
import type { ServerMessage, ClientConnection } from "./protocol.js";

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(serializeServerMessage(msg));
  }
}

export class Match {
  readonly matchId: string;
  private config: GameConfig;
  private gameState: GameState;
  private players: Map<string, ClientConnection> = new Map();
  private actionQueues: Map<string, GameAction[]> = new Map();
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private tickCountdownSeconds = 0;
  private ended = false;

  constructor(matchId: string, config?: GameConfig) {
    this.matchId = matchId;
    this.config = config ?? defaultGameConfig;
    this.gameState = createInitialState(this.config);
  }

  addPlayer(client: ClientConnection): void {
    this.players.set(client.playerId, client);
    this.actionQueues.set(client.playerId, []);
    send(client.ws, { type: "match-state", gameState: this.gameState });
  }

  reconnectPlayer(client: ClientConnection): void {
    this.players.set(client.playerId, client);
    this.actionQueues.set(client.playerId, []);
    send(client.ws, { type: "match-state", gameState: this.gameState });

    if (this.players.size === 2 && !this.tickTimer && !this.ended) {
      this.startTickLoop();
    }
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.actionQueues.delete(playerId);
  }

  isPlayerConnected(playerId: string): boolean {
    const conn = this.players.get(playerId);
    return !!conn && conn.ws.readyState === WebSocket.OPEN;
  }

  queueActions(playerId: string, actions: GameAction[]): void {
    const queue = this.actionQueues.get(playerId);
    if (queue) {
      queue.push(...actions);
    }
  }

  setPlayerName(playerId: string, name: string): void {
    const player = this.gameState.players.find((p) => p.id === playerId);
    if (player) {
      player.name = name;
    }
  }

  playerCount(): number {
    return this.players.size;
  }

  tryStart(): void {
    if (this.players.size === 2 && !this.tickTimer && !this.ended) {
      this.startTickLoop();
    } else if (this.players.size === 1) {
      const firstPlayer = this.players.values().next().value!;
      send(firstPlayer.ws, { type: "waiting" });
    }
  }

  private startTickLoop(): void {
    const tickMs = this.config.tickDurationMs;

    if (tickMs >= 2000) {
      this.tickCountdownSeconds = Math.floor(tickMs / 1000);
      this.countdownTimer = setInterval(() => {
        this.tickCountdownSeconds--;
        this.broadcast({ type: "tick-countdown", secondsRemaining: this.tickCountdownSeconds });
      }, 1000);
    }

    this.tickTimer = setInterval(() => {
      this.executeTick();
    }, tickMs);
  }

  private executeTick(): void {
    if (this.ended) return;

    const playerActions = new Map<string, GameAction[]>();
    for (const [playerId, queue] of this.actionQueues) {
      if (queue.length > 0) {
        playerActions.set(playerId, [...queue]);
        queue.length = 0;
      }
    }

    this.gameState = simulateTick(this.gameState, playerActions, this.config);
    this.broadcast({ type: "tick-result", gameState: this.gameState });

    if (this.gameState.winner) {
      this.endMatch();
    }
  }

  private endMatch(): void {
    this.ended = true;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private broadcast(msg: ServerMessage): void {
    for (const conn of this.players.values()) {
      send(conn.ws, msg);
    }
  }

  destroy(): void {
    this.endMatch();
  }
}
