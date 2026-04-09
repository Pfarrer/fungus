import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { Match } from "./match.js";
import type { ClientConnection } from "./protocol.js";
import type { GameConfig } from "@fungus/game";

function createMockClient(playerId: string, matchId = "test-match"): ClientConnection {
  const ws = { send: vi.fn(), readyState: 1 } as unknown as WebSocket;
  return { ws, matchId, playerId };
}

const testConfig: GameConfig = {
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
  tickDurationMs: 100,
  resourceCap: 500,
  deathRatePerTick: 5,
  maxShieldReductionPercent: 90,
};

describe("Match", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a match with initial game state", () => {
    const match = new Match("test-match", testConfig);
    expect(match.matchId).toBe("test-match");
    expect(match.playerCount()).toBe(0);
  });

  it("adds players and sends match-state", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");
    const client2 = createMockClient("player-2");

    match.addPlayer(client1);
    expect(match.playerCount()).toBe(1);
    expect(client1.ws.send).toHaveBeenCalled();

    match.addPlayer(client2);
    expect(match.playerCount()).toBe(2);
    expect(client2.ws.send).toHaveBeenCalled();
  });

  it("sends waiting status to first player", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");

    match.addPlayer(client1);
    match.tryStart();

    const sent = (client1.ws.send as ReturnType<typeof vi.fn>).mock.calls;
    const lastMsg = JSON.parse(sent[sent.length - 1][0] as string);
    expect(lastMsg.type).toBe("waiting");
  });

  it("starts tick loop when second player joins", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");
    const client2 = createMockClient("player-2");

    match.addPlayer(client1);
    match.addPlayer(client2);
    match.tryStart();

    vi.advanceTimersByTime(150);

    const sent = (client1.ws.send as ReturnType<typeof vi.fn>).mock.calls;
    const tickResults = sent.filter((call: unknown[]) => {
      const msg = JSON.parse(call[0] as string);
      return msg.type === "tick-result";
    });
    expect(tickResults.length).toBeGreaterThanOrEqual(1);
  });

  it("handles player disconnection", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");
    const client2 = createMockClient("player-2");

    match.addPlayer(client1);
    match.addPlayer(client2);
    match.tryStart();

    match.removePlayer("player-2");
    expect(match.playerCount()).toBe(1);
  });

  it("notifies the remaining player when an opponent disconnects", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");
    const client2 = createMockClient("player-2");

    match.addPlayer(client1);
    match.addPlayer(client2);
    match.tryStart();

    match.removePlayer("player-2");

    const sent = (client1.ws.send as ReturnType<typeof vi.fn>).mock.calls;
    const parsedMessages = sent.map((call: unknown[]) => JSON.parse(call[0] as string));
    const presenceMsg = [...parsedMessages].reverse().find((msg: { type?: string }) => msg.type === "presence");
    expect(presenceMsg).toEqual({
      type: "presence",
      playerId: "player-2",
      connected: false,
    });
  });

  it("handles player reconnection", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");
    const client2 = createMockClient("player-2");

    match.addPlayer(client1);
    match.addPlayer(client2);
    match.tryStart();

    match.removePlayer("player-2");
    expect(match.playerCount()).toBe(1);

    const reconnectedClient = createMockClient("player-2");
    match.reconnectPlayer(reconnectedClient);
    expect(match.playerCount()).toBe(2);
  });

  it("notifies the remaining player when an opponent reconnects", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");
    const client2 = createMockClient("player-2");

    match.addPlayer(client1);
    match.addPlayer(client2);
    match.tryStart();
    match.removePlayer("player-2");

    const reconnectedClient = createMockClient("player-2");
    match.reconnectPlayer(reconnectedClient);

    const sent = (client1.ws.send as ReturnType<typeof vi.fn>).mock.calls;
    const parsedMessages = sent.map((call: unknown[]) => JSON.parse(call[0] as string));
    const presenceMsg = [...parsedMessages].reverse().find((msg: { type?: string }) => msg.type === "presence");
    expect(presenceMsg).toEqual({
      type: "presence",
      playerId: "player-2",
      connected: true,
    });
  });

  it("destroys match when all players leave", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");

    match.addPlayer(client1);
    match.removePlayer("player-1");

    expect(match.playerCount()).toBe(0);
    match.destroy();
  });

  it("queues actions for players", () => {
    const match = new Match("test-match", testConfig);
    const client1 = createMockClient("player-1");

    match.addPlayer(client1);
    match.queueActions("player-1", [
      { type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 200 } },
    ]);

    expect(match.playerCount()).toBe(1);
  });
});
