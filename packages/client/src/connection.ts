import type { GameAction, GameState } from "@fungus/game";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface ReconnectState {
  attempt: number;
  nextAttemptAt: number | null;
  retryWindowEndsAt: number | null;
  exhausted: boolean;
}

export interface GameConnectionOptions {
  maxReconnectDelay?: number;
  retryWindowMs?: number;
}

export interface ServerMessageMap {
  "tick-result": { gameState: GameState };
  "tick-countdown": { secondsRemaining: number };
  "match-state": { gameState: GameState };
  "waiting": Record<string, never>;
  "presence": { playerId: string; connected: boolean };
  "error": { message: string };
}

export type ServerMessageType = keyof ServerMessageMap;
export type MessageHandler<T extends ServerMessageType> = (data: ServerMessageMap[T]) => void;

export async function decodeServerMessageData(data: unknown): Promise<string | null> {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof Blob) {
    return data.text();
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }

  return null;
}

export class GameConnection {
  private url: string;
  private ws: WebSocket | null = null;
  private handlers: Map<ServerMessageType, Set<MessageHandler<any>>> = new Map();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectStateHandlers: Set<(state: ReconnectState | null) => void> = new Set();
  private reconnectFailedHandlers: Set<() => void> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay: number;
  private retryWindowMs: number;
  private retryWindowEndsAt: number | null = null;
  private _status: ConnectionStatus = "disconnected";

  constructor(url: string, options: GameConnectionOptions = {}) {
    this.url = url;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 10000;
    this.retryWindowMs = options.retryWindowMs ?? 30000;
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  connect(): void {
    this.cleanup();

    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.retryWindowEndsAt = null;
      this.emitReconnectState(null);
      this.setStatus("connected");
    };

    this.ws.onmessage = async (event: MessageEvent) => {
      const text = await decodeServerMessageData(event.data);
      if (text === null) {
        console.error("Received unsupported server message payload:", event.data);
        return;
      }

      this.handleMessage(text);
    };

    this.ws.onclose = () => {
      this.setStatus("reconnecting");
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private handleMessage(text: string): void {
    let msg: any;
    try {
      msg = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse server message:", e, "\nraw type:", typeof text, "\nlen:", text.length, "\nfirst 300:", text.slice(0, 300));
      return;
    }

    if (msg.type && this.handlers.has(msg.type)) {
      const handlers = this.handlers.get(msg.type)!;
      for (const handler of handlers) {
        try {
          handler(msg);
        } catch (e) {
          console.error(`Error in "${msg.type}" handler:`, e);
        }
      }
    }
  }

  disconnect(): void {
    this.cleanup();
    this.reconnectAttempts = 0;
    this.retryWindowEndsAt = null;
    this.emitReconnectState(null);
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

  onReconnectStateChange(handler: (state: ReconnectState | null) => void): () => void {
    this.reconnectStateHandlers.add(handler);
    return () => this.reconnectStateHandlers.delete(handler);
  }

  onReconnectFailed(handler: () => void): () => void {
    this.reconnectFailedHandlers.add(handler);
    return () => this.reconnectFailedHandlers.delete(handler);
  }

  private setStatus(status: ConnectionStatus): void {
    this._status = status;
    for (const handler of this.statusHandlers) {
      handler(status);
    }
  }

  private emitReconnectState(state: ReconnectState | null): void {
    for (const handler of this.reconnectStateHandlers) {
      handler(state);
    }
  }

  private emitReconnectFailed(): void {
    for (const handler of this.reconnectFailedHandlers) {
      handler();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const now = Date.now();
    if (this.retryWindowEndsAt === null) {
      this.retryWindowEndsAt = now + this.retryWindowMs;
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelay);
    const nextAttemptAt = now + delay;

    if (nextAttemptAt > this.retryWindowEndsAt) {
      this.emitReconnectState({
        attempt: this.reconnectAttempts + 1,
        nextAttemptAt: null,
        retryWindowEndsAt: this.retryWindowEndsAt,
        exhausted: true,
      });
      this.setStatus("disconnected");
      this.emitReconnectFailed();
      return;
    }

    this.reconnectAttempts++;
    this.emitReconnectState({
      attempt: this.reconnectAttempts,
      nextAttemptAt,
      retryWindowEndsAt: this.retryWindowEndsAt,
      exhausted: false,
    });

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
