import { WebSocket, WebSocketServer } from "ws";
import { parseClientMessage, serializeServerMessage } from "./protocol.js";
import type { ServerMessage } from "./protocol.js";
import { MatchManager } from "./match-manager.js";
import type { GameConfig } from "@fungus/game";

function parseQueryParams(url: string | undefined): {
  matchId: string | null;
  playerId: string | null;
} {
  if (!url) return { matchId: null, playerId: null };
  try {
    const params = new URL(url, "http://localhost").searchParams;
    return {
      matchId: params.get("matchId"),
      playerId: params.get("playerId"),
    };
  } catch {
    return { matchId: null, playerId: null };
  }
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(serializeServerMessage(msg));
  }
}

export function createServer(config?: GameConfig, port?: number): WebSocketServer {
  const matchManager = new MatchManager();
  const serverPort = port ?? (Number(process.env.PORT) || 3001);

  const wss = new WebSocketServer({ port: serverPort });

  wss.on("connection", (ws, req) => {
    const { matchId, playerId } = parseQueryParams(req.url);

    if (!matchId || !playerId) {
      send(ws, { type: "error", message: "Missing matchId or playerId query params" });
      ws.close();
      return;
    }

    console.log(`Player ${playerId} connecting to match ${matchId}`);

    ws.on("message", (data) => {
      const msg = parseClientMessage(data.toString());
      if (!msg) {
        send(ws, { type: "error", message: "Invalid message format" });
        return;
      }

      if (msg.type === "queue-actions") {
        matchManager.queueActions(matchId, playerId, msg.actions);
      }
    });

    ws.on("close", () => {
      console.log(`Player ${playerId} disconnected from match ${matchId}`);
      matchManager.handleDisconnect(matchId, playerId);
    });

    const client = { ws, matchId, playerId };
    matchManager.handleConnect(client, config);
  });

  console.log(`WebSocket server listening on port ${serverPort}`);
  return wss;
}
