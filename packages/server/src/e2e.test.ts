import { describe, it, expect, afterAll } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { createServer } from "./server.js";
import type { GameConfig } from "@fungus/game";

const fastConfig: GameConfig = {
  map: {
    width: 800,
    height: 600,
    maxConnectionDistance: 100,
    spawnPoints: [
      { x: 50, y: 300 },
      { x: 750, y: 300 },
    ],
    nodeTypeConfigs: {
      root: { cost: 0, health: 100, productionPerTick: 1, consumptionPerTick: 0 },
      generator: { cost: 15, health: 30, productionPerTick: 3, consumptionPerTick: 0 },
    },
    edgeHealth: 20,
  },
  tickDurationMs: 50,
  resourceCap: 500,
  deathRatePerTick: 5,
  maxShieldReductionPercent: 90,
};

describe("End-to-end smoke test", () => {
  let wss: WebSocketServer | null = null;

  afterAll(() => {
    if (wss) wss.close();
  });

  it("connects two players and runs a tick", async () => {
    wss = createServer(fastConfig, 0);

    await new Promise<void>((resolve) => wss!.on("listening", resolve));

    const port = (wss.address() as { port: number }).port;
    const url1 = `ws://localhost:${port}?matchId=e2e-test&playerId=player-1`;
    const url2 = `ws://localhost:${port}?matchId=e2e-test&playerId=player-2`;

    const ws1 = new WebSocket(url1);
    const ws2 = new WebSocket(url2);

    const messages1: any[] = [];
    const messages2: any[] = [];

    ws1.on("message", (data) => messages1.push(JSON.parse(data.toString())));
    ws2.on("message", (data) => messages2.push(JSON.parse(data.toString())));

    await new Promise<void>((resolve) => ws1.on("open", resolve));
    await new Promise<void>((resolve) => ws2.on("open", resolve));

    await new Promise((resolve) => setTimeout(resolve, 300));

    const tickResults1 = messages1.filter((m) => m.type === "tick-result");
    const tickResults2 = messages2.filter((m) => m.type === "tick-result");

    expect(tickResults1.length).toBeGreaterThanOrEqual(1);
    expect(tickResults2.length).toBeGreaterThanOrEqual(1);

    const state = tickResults1[0].gameState;
    expect(state.nodes.length).toBe(2);
    expect(state.players.length).toBe(2);

    ws1.close();
    ws2.close();
  });

  it("queues actions and processes them on next tick", async () => {
    const server = createServer(fastConfig, 0);

    await new Promise<void>((resolve) => server.on("listening", resolve));

    const port = (server.address() as { port: number }).port;
    const matchId = "e2e-actions";
    const url1 = `ws://localhost:${port}?matchId=${matchId}&playerId=player-1`;
    const url2 = `ws://localhost:${port}?matchId=${matchId}&playerId=player-2`;

    const ws1 = new WebSocket(url1);
    const ws2 = new WebSocket(url2);

    const messages1: any[] = [];

    ws1.on("message", (data) => messages1.push(JSON.parse(data.toString())));

    await new Promise<void>((resolve) => ws1.on("open", resolve));
    await new Promise<void>((resolve) => ws2.on("open", resolve));

    await new Promise((resolve) => setTimeout(resolve, 150));

    ws1.send(JSON.stringify({
      type: "queue-actions",
      actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } }],
    }));

    await new Promise((resolve) => setTimeout(resolve, 300));

    const tickResults = messages1.filter((m) => m.type === "tick-result");
    expect(tickResults.length).toBeGreaterThanOrEqual(2);

    const latestState = tickResults[tickResults.length - 1].gameState;
    expect(latestState.nodes.length).toBeGreaterThanOrEqual(2);

    ws1.close();
    ws2.close();
    server.close();
  });
});
