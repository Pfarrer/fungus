import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { resolveCombat, getShieldReductionForNode } from "./combat.js";
import { simulateTick } from "./game-loop.js";
import { resetNodeIdCounter, resetEdgeIdCounter } from "./node-placement.js";
import type { GameAction, GameState, Node } from "./types.js";

describe("combat system", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
  });

  function freshState(): GameState {
    return createInitialState(defaultGameConfig);
  }

  function addNode(state: GameState, id: string, playerId: string, nodeType: string, x: number, y: number, parentId: string): GameState {
    const typeConfig = defaultGameConfig.map.nodeTypeConfigs[nodeType];
    const health = typeConfig?.health ?? 30;
    const node: Node = {
      id,
      playerId,
      nodeType: nodeType as Node["nodeType"],
      position: { x, y },
      health,
      maxHealth: health,
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

  function stateWithClosePlayers(): GameState {
    let state = freshState();
    state.nodes = state.nodes.map((n) => {
      if (n.id === "1") return { ...n, position: { x: 50, y: 300 } };
      if (n.id === "2") return { ...n, position: { x: 150, y: 300 } };
      return n;
    });
    return state;
  }

  describe("turret targeting", () => {
    it("turret damages nearest enemy node within range", () => {
      const state = stateWithClosePlayers();
      const stateWithTurret = addNode(state, "t1", "player-1", "turret", 60, 300, "1");

      const result = resolveCombat(stateWithTurret, defaultGameConfig);

      const enemyRoot = result.nodes.find((n) => n.id === "2");
      expect(enemyRoot!.health).toBeLessThan(100);
    });

    it("turret does not damage enemies out of range", () => {
      let state = freshState();
      state = addNode(state, "t1", "player-1", "turret", 60, 300, "1");

      const result = resolveCombat(state, defaultGameConfig);

      const enemyRoot = result.nodes.find((n) => n.id === "2");
      expect(enemyRoot!.health).toBe(100);
    });

    it("multiple turrets deal cumulative damage", () => {
      const state = stateWithClosePlayers();
      const withOneTurret = addNode(state, "t1", "player-1", "turret", 60, 300, "1");
      const result1 = resolveCombat(withOneTurret, defaultGameConfig);
      const enemyRootAfter1 = result1.nodes.find((n) => n.id === "2")!.health;

      const withTwoTurrets = addNode(withOneTurret, "t2", "player-1", "turret", 40, 300, "1");
      const result2 = resolveCombat(withTwoTurrets, defaultGameConfig);
      const enemyRootAfter2 = result2.nodes.find((n) => n.id === "2")!.health;

      expect(enemyRootAfter2).toBeLessThan(enemyRootAfter1);
    });
  });

  describe("shield reduction", () => {
    it("shield node reduces damage to its child nodes", () => {
      let state = freshState();
      state = addNode(state, "s1", "player-2", "shield", 730, 300, "2");
      state = addNode(state, "g1", "player-2", "generator", 710, 300, "s1");

      const damage = getShieldReductionForNode("g1", "player-2", defaultGameConfig, state.nodes);
      expect(damage).toBe(20);
    });

    it("shield reduction is capped at maxShieldReductionPercent", () => {
      const config = {
        ...defaultGameConfig,
        maxShieldReductionPercent: 30,
      };

      let state = freshState();
      state = addNode(state, "s1", "player-2", "shield", 730, 300, "2");
      state = addNode(state, "g1", "player-2", "generator", 710, 300, "s1");
      state = addNode(state, "s2", "player-2", "shield", 690, 300, "g1");

      const damage = getShieldReductionForNode("g1", "player-2", config, state.nodes);
      expect(damage).toBe(30);
    });
  });

  describe("combat in tick", () => {
    it("combat runs during simulateTick", () => {
      const state = stateWithClosePlayers();
      const stateWithTurret = addNode(state, "t1", "player-1", "turret", 60, 300, "1");

      const actions = new Map<string, GameAction[]>();
      const result = simulateTick(stateWithTurret, actions, defaultGameConfig);

      const enemyRoot = result.nodes.find((n) => n.id === "2");
      expect(enemyRoot!.health).toBeLessThan(100);
    });

    it("combat is deterministic", () => {
      const state = stateWithClosePlayers();
      const stateWithTurret = addNode(state, "t1", "player-1", "turret", 60, 300, "1");

      const actions = new Map<string, GameAction[]>();

      resetNodeIdCounter();
      resetEdgeIdCounter();
      const result1 = simulateTick(stateWithTurret, actions, defaultGameConfig);

      resetNodeIdCounter();
      resetEdgeIdCounter();
      const result2 = simulateTick(stateWithTurret, actions, defaultGameConfig);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });
});
