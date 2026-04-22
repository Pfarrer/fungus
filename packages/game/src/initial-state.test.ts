import { describe, it, expect } from "vitest";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";

describe("createInitialState", () => {
  it("creates correct number of players", () => {
    const state = createInitialState(defaultGameConfig);
    expect(state.players).toHaveLength(2);
  });

  it("assigns correct spawn points", () => {
    const state = createInitialState(defaultGameConfig);
    expect(state.players[0].spawnPoint).toEqual({ x: 50, y: 300 });
    expect(state.players[1].spawnPoint).toEqual({ x: 750, y: 300 });
  });

  it("places root nodes at spawn points", () => {
    const state = createInitialState(defaultGameConfig);
    const rootNodes = state.nodes.filter((n) => n.nodeType === "root");
    expect(rootNodes).toHaveLength(2);
    expect(rootNodes[0].position).toEqual({ x: 50, y: 300 });
    expect(rootNodes[1].position).toEqual({ x: 750, y: 300 });
  });

  it("root nodes have correct health", () => {
    const state = createInitialState(defaultGameConfig);
    const rootNodes = state.nodes.filter((n) => n.nodeType === "root");
    for (const node of rootNodes) {
      expect(node.health).toBe(100);
      expect(node.maxHealth).toBe(100);
    }
  });

  it("root nodes have no parent", () => {
    const state = createInitialState(defaultGameConfig);
    const rootNodes = state.nodes.filter((n) => n.nodeType === "root");
    for (const node of rootNodes) {
      expect(node.parentId).toBeNull();
    }
  });

  it("players start with zero resources", () => {
    const state = createInitialState(defaultGameConfig);
    for (const player of state.players) {
      expect(player.resources).toBe(0);
    }
  });

  it("players start with empty construction queues", () => {
    const state = createInitialState(defaultGameConfig);
    for (const player of state.players) {
      expect(player.constructions).toHaveLength(0);
    }
  });

  it("starts at tick 0 with no winner", () => {
    const state = createInitialState(defaultGameConfig);
    expect(state.tick).toBe(0);
    expect(state.winner).toBeNull();
  });

  it("has no edges initially", () => {
    const state = createInitialState(defaultGameConfig);
    expect(state.edges).toHaveLength(0);
  });
});
