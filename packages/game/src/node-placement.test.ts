import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import {
  validatePlaceNode,
  placeNode,
  resetNodeIdCounter,
  resetEdgeIdCounter,
  generateNodeId,
  generateEdgeId,
} from "./node-placement.js";
import { resetConstructionIdCounter } from "./construction.js";

describe("node placement", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
    resetConstructionIdCounter();
  });

  function freshState() {
    return createInitialState(defaultGameConfig);
  }

  describe("validatePlaceNode", () => {
    it("rejects root placement", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "root",
        { x: 60, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("root");
    });

    it("rejects out of bounds", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: -5, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("out of bounds");
    });

    it("rejects out of bounds (x >= width)", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 800, y: 300 },
      );
      expect(result.valid).toBe(false);
    });

    it("rejects occupied position", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 50, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("occupied");
    });

    it("rejects out of range", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 200, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("range");
    });

    it("accepts valid placement regardless of resources", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 75, y: 300 },
      );
      expect(result.valid).toBe(true);
    });

    it("rejects placement too close to existing node", () => {
      const state = freshState();
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const genId = generateNodeId();
      const stateWithNode: typeof state = {
        ...state,
        nodes: [
          ...state.nodes,
          {
            id: genId,
            playerId: "player-1",
            nodeType: "generator",
            position: { x: 75, y: 300 },
            health: 30,
            maxHealth: 30,
            parentId: rootId,
            connected: true,
          },
        ],
        edges: [
          ...state.edges,
          {
            id: generateEdgeId(),
            fromNodeId: rootId,
            toNodeId: genId,
            health: 20,
            maxHealth: 20,
          },
        ],
      };

      const result = validatePlaceNode(
        stateWithNode,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 80, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Too close to existing node");
    });

    it("accepts placement at exactly minNodeDistance", () => {
      const state = freshState();
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const genId = generateNodeId();
      const stateWithNode: typeof state = {
        ...state,
        nodes: [
          ...state.nodes,
          {
            id: genId,
            playerId: "player-1",
            nodeType: "generator",
            position: { x: 75, y: 300 },
            health: 30,
            maxHealth: 30,
            parentId: rootId,
            connected: true,
          },
        ],
        edges: [
          ...state.edges,
          {
            id: generateEdgeId(),
            fromNodeId: rootId,
            toNodeId: genId,
            health: 20,
            maxHealth: 20,
          },
        ],
      };

      const result = validatePlaceNode(
        stateWithNode,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 95, y: 300 },
      );
      expect(result.valid).toBe(true);
    });

    it("accepts placement beyond minNodeDistance", () => {
      const state = freshState();
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const genId = generateNodeId();
      const stateWithNode: typeof state = {
        ...state,
        nodes: [
          ...state.nodes,
          {
            id: genId,
            playerId: "player-1",
            nodeType: "generator",
            position: { x: 75, y: 300 },
            health: 30,
            maxHealth: 30,
            parentId: rootId,
            connected: true,
          },
        ],
        edges: [
          ...state.edges,
          {
            id: generateEdgeId(),
            fromNodeId: rootId,
            toNodeId: genId,
            health: 20,
            maxHealth: 20,
          },
        ],
      };

      const result = validatePlaceNode(
        stateWithNode,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 100, y: 300 },
      );
      expect(result.valid).toBe(true);
    });

    it("enforces min distance against enemy nodes", () => {
      const state = freshState();
      const p2RootId = state.nodes.find((n) => n.playerId === "player-2")!.id;
      const genId = generateNodeId();
      const stateWithEnemy: typeof state = {
        ...state,
        nodes: [
          ...state.nodes,
          {
            id: genId,
            playerId: "player-2",
            nodeType: "generator",
            position: { x: 725, y: 300 },
            health: 30,
            maxHealth: 30,
            parentId: p2RootId,
            connected: true,
          },
        ],
        edges: [
          ...state.edges,
          {
            id: generateEdgeId(),
            fromNodeId: p2RootId,
            toNodeId: genId,
            health: 20,
            maxHealth: 20,
          },
        ],
      };

      const result = validatePlaceNode(
        stateWithEnemy,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 730, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Too close to existing node");
    });

    it("accepts placement at exact max distance", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 150, y: 300 },
      );
      expect(result.valid).toBe(true);
    });
  });

  describe("placeNode", () => {
    it("queues construction instead of placing node immediately", () => {
      const state = freshState();

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 75, y: 300 },
      );

      expect(newState.nodes).toHaveLength(2);
      expect(newState.edges).toHaveLength(0);
      expect(newState.players[0].constructions).toHaveLength(1);
      expect(newState.players[0].constructions[0].nodeType).toBe("generator");
      expect(newState.players[0].constructions[0].totalCost).toBe(15);
      expect(newState.players[0].constructions[0].funded).toBe(0);
    });

    it("records parentId from closest friendly node", () => {
      const state = freshState();
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 75, y: 300 },
      );

      expect(newState.players[0].constructions[0].parentId).toBe(rootId);
    });

    it("does not deduct resources at placement time", () => {
      const state = freshState();
      state.players[0].resources = 100;

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 75, y: 300 },
      );

      expect(newState.players[0].resources).toBe(100);
    });

    it("returns unchanged state when invalid", () => {
      const state = freshState();

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 200, y: 300 },
      );

      expect(newState).toBe(state);
      expect(newState.players[0].constructions).toHaveLength(0);
    });

    it("does not mutate original state", () => {
      const state = freshState();

      placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 75, y: 300 },
      );

      expect(state.nodes).toHaveLength(2);
      expect(state.players[0].constructions).toHaveLength(0);
    });

    it("rejects root placement", () => {
      const state = freshState();
      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "root",
        { x: 60, y: 300 },
      );
      expect(newState).toBe(state);
    });
  });
});
