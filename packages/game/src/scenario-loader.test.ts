import { describe, it, expect, beforeEach } from "vitest";
import { defaultGameConfig } from "./config.js";
import { loadScenario, builtInScenarios } from "./scenario-loader.js";
import { resetNodeIdCounter, resetEdgeIdCounter } from "./node-placement.js";
import { simulateTick } from "./game-loop.js";
import type { GameAction, ScenarioData } from "./types.js";

describe("scenario loading", () => {
  beforeEach(() => {
    resetNodeIdCounter();
    resetEdgeIdCounter();
  });

  it("builtInScenarios has at least one scenario", () => {
    expect(builtInScenarios.length).toBeGreaterThan(0);
  });

  it("each built-in scenario has required fields", () => {
    for (const scenario of builtInScenarios) {
      expect(scenario.name).toBeTruthy();
      expect(scenario.description).toBeTruthy();
      expect(scenario.enemyNodes.length).toBeGreaterThan(0);
      expect(scenario.enemyNodes[0]).toHaveProperty("id");
      expect(scenario.enemyNodes[0]).toHaveProperty("nodeType");
      expect(scenario.enemyNodes[0]).toHaveProperty("position");
    }
  });

  it("loadScenario creates state with player and enemy nodes", () => {
    const scenario = builtInScenarios[0];
    const state = loadScenario(defaultGameConfig, scenario);

    expect(state.nodes.length).toBeGreaterThan(2);
    expect(state.players.length).toBe(2);
    expect(state.winner).toBeNull();
    expect(state.tick).toBe(0);
  });

  it("loadScenario auto-generates edges from parent-child relationships", () => {
    const scenario: ScenarioData = {
      name: "Test",
      description: "Test scenario",
      enemyNodes: [
        { id: "e1", nodeType: "root", position: { x: 500, y: 300 }, parentId: null },
        { id: "e2", nodeType: "generator", position: { x: 470, y: 300 }, parentId: "e1" },
      ],
    };

    const state = loadScenario(defaultGameConfig, scenario);

    expect(state.edges.length).toBeGreaterThan(0);
    const hasAutoEdge = state.edges.some(
      (e) => e.fromNodeId === "e1" && e.toNodeId === "e2",
    );
    expect(hasAutoEdge).toBe(true);
  });

  it("loadScenario uses explicit edges when provided", () => {
    const scenario: ScenarioData = {
      name: "Test",
      description: "Test scenario",
      enemyNodes: [
        { id: "e1", nodeType: "root", position: { x: 500, y: 300 }, parentId: null },
        { id: "e2", nodeType: "generator", position: { x: 470, y: 300 }, parentId: "e1" },
      ],
      enemyEdges: [
        { id: "custom-edge", fromNodeId: "e1", toNodeId: "e2" },
      ],
    };

    const state = loadScenario(defaultGameConfig, scenario);

    const customEdge = state.edges.find((e) => e.id === "custom-edge");
    expect(customEdge).toBeDefined();
    expect(customEdge!.fromNodeId).toBe("e1");
    expect(customEdge!.toNodeId).toBe("e2");
  });

  it("enemy nodes have correct health from config", () => {
    const scenario: ScenarioData = {
      name: "Test",
      description: "Test scenario",
      enemyNodes: [
        { id: "e1", nodeType: "root", position: { x: 500, y: 300 }, parentId: null },
        { id: "e2", nodeType: "turret", position: { x: 470, y: 300 }, parentId: "e1" },
      ],
    };

    const state = loadScenario(defaultGameConfig, scenario);

    const root = state.nodes.find((n) => n.id === "e1");
    const turret = state.nodes.find((n) => n.id === "e2");

    expect(root!.health).toBe(defaultGameConfig.map.nodeTypeConfigs.root.health);
    expect(turret!.health).toBe(defaultGameConfig.map.nodeTypeConfigs.turret!.health);
  });

  describe("shielded fortress scenario", () => {
    it("should not declare victory after many ticks of combat", () => {
      const fortressScenario = builtInScenarios.find(
        (s) => s.name === "Shielded Fortress",
      )!;
      let state = loadScenario(defaultGameConfig, fortressScenario);

      expect(state.players.length).toBe(2);
      expect(state.nodes.filter((n) => n.playerId === "player-2")).toHaveLength(0);

      const actions = new Map<string, GameAction[]>();

      for (let i = 0; i < 21; i++) {
        state = simulateTick(state, actions, defaultGameConfig);
      }

      expect(state.winner).toBeNull();
    });
  });
});
