import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { resetNodeIdCounter, resetEdgeIdCounter } from "./node-placement.js";
import { resetConstructionIdCounter, resetActivationIdCounter } from "./construction.js";
import { processActions, simulateTick } from "./game-loop.js";
import type { GameAction, GameState } from "./types.js";

describe("game loop", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
    resetConstructionIdCounter();
    resetActivationIdCounter();
  });

  function freshState(): GameState {
    return createInitialState(defaultGameConfig);
  }

  describe("processActions", () => {
    it("empty actions returns unchanged state", () => {
      const state = freshState();
      const result = processActions(state, [], "player-1", defaultGameConfig);
      expect(result.nodes).toHaveLength(state.nodes.length);
    });

    it("queues construction for a valid PlaceNode action", () => {
      const state = freshState();

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(0);
      expect(result.players[0].constructions).toHaveLength(1);
      expect(result.players[0].constructions[0].nodeType).toBe("generator");
      expect(result.players[0].constructions[0].totalCost).toBe(15);
      expect(result.players[0].constructions[0].funded).toBe(0);
    });

    it("skips failed action and continues with next", () => {
      const state = freshState();

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 300, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 130, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.players[0].constructions).toHaveLength(2);
    });

    it("does not deduct resources at placement time", () => {
      const state = freshState();
      state.players[0].resources = 0;

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.players[0].resources).toBe(0);
      expect(result.players[0].constructions).toHaveLength(1);
    });
  });

  describe("simulateTick", () => {
    it("empty tick increments tick counter", () => {
      const state = freshState();
      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.tick).toBe(1);
    });

    it("empty tick still generates resources but surplus is discarded", () => {
      const state = freshState();
      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.players[0].resources).toBe(0);
      expect(result.players[1].resources).toBe(0);
    });

    it("queues construction and funds it from surplus", () => {
      const state = freshState();

      const actions = new Map<string, GameAction[]>([
        [
          "player-1",
          [
            { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
          ],
        ],
      ]);

      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.players[0].constructions).toHaveLength(1);
      expect(result.players[0].constructions[0].funded).toBe(1);
      expect(result.players[0].resources).toBe(0);
    });

    it("determinism: identical inputs produce identical outputs", () => {
      const state = freshState();

      const actions = new Map<string, GameAction[]>([
        [
          "player-1",
          [
            { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
            { type: "PlaceNode", nodeType: "generator", position: { x: 125, y: 300 } },
          ],
        ],
      ]);

      resetNodeIdCounter();
      resetEdgeIdCounter();
      resetConstructionIdCounter();
      resetActivationIdCounter();
      const result1 = simulateTick(state, actions, defaultGameConfig);

      resetNodeIdCounter();
      resetEdgeIdCounter();
      resetConstructionIdCounter();
      resetActivationIdCounter();
      const result2 = simulateTick(state, actions, defaultGameConfig);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe("player name propagation", () => {
    it("player name field is preserved through simulateTick", () => {
      const state = freshState();
      state.players[0].name = "Alice";
      state.players[1].name = "Bob";

      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);

      expect(result.players[0].name).toBe("Alice");
      expect(result.players[1].name).toBe("Bob");
    });

    it("player name is optional and undefined is acceptable", () => {
      const state = freshState();
      expect(state.players[0].name).toBeUndefined();

      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.players[0].name).toBeUndefined();
    });
  });
});
