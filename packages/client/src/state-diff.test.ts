import { describe, it, expect } from "vitest";
import type { GameState } from "@fungus/game";
import { computeStateDiffs } from "./state-diff.js";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    nodes: [],
    edges: [],
    players: [],
    tick: 0,
    winner: null,
    ...overrides,
  };
}

describe("computeStateDiffs", () => {
  it("detects health decrease as damage flash", () => {
    const prev = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
      ],
    });
    const next = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 80, maxHealth: 100, parentId: null, connected: true },
      ],
    });

    const effects = computeStateDiffs(prev, next);
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe("DamageFlash");
    if (effects[0].type === "DamageFlash") {
      expect(effects[0].nodeId).toBe("n1");
    }
  });

  it("detects node removal as node death", () => {
    const prev = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "generator", position: { x: 100, y: 200 }, health: 30, maxHealth: 30, parentId: "n0", connected: true },
      ],
    });
    const next = makeState({ nodes: [] });

    const effects = computeStateDiffs(prev, next);
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe("NodeDeath");
    if (effects[0].type === "NodeDeath") {
      expect(effects[0].nodeId).toBe("n1");
      expect(effects[0].x).toBe(100);
      expect(effects[0].y).toBe(200);
    }
  });

  it("detects edge removal as edge break", () => {
    const prev = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
        { id: "n2", playerId: "p1", nodeType: "generator", position: { x: 100, y: 300 }, health: 30, maxHealth: 30, parentId: "n1", connected: true },
      ],
      edges: [
        { id: "e1", fromNodeId: "n1", toNodeId: "n2", health: 20, maxHealth: 20 },
      ],
    });
    const next = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
        { id: "n2", playerId: "p1", nodeType: "generator", position: { x: 100, y: 300 }, health: 30, maxHealth: 30, parentId: "n1", connected: true },
      ],
      edges: [],
    });

    const effects = computeStateDiffs(prev, next);
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe("EdgeBreak");
    if (effects[0].type === "EdgeBreak") {
      expect(effects[0].edgeId).toBe("e1");
      expect(effects[0].fromX).toBe(50);
      expect(effects[0].toX).toBe(100);
    }
  });

  it("returns no effects when nothing changed", () => {
    const state = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
      ],
    });

    const effects = computeStateDiffs(state, state);
    expect(effects).toHaveLength(0);
  });

  it("handles multiple simultaneous changes", () => {
    const prev = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 100, maxHealth: 100, parentId: null, connected: true },
        { id: "n2", playerId: "p1", nodeType: "generator", position: { x: 100, y: 300 }, health: 30, maxHealth: 30, parentId: "n1", connected: true },
        { id: "n3", playerId: "p2", nodeType: "turret", position: { x: 200, y: 300 }, health: 20, maxHealth: 20, parentId: "n0", connected: true },
      ],
      edges: [
        { id: "e1", fromNodeId: "n1", toNodeId: "n2", health: 20, maxHealth: 20 },
      ],
    });
    const next = makeState({
      nodes: [
        { id: "n1", playerId: "p1", nodeType: "root", position: { x: 50, y: 300 }, health: 80, maxHealth: 100, parentId: null, connected: true },
        { id: "n2", playerId: "p1", nodeType: "generator", position: { x: 100, y: 300 }, health: 30, maxHealth: 30, parentId: "n1", connected: true },
      ],
      edges: [],
    });

    const effects = computeStateDiffs(prev, next);
    expect(effects).toHaveLength(3);

    const types = effects.map((e) => e.type);
    expect(types).toContain("DamageFlash");
    expect(types).toContain("NodeDeath");
    expect(types).toContain("EdgeBreak");
  });
});
