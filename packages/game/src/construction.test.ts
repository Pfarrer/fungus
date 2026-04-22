import { describe, it, expect, beforeEach } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { resetNodeIdCounter, resetEdgeIdCounter, generateNodeId, generateEdgeId } from "./node-placement.js";
import { resetConstructionIdCounter, resetActivationIdCounter, queueConstruction, fundConstructions, activateCompletedConstructions } from "./construction.js";
import { simulateTick } from "./game-loop.js";
import type { GameAction, GameState } from "./types.js";

describe("construction queue", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
    resetConstructionIdCounter();
    resetActivationIdCounter();
  });

  function freshState(): GameState {
    return createInitialState(defaultGameConfig);
  }

  function addNodeDirect(
    state: GameState,
    playerId: string,
    nodeType: string,
    x: number,
    y: number,
    parentId: string,
  ): GameState {
    const typeConfig = defaultGameConfig.map.nodeTypeConfigs[nodeType];
    const id = generateNodeId();
    return {
      ...state,
      nodes: [
        ...state.nodes,
        {
          id,
          playerId,
          nodeType: nodeType as GameState["nodes"][number]["nodeType"],
          position: { x, y },
          health: typeConfig.health,
          maxHealth: typeConfig.health,
          parentId,
          connected: true,
        },
      ],
      edges: [
        ...state.edges,
        {
          id: generateEdgeId(),
          fromNodeId: parentId,
          toNodeId: id,
          health: defaultGameConfig.map.edgeHealth,
          maxHealth: defaultGameConfig.map.edgeHealth,
        },
      ],
    };
  }

  describe("queueConstruction", () => {
    it("creates construction entry for valid placement (6.1)", () => {
      const state = freshState();
      const result = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });

      expect(result.players[0].constructions).toHaveLength(1);
      const c = result.players[0].constructions[0];
      expect(c.nodeType).toBe("generator");
      expect(c.totalCost).toBe(15);
      expect(c.funded).toBe(0);
      expect(c.position).toEqual({ x: 75, y: 300 });
      expect(c.playerId).toBe("player-1");
    });

    it("does not add node to map immediately (6.1)", () => {
      const state = freshState();
      const result = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(0);
    });
  });

  describe("fundConstructions", () => {
    it("funds single construction from surplus (6.2)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, resources: 5 } : p) };

      const result = fundConstructions(state);
      expect(result.players[0].constructions[0].funded).toBe(5);
      expect(result.players[0].resources).toBe(0);
    });

    it("even split across multiple constructions (6.3)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 125, y: 300 });
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 100, y: 250 });
      state = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, resources: 6 } : p) };

      const result = fundConstructions(state);
      expect(result.players[0].constructions[0].funded).toBe(2);
      expect(result.players[0].constructions[1].funded).toBe(2);
      expect(result.players[0].constructions[2].funded).toBe(2);
    });

    it("uneven split with remainder (6.3)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 125, y: 300 });
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 100, y: 250 });
      state = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, resources: 7 } : p) };

      const result = fundConstructions(state);
      expect(result.players[0].constructions[0].funded).toBe(3);
      expect(result.players[0].constructions[1].funded).toBe(2);
      expect(result.players[0].constructions[2].funded).toBe(2);
    });

    it("surplus discarded when no constructions (6.4)", () => {
      const state = freshState();
      const modified = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, resources: 8 } : p) };

      const result = fundConstructions(modified);
      expect(result.players[0].resources).toBe(0);
    });

    it("zero surplus with constructions (6.4)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, resources: 0 } : p) };

      const result = fundConstructions(state);
      expect(result.players[0].constructions[0].funded).toBe(0);
    });
  });

  describe("activateCompletedConstructions", () => {
    it("completes construction and adds node to game state (6.5)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = {
        ...state,
        players: state.players.map((p, i) =>
          i === 0
            ? { ...p, constructions: p.constructions.map(c => ({ ...c, funded: 15 })) }
            : p
        ),
      };

      const result = activateCompletedConstructions(state, defaultGameConfig);
      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(1);
      expect(result.players[0].constructions).toHaveLength(0);

      const newNode = result.nodes.find((n) => n.nodeType === "generator");
      expect(newNode).toBeDefined();
      expect(newNode!.health).toBe(30);
      expect(newNode!.maxHealth).toBe(30);
    });

    it("construction completion with overflow - excess lost (6.6)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = {
        ...state,
        players: state.players.map((p, i) =>
          i === 0
            ? { ...p, constructions: p.constructions.map(c => ({ ...c, funded: 20 })) }
            : p
        ),
      };

      const result = activateCompletedConstructions(state, defaultGameConfig);
      expect(result.nodes).toHaveLength(3);
      expect(result.players[0].constructions).toHaveLength(0);
      expect(result.players[0].resources).toBe(0);
    });

    it("multiple constructions complete same tick (6.7)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = queueConstruction(state, defaultGameConfig, "player-1", "turret", { x: 125, y: 300 });
      state = {
        ...state,
        players: state.players.map((p, i) =>
          i === 0
            ? { ...p, constructions: p.constructions.map((c, ci) => ({ ...c, funded: ci === 0 ? 15 : 25 })) }
            : p
        ),
      };

      const result = activateCompletedConstructions(state, defaultGameConfig);
      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(2);
      expect(result.players[0].constructions).toHaveLength(0);
    });

    it("incomplete construction does not appear as node (6.8)", () => {
      let state = freshState();
      state = queueConstruction(state, defaultGameConfig, "player-1", "generator", { x: 75, y: 300 });
      state = {
        ...state,
        players: state.players.map((p, i) =>
          i === 0
            ? { ...p, constructions: p.constructions.map(c => ({ ...c, funded: 10 })) }
            : p
        ),
      };

      const result = activateCompletedConstructions(state, defaultGameConfig);
      expect(result.nodes).toHaveLength(2);
      expect(result.players[0].constructions).toHaveLength(1);
    });
  });

  describe("integration with simulateTick", () => {
    it("completed building participates in combat same tick (6.9)", () => {
      let state = freshState();
      state = {
        ...state,
        nodes: state.nodes.map((n) => {
          if (n.id === "1") return { ...n, position: { x: 50, y: 300 } };
          if (n.id === "2") return { ...n, position: { x: 150, y: 300 } };
          return n;
        }),
      };

      const rootId = state.nodes.find((n) => n.playerId === "player-1")!.id;
      const p2RootId = state.nodes.find((n) => n.playerId === "player-2")!.id;

      state = addNodeDirect(state, "player-1", "turret", 60, 300, rootId);
      state = addNodeDirect(state, "player-2", "generator", 140, 300, p2RootId);

      const result = simulateTick(state, new Map(), defaultGameConfig);

      const enemyGen = result.nodes.find((n) => n.playerId === "player-2" && n.nodeType === "generator");
      expect(enemyGen!.health).toBeLessThan(30);
    });

    it("placement validation without resource check (6.10)", () => {
      const state = freshState();
      const result = queueConstruction(
        { ...state, players: state.players.map((p, i) => i === 0 ? { ...p, resources: 0 } : p) },
        defaultGameConfig,
        "player-1",
        "generator",
        { x: 75, y: 300 },
      );
      expect(result.players[0].constructions).toHaveLength(1);
    });

    it("deterministic tick order with constructions (6.11)", () => {
      const state = freshState();

      const actions = new Map<string, GameAction[]>([
        ["player-1", [
          { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
        ]],
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

    it("root node bypasses construction queue (6.12)", () => {
      const state = freshState();
      const result = queueConstruction(state, defaultGameConfig, "player-1", "root", { x: 60, y: 300 });
      expect(result.players[0].constructions).toHaveLength(0);
    });

    it("construction funds over multiple ticks then completes", () => {
      let state = freshState();
      const actions = new Map<string, GameAction[]>([
        ["player-1", [
          { type: "PlaceNode", nodeType: "generator", position: { x: 75, y: 300 } },
        ]],
      ]);

      state = simulateTick(state, actions, defaultGameConfig);
      expect(state.players[0].constructions[0].funded).toBe(1);

      const emptyActions = new Map<string, GameAction[]>();
      for (let i = 0; i < 14; i++) {
        state = simulateTick(state, emptyActions, defaultGameConfig);
      }

      expect(state.players[0].constructions).toHaveLength(0);
      const gen = state.nodes.find((n) => n.nodeType === "generator" && n.playerId === "player-1");
      expect(gen).toBeDefined();
    });
  });
});
