import type { GameAction, GameState } from "@fungus/game";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface ServerMessageMap {
  "tick-result": { gameState: GameState };
  "tick-countdown": { secondsRemaining: number };
  "match-state": { gameState: GameState };
  "waiting": Record<string, never>;
  "error": { message: string };
}

export type ServerMessageType = keyof ServerMessageMap;
export type MessageHandler<T extends ServerMessageType> = (data: ServerMessageMap[T]) => void;

export class GameConnection {
  private url: string;
  private ws: WebSocket | null = null;
  private handlers: Map<ServerMessageType, Set<MessageHandler<any>>> = new Map();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 10000;
  private _status: ConnectionStatus = "disconnected";

  constructor(url: string) {
    this.url = url;
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  connect(): void {
    this.cleanup();

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus("connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type && this.handlers.has(msg.type)) {
          const handlers = this.handlers.get(msg.type)!;
          for (const handler of handlers) {
            handler(msg);
          }
        }
      } catch {
        console.error("Failed to parse server message");
      }
    };

    this.ws.onclose = () => {
      this.setStatus("reconnecting");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.cleanup();
    this.setStatus("disconnected");
  }

  queueActions(actions: GameAction[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "queue-actions", actions }));
    }
  }

  on<T extends ServerMessageType>(type: T, handler: MessageHandler<T>): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  off<T extends ServerMessageType>(type: T, handler: MessageHandler<T>): void {
    this.handlers.get(type)?.delete(handler);
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    for (const handler of this.statusHandlers) {
      handler(status);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelay);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
