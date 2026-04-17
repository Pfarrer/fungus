import { describe, it, expect, afterEach, vi } from "vitest";
import { WebSocket } from "ws";
import { createServer } from "./server.js";
import type { GameConfig } from "@fungus/game";

const fastConfig: GameConfig = {
  map: {
    width: 800,
    height: 600,
    maxConnectionDistance: 100,
    minNodeDistance: 20,
    spawnPoints: [
      { x: 50, y: 300 },
      { x: 750, y: 300 },
    ],
    nodeTypeConfigs: {
      root: { cost: 0, health: 100, productionPerTick: 10, consumptionPerTick: 0 },
      generator: { cost: 0, health: 30, productionPerTick: 3, consumptionPerTick: 0 },
      turret: { cost: 0, health: 20, productionPerTick: 0, consumptionPerTick: 0, damagePerTick: 5, attackRange: 120 },
    },
    edgeHealth: 20,
  },
  tickDurationMs: 100,
  resourceCap: 500,
  deathRatePerTick: 5,
  maxShieldReductionPercent: 90,
};

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPort(server: any): number {
  return (server.address() as { port: number }).port;
}

function httpFetch(port: number, path: string, options?: RequestInit): Promise<Response> {
  return fetch(`http://localhost:${port}${path}`, options);
}

function connectPlayer(
  port: number,
  matchId: string,
  playerId: string,
  playerName?: string,
): Promise<{ ws: WebSocket; msgs: any[] }> {
  return new Promise((resolve, reject) => {
    let url = `ws://localhost:${port}?matchId=${matchId}&playerId=${playerId}`;
    if (playerName) url += `&playerName=${encodeURIComponent(playerName)}`;
    const ws = new WebSocket(url);
    const msgs: any[] = [];
    ws.on("message", (data) => msgs.push(JSON.parse(data.toString())));
    ws.on("open", () => resolve({ ws, msgs }));
    ws.on("error", reject);
  });
}

describe("HTTP endpoints", () => {
  let server: ReturnType<typeof createServer> | null = null;
  let openSockets: WebSocket[] = [];

  afterEach(async () => {
    vi.useRealTimers();
    for (const ws of openSockets) {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
    openSockets = [];
    if (server) {
      server.close();
      server = null;
    }
    await waitFor(50);
  });

  it("POST /host creates match and returns valid code format", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const res = await httpFetch(port, "/host", { method: "POST" });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(body.matchId).toBeDefined();
    expect(body.playerId).toBe("player-1");
  });

  it("GET /join with valid code returns matchId and playerId player-2", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await httpFetch(port, "/host", { method: "POST" });
    const hostBody = await hostRes.json();

    const joinRes = await httpFetch(port, `/join?code=${hostBody.code}`);
    expect(joinRes.status).toBe(200);

    const joinBody = await joinRes.json();
    expect(joinBody.valid).toBe(true);
    expect(joinBody.matchId).toBe(hostBody.matchId);
    expect(joinBody.playerId).toBe("player-2");
  });

  it("GET /join with invalid code returns { valid: false }", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const res = await httpFetch(port, "/join?code=ZZZZZZ");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ valid: false });
  });

  it("GET /join without code returns 400", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const res = await httpFetch(port, "/join");
    expect(res.status).toBe(400);
  });

  it("game codes are unique across multiple matches", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await httpFetch(port, "/host", { method: "POST" });
      const body = await res.json();
      codes.push(body.code);
    }

    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it("game code is cleaned up when match is destroyed", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await httpFetch(port, "/host", { method: "POST" });
    const hostBody = await hostRes.json();

    const p1 = await connectPlayer(port, hostBody.matchId, "player-1");
    const p2 = await connectPlayer(port, hostBody.matchId, "player-2");
    openSockets.push(p1.ws, p2.ws);

    const joinBefore = await httpFetch(port, `/join?code=${hostBody.code}`);
    expect((await joinBefore.json()).valid).toBe(true);

    p1.ws.close();
    p2.ws.close();
    await waitFor(100);

    const joinAfter = await httpFetch(port, `/join?code=${hostBody.code}`);
    expect((await joinAfter.json()).valid).toBe(false);
  });

  it("playerName appears in match state on WebSocket connection", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await httpFetch(port, "/host", { method: "POST" });
    const hostBody = await hostRes.json();

    const p1 = await connectPlayer(port, hostBody.matchId, "player-1", "Alice");
    openSockets.push(p1.ws);

    await waitFor(50);

    const stateMsgs = p1.msgs.filter((m: any) => m.type === "match-state");
    expect(stateMsgs.length).toBeGreaterThanOrEqual(1);

    const player1 = stateMsgs[0].gameState.players.find(
      (p: any) => p.id === "player-1",
    );
    expect(player1.name).toBe("Alice");
  });

  it("/host assigns player-1, /join assigns player-2", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await httpFetch(port, "/host", { method: "POST" });
    const hostBody = await hostRes.json();
    expect(hostBody.playerId).toBe("player-1");

    const joinRes = await httpFetch(port, `/join?code=${hostBody.code}`);
    const joinBody = await joinRes.json();
    expect(joinBody.playerId).toBe("player-2");
  });

  it("hosted match without WebSocket connection is cleaned up after timeout", async () => {
    vi.useFakeTimers();
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await httpFetch(port, "/host", { method: "POST" });
    const hostBody = await hostRes.json();

    const joinBefore = await httpFetch(port, `/join?code=${hostBody.code}`);
    expect((await joinBefore.json()).valid).toBe(true);

    await vi.advanceTimersByTimeAsync(60_000);

    const joinAfter = await httpFetch(port, `/join?code=${hostBody.code}`);
    expect((await joinAfter.json()).valid).toBe(false);
  });

  it("includes CORS headers on POST /host response", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const res = await httpFetch(port, "/host", { method: "POST" });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("includes CORS headers on GET /join response", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const res = await httpFetch(port, "/join?code=ZZZZZZ");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("handles OPTIONS preflight with 204 and CORS headers", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const res = await httpFetch(port, "/host", { method: "OPTIONS" });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
  });
});
