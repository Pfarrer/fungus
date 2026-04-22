import { describe, it, expect, afterEach } from "vitest";
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
  deathRatePerTick: 5,
  maxShieldReductionPercent: 90,
};

function connectPlayer(port: number, matchId: string, playerId: string): Promise<{ ws: WebSocket; msgs: any[] }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}?matchId=${matchId}&playerId=${playerId}`);
    const msgs: any[] = [];
    ws.on("message", (data) => msgs.push(JSON.parse(data.toString())));
    ws.on("open", () => resolve({ ws, msgs }));
    ws.on("error", reject);
  });
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPort(server: any): number {
  return (server.address() as { port: number }).port;
}

async function createMatchAndConnect(port: number): Promise<{
  matchId: string;
  p1: { ws: WebSocket; msgs: any[] };
  p2: { ws: WebSocket; msgs: any[] };
}> {
  const hostRes = await fetch(`http://localhost:${port}/host`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName: "P1" }),
  });
  const hostData = await hostRes.json();
  const matchId = hostData.matchId;

  const joinRes = await fetch(`http://localhost:${port}/join?code=${hostData.code}`);
  const joinData = await joinRes.json();

  const p1 = await connectPlayer(port, matchId, hostData.playerId);
  const p2 = await connectPlayer(port, matchId, joinData.playerId);
  return { matchId, p1, p2 };
}

