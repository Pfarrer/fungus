import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { parseClientMessage, serializeServerMessage } from "./protocol.js";
import type { ServerMessage } from "./protocol.js";
import { MatchManager } from "./match-manager.js";
import type { GameConfig } from "@fungus/game";

function parseQueryParams(url: string | undefined): {
  matchId: string | null;
  playerId: string | null;
  playerName: string | null;
} {
  if (!url) return { matchId: null, playerId: null, playerName: null };
  try {
    const params = new URL(url, "http://localhost").searchParams;
    return {
      matchId: params.get("matchId"),
      playerId: params.get("playerId"),
      playerName: params.get("playerName"),
    };
  } catch {
    return { matchId: null, playerId: null, playerName: null };
  }
}

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(serializeServerMessage(msg));
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

export function createServer(config?: GameConfig, port?: number): WebSocketServer {
  const matchManager = new MatchManager();
  const serverPort = port ?? (Number(process.env.PORT) || 3001);

  const httpServer = createHttpServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/host") {
      readBody(req).then((body) => {
        try {
          JSON.parse(body);
        } catch {}

        const { code, matchId } = matchManager.createMatchWithCode(config);
        jsonResponse(res, 200, {
          code,
          matchId,
          playerId: "player-1",
        });
      }).catch(() => {
        jsonResponse(res, 500, { error: "Internal server error" });
      });
      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/join")) {
      const params = new URL(req.url, "http://localhost").searchParams;
      const code = params.get("code");
      if (!code) {
        jsonResponse(res, 400, { error: "Missing code parameter" });
        return;
      }
      const result = matchManager.lookupCode(code);
      if (result.valid) {
        jsonResponse(res, 200, {
          valid: true,
          matchId: result.matchId,
          playerId: "player-2",
        });
      } else {
        jsonResponse(res, 200, { valid: false });
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws, req) => {
    const { matchId, playerId, playerName } = parseQueryParams(req.url);

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

    const client = { ws, matchId, playerId, playerName: playerName ?? undefined };
    const result = matchManager.handleConnect(client, config);

    if (result === "match-not-found") {
      send(ws, { type: "error", message: "Match not found" });
      ws.close();
      return;
    }
  });

  httpServer.listen(serverPort, () => {
    console.log(`Server listening on port ${serverPort}`);
    wss.emit("listening");
  });

  return wss;
}
