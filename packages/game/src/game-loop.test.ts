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
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
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
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 300, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 130, y: 300 } },
      ];

      const result = processActions(state, actions, "player-1", defaultGameConfig);
      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(2);
    });

    it("actions build on each other", () => {
      let state = freshState();
      state.players[0].resources = 30;

      const actions: GameAction[] = [
        { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
        { type: "PlaceNode", nodeType: "generator", position: { x: 125, y: 300 } },
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
            { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
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
            { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
            { type: "PlaceNode", nodeType: "generator", position: { x: 125, y: 300 } },
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