describe("Backend integration: full game flow", () => {
  let server: ReturnType<typeof createServer> | null = null;
  let openSockets: WebSocket[] = [];

  afterEach(async () => {
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

  it("first player receives waiting, second triggers tick loop", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await fetch(`http://localhost:${port}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "P1" }),
    });
    const hostData = await hostRes.json();

    const p1 = await connectPlayer(port, hostData.matchId, hostData.playerId);
    openSockets.push(p1.ws);

    await waitFor(50);

    const waitingMsgs = p1.msgs.filter((m: any) => m.type === "waiting");
    expect(waitingMsgs.length).toBe(1);

    const matchStateMsgs = p1.msgs.filter((m: any) => m.type === "match-state");
    expect(matchStateMsgs.length).toBe(1);
    expect(matchStateMsgs[0].gameState.nodes.length).toBe(2);
    expect(matchStateMsgs[0].gameState.players.length).toBe(2);

    const joinRes = await fetch(`http://localhost:${port}/join?code=${hostData.code}`);
    const joinData = await joinRes.json();
    const p2 = await connectPlayer(port, hostData.matchId, joinData.playerId);
    openSockets.push(p2.ws);

    await waitFor(350);

    const tickResults1 = p1.msgs.filter((m: any) => m.type === "tick-result");
    const tickResults2 = p2.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults1.length).toBeGreaterThanOrEqual(2);
    expect(tickResults2.length).toBeGreaterThanOrEqual(2);
  });

  it("tick count increments with each tick-result", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const { p1, p2 } = await createMatchAndConnect(port);
    openSockets.push(p1.ws, p2.ws);

    await waitFor(550);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < tickResults.length; i++) {
      expect(tickResults[i].gameState.tick).toBe(tickResults[i - 1].gameState.tick + 1);
    }
  });

  it("queued actions create constructions in tick-result", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const { p1, p2 } = await createMatchAndConnect(port);
    openSockets.push(p1.ws, p2.ws);

    await waitFor(150);

    p1.ws.send(JSON.stringify({
      type: "queue-actions",
      actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 310 } }],
    }));

    await waitFor(500);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(3);

    const latestState = tickResults[tickResults.length - 1].gameState;
    const player1Nodes = latestState.nodes.filter((n: any) => n.playerId === "player-1");
    expect(player1Nodes.length).toBeGreaterThanOrEqual(2);
    const genNode = player1Nodes.find((n: any) => n.nodeType === "generator");
    expect(genNode).toBeDefined();
  });

  it("both players see identical game state in tick-result", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const { p1, p2 } = await createMatchAndConnect(port);
    openSockets.push(p1.ws, p2.ws);

    p1.ws.send(JSON.stringify({
      type: "queue-actions",
      actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 310 } }],
    }));

    await waitFor(300);

    const tr1 = p1.msgs.filter((m: any) => m.type === "tick-result");
    const tr2 = p2.msgs.filter((m: any) => m.type === "tick-result");

    expect(tr1.length).toBeGreaterThanOrEqual(2);
    expect(tr2.length).toBeGreaterThanOrEqual(2);

    const latest1 = tr1[tr1.length - 1].gameState;
    const latest2 = tr2[tr2.length - 1].gameState;

    expect(latest1.nodes).toEqual(latest2.nodes);
    expect(latest1.edges).toEqual(latest2.edges);
    expect(latest1.tick).toEqual(latest2.tick);
  });

  it("resources are discarded after each tick (surplus model)", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const { p1, p2 } = await createMatchAndConnect(port);
    openSockets.push(p1.ws, p2.ws);

    await waitFor(350);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(2);

    for (const tr of tickResults) {
      const p1 = tr.gameState.players.find(
        (p: any) => p.id === "player-1",
      );
      if (!p1) continue;
      expect(p1.resources).toBe(0);
    }
  });

  it("action queue is drained after tick — second tick has no extra constructions", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const { p1, p2 } = await createMatchAndConnect(port);
    openSockets.push(p1.ws, p2.ws);

    await waitFor(150);

    p1.ws.send(JSON.stringify({
      type: "queue-actions",
      actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 310 } }],
    }));

    await waitFor(250);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    const constructionsAfterAction = tickResults[tickResults.length - 1].gameState.players.find(
      (p: any) => p.id === "player-1",
    ).constructions.length;

    await waitFor(200);

    const laterResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    const constructionsAfterDrain = laterResults[laterResults.length - 1].gameState.players.find(
      (p: any) => p.id === "player-1",
    ).constructions.length;

    expect(constructionsAfterDrain).toBe(constructionsAfterAction);
  });

  it("multiple actions queued in same tick are all processed", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const { p1, p2 } = await createMatchAndConnect(port);
    openSockets.push(p1.ws, p2.ws);

    await waitFor(150);

    p1.ws.send(JSON.stringify({
      type: "queue-actions",
      actions: [
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 310 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 300 } },
      ],
    }));

    await waitFor(500);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(3);
    const latestState = tickResults[tickResults.length - 1].gameState;
    const player1 = latestState.players.find((p: any) => p.id === "player-1");
    const player1Nodes = latestState.nodes.filter((n: any) => n.playerId === "player-1");
    expect(player1Nodes.length).toBeGreaterThanOrEqual(3);
  });

  it("full cycle: host → join → disconnect → reconnect → play continues", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const hostRes = await fetch(`http://localhost:${port}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host" }),
    });
    const hostData = await hostRes.json();

    const joinRes = await fetch(`http://localhost:${port}/join?code=${hostData.code}`);
    const joinData = await joinRes.json();

    const p1 = await connectPlayer(port, hostData.matchId, hostData.playerId);
    const p2 = await connectPlayer(port, hostData.matchId, joinData.playerId);
    openSockets.push(p1.ws, p2.ws);

    await waitFor(200);

    const initialTicks = p1.msgs.filter((m: any) => m.type === "tick-result").length;
    expect(initialTicks).toBeGreaterThanOrEqual(1);

    p1.ws.close();
    openSockets = openSockets.filter((ws) => ws !== p1.ws);
    await waitFor(50);

    const p1Reconnected = await connectPlayer(port, hostData.matchId, hostData.playerId);
    openSockets.push(p1Reconnected.ws);

    await waitFor(200);

    const matchStateOnReconnect = p1Reconnected.msgs.filter((m: any) => m.type === "match-state");
    expect(matchStateOnReconnect.length).toBe(1);
    expect(matchStateOnReconnect[0].gameState.tick).toBeGreaterThan(0);

    const ticksAfterReconnect = p1Reconnected.msgs.filter((m: any) => m.type === "tick-result");
    expect(ticksAfterReconnect.length).toBeGreaterThanOrEqual(1);
  });
});
