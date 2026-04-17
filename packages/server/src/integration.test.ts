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
  resourceCap: 500,
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

    const p1 = await connectPlayer(port, "test-waiting", "player-1");
    openSockets.push(p1.ws);

    await waitFor(50);

    const waitingMsgs = p1.msgs.filter((m: any) => m.type === "waiting");
    expect(waitingMsgs.length).toBe(1);

    const matchStateMsgs = p1.msgs.filter((m: any) => m.type === "match-state");
    expect(matchStateMsgs.length).toBe(1);
    expect(matchStateMsgs[0].gameState.nodes.length).toBe(2);
    expect(matchStateMsgs[0].gameState.players.length).toBe(2);

    const p2 = await connectPlayer(port, "test-waiting", "player-2");
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

    const p1 = await connectPlayer(port, "test-ticks", "player-1");
    const p2 = await connectPlayer(port, "test-ticks", "player-2");
    openSockets.push(p1.ws, p2.ws);

    await waitFor(550);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(4);

    for (let i = 1; i < tickResults.length; i++) {
      expect(tickResults[i].gameState.tick).toBe(tickResults[i - 1].gameState.tick + 1);
    }
  });

  it("queued actions create new nodes in tick-result", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const p1 = await connectPlayer(port, "test-actions", "player-1");
    const p2 = await connectPlayer(port, "test-actions", "player-2");
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
  });

  it("both players see identical game state in tick-result", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const p1 = await connectPlayer(port, "test-consistency", "player-1");
    const p2 = await connectPlayer(port, "test-consistency", "player-2");
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

  it("resources accumulate over ticks for connected root nodes", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const p1 = await connectPlayer(port, "test-resources", "player-1");
    const p2 = await connectPlayer(port, "test-resources", "player-2");
    openSockets.push(p1.ws, p2.ws);

    await waitFor(350);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(2);

    const firstResources = tickResults[0].gameState.players.find(
      (p: any) => p.id === "player-1",
    ).resources;
    const lastResources = tickResults[tickResults.length - 1].gameState.players.find(
      (p: any) => p.id === "player-1",
    ).resources;

    expect(lastResources).toBeGreaterThan(firstResources);
  });

  it("action queue is drained after tick — second tick has no extra nodes", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const p1 = await connectPlayer(port, "test-drain", "player-1");
    const p2 = await connectPlayer(port, "test-drain", "player-2");
    openSockets.push(p1.ws, p2.ws);

    await waitFor(150);

    p1.ws.send(JSON.stringify({
      type: "queue-actions",
      actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 310 } }],
    }));

    await waitFor(250);

    const tickResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    const nodesAfterAction = tickResults[tickResults.length - 1].gameState.nodes.length;

    await waitFor(200);

    const laterResults = p1.msgs.filter((m: any) => m.type === "tick-result");
    const nodesAfterDrain = laterResults[laterResults.length - 1].gameState.nodes.length;

    expect(nodesAfterDrain).toBe(nodesAfterAction);
  });

  it("multiple actions queued in same tick are all processed", async () => {
    server = createServer(fastConfig, 0);
    await new Promise<void>((resolve) => server!.on("listening", resolve));
    const port = getPort(server!);

    const p1 = await connectPlayer(port, "test-multi", "player-1");
    const p2 = await connectPlayer(port, "test-multi", "player-2");
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
    const player1Nodes = latestState.nodes.filter((n: any) => n.playerId === "player-1");
    expect(player1Nodes.length).toBeGreaterThanOrEqual(3);
  });
});
