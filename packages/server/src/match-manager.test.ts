import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { MatchManager } from "./match-manager.js";
import type { ClientConnection } from "./protocol.js";
import type { GameConfig } from "@fungus/game";

function createMockClient(playerId: string, matchId: string): ClientConnection {
  const ws = { send: vi.fn(), readyState: 1 } as unknown as WebSocket;
  return { ws, matchId, playerId };
}

const testConfig: GameConfig = {
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
      root: { cost: 0, health: 100, productionPerTick: 1, consumptionPerTick: 0 },
      generator: { cost: 15, health: 30, productionPerTick: 3, consumptionPerTick: 0 },
    },
    edgeHealth: 20,
  },
  tickDurationMs: 50,
  deathRatePerTick: 5,
  maxShieldReductionPercent: 90,
};

describe("MatchManager", () => {
  let manager: MatchManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new MatchManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a match via createMatchWithCode and adds first player", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client = createMockClient("player-1", matchId);
    manager.handleConnect(client, testConfig);

    const match = manager.getMatch(matchId);
    expect(match).toBeDefined();
    expect(match!.playerCount()).toBe(1);
  });

  it("adds second player to existing match", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client1 = createMockClient("player-1", matchId);
    const client2 = createMockClient("player-2", matchId);

    manager.handleConnect(client1, testConfig);
    manager.handleConnect(client2, testConfig);

    const match = manager.getMatch(matchId);
    expect(match!.playerCount()).toBe(2);
  });

  it("queues actions for the correct match", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client1 = createMockClient("player-1", matchId);
    const client2 = createMockClient("player-2", matchId);

    manager.handleConnect(client1, testConfig);
    manager.handleConnect(client2, testConfig);

    manager.queueActions(matchId, "player-1", [
      { type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 200 } },
    ]);

    vi.advanceTimersByTime(60);

    const sent = (client1.ws.send as ReturnType<typeof vi.fn>).mock.calls;
    const tickResults = sent.filter((call: unknown[]) => {
      const msg = JSON.parse(call[0] as string);
      return msg.type === "tick-result";
    });
    expect(tickResults.length).toBeGreaterThanOrEqual(1);
  });

  it("removes match when all players disconnect", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client1 = createMockClient("player-1", matchId);
    manager.handleConnect(client1, testConfig);
    manager.handleDisconnect(matchId, "player-1");

    expect(manager.getMatch(matchId)).toBeUndefined();
  });

  it("keeps match alive when one player disconnects", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client1 = createMockClient("player-1", matchId);
    const client2 = createMockClient("player-2", matchId);

    manager.handleConnect(client1, testConfig);
    manager.handleConnect(client2, testConfig);

    manager.handleDisconnect(matchId, "player-2");

    const match = manager.getMatch(matchId);
    expect(match).toBeDefined();
    expect(match!.playerCount()).toBe(1);
  });

  it("ignores actions for non-existent match", () => {
    expect(() => {
      manager.queueActions("nonexistent", "player-1", []);
    }).not.toThrow();
  });

  it("tick loop broadcasts to both players", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client1 = createMockClient("player-1", matchId);
    const client2 = createMockClient("player-2", matchId);

    manager.handleConnect(client1, testConfig);
    manager.handleConnect(client2, testConfig);

    vi.advanceTimersByTime(60);

    expect(client1.ws.send).toHaveBeenCalled();
    expect(client2.ws.send).toHaveBeenCalled();
  });

  it("returns match-not-found for unknown matchId", () => {
    const client = createMockClient("player-1", "nonexistent");
    const result = manager.handleConnect(client, testConfig);
    expect(result).toBe("match-not-found");
  });

  it("replaces stale connection when player reconnects", () => {
    const { matchId } = manager.createMatchWithCode(testConfig);
    const client1 = createMockClient("player-1", matchId);
    manager.handleConnect(client1, testConfig);

    const client2 = createMockClient("player-2", matchId);
    manager.handleConnect(client2, testConfig);

    const client1Reconnect = createMockClient("player-1", matchId);
    (client1.ws.close as ReturnType<typeof vi.fn>) = vi.fn();
    const result = manager.handleConnect(client1Reconnect, testConfig);

    expect(result).toBe("ok");
    expect(client1.ws.close).toHaveBeenCalled();
  });
});
