import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { resetNodeIdCounter, resetEdgeIdCounter, generateNodeId, generateEdgeId } from "./node-placement.js";
import { getConnectedNodes, generateResources, consumeResources } from "./resource-economy.js";
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
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const genId = generateNodeId();
      state = {
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

      const connected = getConnectedNodes(state, "player-1");
      expect(connected).toHaveLength(2);
      expect(connected.some((n) => n.nodeType === "generator")).toBe(true);
    });

    it("does not include other player's nodes", () => {
      let state = freshState();
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const genId = generateNodeId();
      state = {
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
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const genId = generateNodeId();
      state = {
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

      const newState = generateResources(state, defaultGameConfig);
      expect(newState.players[0].resources).toBe(1 + 3);
    });

    it("surplus discarded with no constructions", () => {
      const state = freshState();
      state.players[0].resources = 10;
      const generated = generateResources(state, defaultGameConfig);
      expect(generated.players[0].resources).toBe(11);
    });
  });

  describe("consumeResources", () => {
    it("deducts consumption from connected combat nodes", () => {
      let state = freshState();
      state.players[0].resources = 10;
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const turretId = generateNodeId();
      state = {
        ...state,
        nodes: [
          ...state.nodes,
          {
            id: turretId,
            playerId: "player-1",
            nodeType: "turret",
            position: { x: 75, y: 300 },
            health: 20,
            maxHealth: 20,
            parentId: rootId,
            connected: true,
          },
        ],
        edges: [
          ...state.edges,
          {
            id: generateEdgeId(),
            fromNodeId: rootId,
            toNodeId: turretId,
            health: 20,
            maxHealth: 20,
          },
        ],
      };

      const newState = consumeResources(state, defaultGameConfig);
      expect(newState.players[0].resources).toBe(10 - 2);
    });

    it("resources cannot go below zero from consumption", () => {
      let state = freshState();
      state.players[0].resources = 1;
      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const turretId = generateNodeId();
      state = {
        ...state,
        nodes: [
          ...state.nodes,
          {
            id: turretId,
            playerId: "player-1",
            nodeType: "turret",
            position: { x: 75, y: 300 },
            health: 20,
            maxHealth: 20,
            parentId: rootId,
            connected: true,
          },
        ],
        edges: [
          ...state.edges,
          {
            id: generateEdgeId(),
            fromNodeId: rootId,
            toNodeId: turretId,
            health: 20,
            maxHealth: 20,
          },
        ],
      };

      const newState = consumeResources(state, defaultGameConfig);
      expect(newState.players[0].resources).toBe(0);
    });
  });
});
