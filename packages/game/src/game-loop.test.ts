import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { resetNodeIdCounter, resetEdgeIdCounter } from "./node-placement.js";
import { processActions, simulateTick } from "./game-loop.js";
import type { GameAction, GameState } from "./types.js";

describe("game loop", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
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

    it("applies a single valid action", () => {
      let state = freshState();
      state.players[0].resources = 15;

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(1);
      expect(result.players[0].resources).toBe(0);
    });

    it("skips failed action and continues with next", () => {
      let state = freshState();
      state.players[0].resources = 30;

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 300, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 80, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(2);
    });

    it("actions build on each other", () => {
      let state = freshState();
      state.players[0].resources = 30;

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 120, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(2);
    });
  });

  describe("simulateTick", () => {
    it("empty tick increments tick counter", () => {
      const state = freshState();
      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.tick).toBe(1);
    });

    it("empty tick still generates resources", () => {
      const state = freshState();
      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.players[0].resources).toBe(1);
      expect(result.players[1].resources).toBe(1);
    });

    it("processes actions then generates resources", () => {
      let state = freshState();
      state.players[0].resources = 15;

      const actions = new Map<string, GameAction[]>([
        [
          "player-1",
          [
            { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 300 } },
          ],
        ],
      ]);

      const result = simulateTick(state, actions, defaultGameConfig);
      expect(result.nodes).toHaveLength(3);
      expect(result.players[0].resources).toBe(4);
    });

    it("determinism: identical inputs produce identical outputs", () => {
      let state = freshState();
      state.players[0].resources = 30;

      const actions = new Map<string, GameAction[]>([
        [
          "player-1",
          [
            { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 300 } },
            { type: "PlaceNode", nodeType: "generator", position: { x: 120, y: 300 } },
          ],
        ],
      ]);

      resetNodeIdCounter();
      resetEdgeIdCounter();
      const result1 = simulateTick(state, actions, defaultGameConfig);

      resetNodeIdCounter();
      resetEdgeIdCounter();
      const result2 = simulateTick(state, actions, defaultGameConfig);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });
});
