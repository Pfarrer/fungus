import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import {
  validatePlaceNode,
  placeNode,
  resetNodeIdCounter,
  resetEdgeIdCounter,
} from "./node-placement.js";

describe("node placement", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
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

    it("rejects insufficient resources", () => {
      const state = freshState();
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("resources");
    });

    it("accepts valid placement", () => {
      const state = freshState();
      state.players[0].resources = 15;
      const result = validatePlaceNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );
      expect(result.valid).toBe(true);
    });

    it("accepts placement at exact max distance", () => {
      const state = freshState();
      state.players[0].resources = 15;
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
    it("places a node within range and deducts cost", () => {
      const state = freshState();
      state.players[0].resources = 15;

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      expect(newState.nodes).toHaveLength(3);
      expect(newState.edges).toHaveLength(1);
      expect(newState.players[0].resources).toBe(0);
    });

    it("creates edge to closest friendly node (parent)", () => {
      const state = freshState();
      state.players[0].resources = 15;

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      const newNode = newState.nodes.find(
        (n) => n.position.x === 60 && n.position.y === 300,
      );
      expect(newNode).toBeDefined();
      expect(newNode!.parentId).toBe("1");

      const edge = newState.edges[0];
      expect(edge.fromNodeId).toBe("1");
      expect(edge.toNodeId).toBe(newNode!.id);
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
      expect(newState.nodes).toHaveLength(2);
    });

    it("sets correct health on new node and edge", () => {
      const state = freshState();
      state.players[0].resources = 15;

      const newState = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      const newNode = newState.nodes.find(
        (n) => n.nodeType === "generator",
      );
      expect(newNode!.health).toBe(30);
      expect(newNode!.maxHealth).toBe(30);

      const edge = newState.edges[0];
      expect(edge.health).toBe(30);
      expect(edge.maxHealth).toBe(30);
    });

    it("does not mutate original state", () => {
      const state = freshState();
      state.players[0].resources = 15;
      const originalNodeCount = state.nodes.length;

      placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      expect(state.nodes).toHaveLength(originalNodeCount);
      expect(state.edges).toHaveLength(0);
    });
  });
});
