import { describe, it, expect } from "vitest";
import type { GameState, GameConfig } from "@fungus/game";

const defaultConfig: GameConfig = {
  map: { width: 800, height: 600, maxConnectionDistance: 100, spawnPoints: [], nodeTypeConfigs: {}, edgeHealth: 100 },
  resourceCap: 100,
  deathRatePerTick: 0,
  maxShieldReductionPercent: 0,
  tickDurationMs: 5000,
};

interface PendingNode {
  position: { x: number; y: number };
  nodeType: string;
  playerId: string;
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    nodes: [],
    edges: [],
    players: [
      { id: "p1", resources: 50, name: "Player 1", spawnPoint: { x: 100, y: 300 } },
      { id: "p2", resources: 50, name: "Player 2", spawnPoint: { x: 700, y: 300 } },
    ],
    tick: 0,
    winner: null,
    ...overrides,
  };
}

describe("PendingNode interface", () => {
  it("has correct structure", () => {
    const pending: PendingNode = {
      position: { x: 50, y: 50 },
      nodeType: "turret",
      playerId: "p1",
    };

    expect(pending.position.x).toBe(50);
    expect(pending.position.y).toBe(50);
    expect(pending.nodeType).toBe("turret");
    expect(pending.playerId).toBe("p1");
  });
});

describe("PendingNode matching logic", () => {
  it("finds matching node by position, nodeType, and playerId", () => {
    const pending: PendingNode = {
      position: { x: 50, y: 50 },
      nodeType: "turret",
      playerId: "p1",
    };

    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "turret", position: { x: 50, y: 50 }, health: 40, maxHealth: 40, parentId: null, connected: true },
      ],
    });

    const match = state.nodes.find(
      (n) =>
        n.position.x === pending.position.x &&
        n.position.y === pending.position.y &&
        n.nodeType === pending.nodeType &&
        n.playerId === pending.playerId,
    );

    expect(match).toBeDefined();
    expect(match?.id).toBe("n1");
  });

  it("does not match when position differs", () => {
    const pending: PendingNode = {
      position: { x: 50, y: 50 },
      nodeType: "turret",
      playerId: "p1",
    };

    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "turret", position: { x: 51, y: 50 }, health: 40, maxHealth: 40, parentId: null, connected: true },
      ],
    });

    const match = state.nodes.find(
      (n) =>
        n.position.x === pending.position.x &&
        n.position.y === pending.position.y &&
        n.nodeType === pending.nodeType &&
        n.playerId === pending.playerId,
    );

    expect(match).toBeUndefined();
  });

  it("does not match when nodeType differs", () => {
    const pending: PendingNode = {
      position: { x: 50, y: 50 },
      nodeType: "turret",
      playerId: "p1",
    };

    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "generator", position: { x: 50, y: 50 }, health: 30, maxHealth: 30, parentId: null, connected: true },
      ],
    });

    const match = state.nodes.find(
      (n) =>
        n.position.x === pending.position.x &&
        n.position.y === pending.position.y &&
        n.nodeType === pending.nodeType &&
        n.playerId === pending.playerId,
    );

    expect(match).toBeUndefined();
  });

  it("does not match when playerId differs", () => {
    const pending: PendingNode = {
      position: { x: 50, y: 50 },
      nodeType: "turret",
      playerId: "p1",
    };

    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p2", nodeType: "turret", position: { x: 50, y: 50 }, health: 40, maxHealth: 40, parentId: null, connected: true },
      ],
    });

    const match = state.nodes.find(
      (n) =>
        n.position.x === pending.position.x &&
        n.position.y === pending.position.y &&
        n.nodeType === pending.nodeType &&
        n.playerId === pending.playerId,
    );

    expect(match).toBeUndefined();
  });
});

