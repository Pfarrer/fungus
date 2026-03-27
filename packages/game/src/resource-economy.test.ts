import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { resetNodeIdCounter, resetEdgeIdCounter, placeNode } from "./node-placement.js";
import { getConnectedNodes, generateResources } from "./resource-economy.js";
import type { GameState } from "./types.js";

describe("resource economy", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
  });

  function freshState(): GameState {
    return createInitialState(defaultGameConfig);
  }

  describe("getConnectedNodes", () => {
    it("returns only root when no other nodes placed", () => {
      const state = freshState();
      const connected = getConnectedNodes(state, "player-1");
      expect(connected).toHaveLength(1);
      expect(connected[0].nodeType).toBe("root");
    });

    it("includes generator connected to root", () => {
      let state = freshState();
      state.players[0].resources = 15;
      state = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      const connected = getConnectedNodes(state, "player-1");
      expect(connected).toHaveLength(2);
      expect(connected.some((n) => n.nodeType === "generator")).toBe(true);
    });

    it("does not include other player's nodes", () => {
      let state = freshState();
      state.players[0].resources = 15;
      state = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      const connected = getConnectedNodes(state, "player-2");
      expect(connected).toHaveLength(1);
      expect(connected[0].playerId).toBe("player-2");
    });
  });

  describe("generateResources", () => {
    it("root produces 1 resource per tick", () => {
      const state = freshState();
      const newState = generateResources(state, defaultGameConfig);

      expect(newState.players[0].resources).toBe(1);
      expect(newState.players[1].resources).toBe(1);
    });

    it("multiple generators stack production", () => {
      let state = freshState();
      state.players[0].resources = 15;
      state.players[1].resources = 0;

      state = placeNode(
        state,
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 60, y: 300 },
      );

      const newState = generateResources(state, defaultGameConfig);
      expect(newState.players[0].resources).toBe(1 + 3);
    });

    it("resource cap enforced", () => {
      const state = freshState();
      state.players[0].resources = 499;
      const newState = generateResources(state, defaultGameConfig);
      expect(newState.players[0].resources).toBe(500);
    });

    it("resources below cap accumulate", () => {
      const state = freshState();
      state.players[0].resources = 400;
      const newState = generateResources(state, defaultGameConfig);
      expect(newState.players[0].resources).toBe(401);
    });
  });
});
