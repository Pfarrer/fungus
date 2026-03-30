import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { simulateTick } from "./game-loop.js";
import {
  updateDisconnectedStatus,
  drainDisconnectedNodes,
  removeDeadNodes,
  checkWinCondition,
  resolveDeath,
} from "./death.js";
import { resetNodeIdCounter, resetEdgeIdCounter } from "./node-placement.js";
import type { GameState, Node } from "./types.js";

describe("death mechanic", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
  });

  function freshState(): GameState {
    return createInitialState(defaultGameConfig);
  }

  function addNode(state: GameState, id: string, playerId: string, nodeType: string, x: number, y: number, parentId: string, health?: number): GameState {
    const typeConfig = defaultGameConfig.map.nodeTypeConfigs[nodeType];
    const maxHealth = health ?? typeConfig?.health ?? 30;
    const node: Node = {
      id,
      playerId,
      nodeType: nodeType as Node["nodeType"],
      position: { x, y },
      health: maxHealth,
      maxHealth,
      parentId,
      connected: true,
    };
    return {
      ...state,
      nodes: [...state.nodes, node],
      edges: [
        ...state.edges,
        {
          id: `edge-${id}`,
          fromNodeId: parentId,
          toNodeId: id,
          health: defaultGameConfig.map.edgeHealth,
          maxHealth: defaultGameConfig.map.edgeHealth,
        },
      ],
    };
  }

  describe("disconnected subtree detection", () => {
    it("connected nodes remain connected", () => {
      const state = freshState();
      const result = updateDisconnectedStatus(state);
      expect(result.nodes.every((n) => n.connected)).toBe(true);
    });

    it("nodes without parent path to root are disconnected", () => {
      let state = freshState();
      state = addNode(state, "g1", "player-1", "generator", 60, 300, "1");

      const nodeWithoutParent: Node = {
        id: "orphan",
        playerId: "player-1",
        nodeType: "generator",
        position: { x: 300, y: 300 },
        health: 30,
        maxHealth: 30,
        parentId: "nonexistent",
        connected: true,
      };
      state = { ...state, nodes: [...state.nodes, nodeWithoutParent] };

      const result = updateDisconnectedStatus(state);
      const orphan = result.nodes.find((n) => n.id === "orphan");
      expect(orphan!.connected).toBe(false);
    });
  });

  describe("gradual death", () => {
    it("disconnected nodes lose health each tick", () => {
      let state = freshState();
      state = addNode(state, "g1", "player-1", "generator", 60, 300, "1");

      const nodeWithoutParent: Node = {
        id: "orphan",
        playerId: "player-1",
        nodeType: "generator",
        position: { x: 300, y: 300 },
        health: 20,
        maxHealth: 30,
        parentId: "nonexistent",
        connected: false,
      };
      state = { ...state, nodes: [...state.nodes, nodeWithoutParent] };

      const result = drainDisconnectedNodes(state, defaultGameConfig);
      const orphan = result.nodes.find((n) => n.id === "orphan");
      expect(orphan!.health).toBe(15);
    });

    it("connected nodes do not lose health", () => {
      const state = freshState();
      const result = drainDisconnectedNodes(state, defaultGameConfig);
      expect(result.nodes[0].health).toBe(100);
    });

    it("health cannot go below zero", () => {
      let state = freshState();

      const nodeWithoutParent: Node = {
        id: "orphan",
        playerId: "player-1",
        nodeType: "generator",
        position: { x: 300, y: 300 },
        health: 3,
        maxHealth: 30,
        parentId: "nonexistent",
        connected: false,
      };
      state = { ...state, nodes: [...state.nodes, nodeWithoutParent] };

      const result = drainDisconnectedNodes(state, defaultGameConfig);
      const orphan = result.nodes.find((n) => n.id === "orphan");
      expect(orphan!.health).toBe(0);
    });
  });

  describe("remove dead nodes", () => {
    it("removes nodes with 0 health and their edges", () => {
      let state = freshState();
      state = addNode(state, "g1", "player-1", "generator", 60, 300, "1");

      state.nodes = state.nodes.map((n) =>
        n.id === "g1" ? { ...n, health: 0 } : n,
      );

      const result = removeDeadNodes(state);
      expect(result.nodes.find((n) => n.id === "g1")).toBeUndefined();
      expect(result.edges.find((e) => e.id === "edge-g1")).toBeUndefined();
    });

    it("does not remove nodes with health above 0", () => {
      let state = freshState();
      state = addNode(state, "g1", "player-1", "generator", 60, 300, "1");

      const result = removeDeadNodes(state);
      expect(result.nodes.find((n) => n.id === "g1")).toBeDefined();
    });
  });

  describe("win condition", () => {
    it("sets winner when a root is destroyed", () => {
      let state = freshState();
      state.nodes = state.nodes.map((n) =>
        n.id === "2" ? { ...n, health: 0 } : n,
      );

      state = removeDeadNodes(state);
      const result = checkWinCondition(state);
      expect(result.winner).toBe("player-1");
    });

    it("no winner when all roots alive", () => {
      const state = freshState();
      const result = checkWinCondition(state);
      expect(result.winner).toBeNull();
    });
  });

  describe("resolveDeath", () => {
    it("detects disconnected, drains, removes dead, cascades", () => {
      let state = freshState();
      state = addNode(state, "g1", "player-1", "generator", 60, 300, "1");

      const nodeWithoutParent: Node = {
        id: "orphan",
        playerId: "player-1",
        nodeType: "generator",
        position: { x: 300, y: 300 },
        health: 5,
        maxHealth: 30,
        parentId: "nonexistent",
        connected: true,
      };
      state = { ...state, nodes: [...state.nodes, nodeWithoutParent] };

      const result = resolveDeath(state, defaultGameConfig);
      expect(result.nodes.find((n) => n.id === "orphan")).toBeUndefined();
    });
  });

  describe("death in simulateTick", () => {
    it("death runs during simulateTick", () => {
      let state = freshState();

      const nodeWithoutParent: Node = {
        id: "orphan",
        playerId: "player-1",
        nodeType: "generator",
        position: { x: 300, y: 300 },
        health: 5,
        maxHealth: 30,
        parentId: "nonexistent",
        connected: true,
      };
      state = { ...state, nodes: [...state.nodes, nodeWithoutParent] };

      const actions = new Map<string, import("./types.js").GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);

      expect(result.nodes.find((n) => n.id === "orphan")).toBeUndefined();
      expect(result.tick).toBe(1);
    });
  });
});