describe("findClosestFriendlyNodeWithinRange logic", () => {
  function findClosestFriendlyNodeWithinRange(
    position: { x: number; y: number },
    playerId: string,
    state: GameState,
    config: GameConfig,
  ): GameState["nodes"][0] | null {
    const maxDist = config.map.maxConnectionDistance;
    let closest: GameState["nodes"][0] | null = null;
    let closestDist = maxDist;

    for (const node of state.nodes) {
      if (node.playerId !== playerId) continue;
      const dx = node.position.x - position.x;
      const dy = node.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
    }

    return closest;
  }

  it("returns null when no friendly nodes in range", () => {
    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p2", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
      ],
    });

    const result = findClosestFriendlyNodeWithinRange(
      { x: 50, y: 50 },
      "p1",
      state,
      defaultConfig,
    );

    expect(result).toBeNull();
  });

  it("returns null when no nodes exist", () => {
    const state = makeState();

    const result = findClosestFriendlyNodeWithinRange(
      { x: 50, y: 50 },
      "p1",
      state,
      defaultConfig,
    );

    expect(result).toBeNull();
  });

  it("returns closest node within range", () => {
    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
        { id: "n2", playerId: "p1", nodeType: "generator", position: { x: 80, y: 300 }, health: 30, maxHealth: 30, parentId: "n1", connected: true },
      ],
    });

    const result = findClosestFriendlyNodeWithinRange(
      { x: 50, y: 300 },
      "p1",
      state,
      defaultConfig,
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe("n1");
  });

  it("returns null when all nodes beyond maxConnectionDistance", () => {
    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
      ],
    });

    const result = findClosestFriendlyNodeWithinRange(
      { x: 50, y: 50 },
      "p1",
      state,
      defaultConfig,
    );

    expect(result).toBeNull();
  });

  it("returns node within maxConnectionDistance (strictly less than)", () => {
    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 149 }, health: 100, maxHealth: 100, parentId: null, connected: true },
      ],
    });

    const result = findClosestFriendlyNodeWithinRange(
      { x: 50, y: 50 },
      "p1",
      state,
      defaultConfig,
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe("n1");
  });
});

describe("ghost node reconciliation", () => {
  it("clears pendingNodes after reconciliation", () => {
    const pendingNodes: PendingNode[] = [
      { position: { x: 50, y: 50 }, nodeType: "turret", playerId: "p1" },
    ];

    const state = makeState({
      nodes: [{ id: "n1", playerId: "p1", nodeType: "turret", position: { x: 50, y: 50 }, health: 40, maxHealth: 40, parentId: null, connected: true }],
    });

    for (const pending of pendingNodes) {
      state.nodes.find(
        (n) =>
          n.position.x === pending.position.x &&
          n.position.y === pending.position.y &&
          n.nodeType === pending.nodeType &&
          n.playerId === pending.playerId,
      );
    }

    expect(pendingNodes).toHaveLength(1);
    pendingNodes.length = 0;
    expect(pendingNodes).toHaveLength(0);
  });

  it("clears pendingNodes even when no match found", () => {
    const pendingNodes: PendingNode[] = [
      { position: { x: 50, y: 50 }, nodeType: "turret", playerId: "p1" },
    ];

    const state = makeState({
      nodes: [],
    });

    for (const pending of pendingNodes) {
      state.nodes.find(
        (n) =>
          n.position.x === pending.position.x &&
          n.position.y === pending.position.y &&
          n.nodeType === pending.nodeType &&
          n.playerId === pending.playerId,
      );
    }

    expect(pendingNodes).toHaveLength(1);
    pendingNodes.length = 0;
    expect(pendingNodes).toHaveLength(0);
  });
});

describe("node type colors", () => {
  function getColorForNodeType(nodeType: string): number {
    const colors: Record<string, number> = {
      root: 0xe94560,
      generator: 0x53d769,
      turret: 0xff8c00,
      shield: 0x00bfff,
    };
    return colors[nodeType] ?? 0x53d769;
  }

  function getRadiusForNodeType(nodeType: string): number {
    const radius: Record<string, number> = {
      root: 12,
      generator: 8,
      turret: 9,
      shield: 9,
    };
    return radius[nodeType] ?? 8;
  }

  it("returns correct color for root", () => {
    expect(getColorForNodeType("root")).toBe(0xe94560);
  });

  it("returns correct color for turret", () => {
    expect(getColorForNodeType("turret")).toBe(0xff8c00);
  });

  it("returns correct color for shield", () => {
    expect(getColorForNodeType("shield")).toBe(0x00bfff);
  });

  it("returns correct color for generator", () => {
    expect(getColorForNodeType("generator")).toBe(0x53d769);
  });

  it("returns correct radius for root", () => {
    expect(getRadiusForNodeType("root")).toBe(12);
  });

  it("returns correct radius for turret", () => {
    expect(getRadiusForNodeType("turret")).toBe(9);
  });
});