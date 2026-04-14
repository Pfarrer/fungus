import { describe, it, expect, beforeEach } from "vitest";
import { generateBotActions } from "./bot-opponent.js";
import { createInitialState } from "./initial-state.js";
import { defaultGameConfig } from "./config.js";
import { simulateTick } from "./game-loop.js";
import type { GameAction } from "./types.js";

describe("generateBotActions", () => {
  let state: ReturnType<typeof createInitialState>;
  let config: typeof defaultGameConfig;

  beforeEach(() => {
    config = { ...defaultGameConfig };
    state = createInitialState(config);
  });

  it("returns empty array when opponent player not in state", () => {
    const actions = generateBotActions(state, config, "player-nonexistent");
    expect(actions).toHaveLength(0);
  });

  it("returns empty array when opponent has insufficient resources", () => {
    state.players[1].resources = 10;
    const actions = generateBotActions(state, config, "player-2");
    expect(actions).toHaveLength(0);
  });

  it("returns legal actions when opponent has resources", () => {
    state.players[1].resources = 100;
    const actions = generateBotActions(state, config, "player-2", 2);
    expect(actions.length).toBeGreaterThan(0);
  });

  it("only returns valid actions that pass validatePlaceNode", () => {
    state.players[1].resources = 100;
    const actions = generateBotActions(state, config, "player-2", 5);
    for (const action of actions) {
      const nodeConfig = config.map.nodeTypeConfigs[action.nodeType];
      expect(nodeConfig).toBeDefined();
      expect(state.players[1].resources).toBeGreaterThanOrEqual(nodeConfig!.cost);
    }
  });

  it("respects maxActions limit", () => {
    state.players[1].resources = 500;
    const actions = generateBotActions(state, config, "player-2", 1);
    expect(actions.length).toBeLessThanOrEqual(1);
  });

  it("does not return actions at same position", () => {
    state.players[1].resources = 500;
    const actions = generateBotActions(state, config, "player-2", 5);
    const positions = new Set<string>();
    for (const action of actions) {
      const posKey = `${action.position.x},${action.position.y}`;
      expect(positions.has(posKey)).toBe(false);
      positions.add(posKey);
    }
  });
});

describe("deterministic bot behavior", () => {
  let config: typeof defaultGameConfig;

  beforeEach(() => {
    config = { ...defaultGameConfig };
  });

  it("produces same actions for identical state", () => {
    const state1 = createInitialState(config);
    state1.players[1].resources = 100;

    const state2 = createInitialState(config);
    state2.players[1].resources = 100;

    const actions1 = generateBotActions(state1, config, "player-2", 1);
    const actions2 = generateBotActions(state2, config, "player-2", 1);

    expect(actions1).toHaveLength(actions2.length);
    if (actions1.length > 0 && actions2.length > 0) {
      expect(actions1[0].nodeType).toBe(actions2[0].nodeType);
      expect(actions1[0].position).toEqual(actions2[0].position);
    }
  });

  it("produces same actions after tick with no player actions", () => {
    const state1 = createInitialState(config);
    state1.players[1].resources = 50;
    const state2 = createInitialState(config);
    state2.players[1].resources = 50;

    const newState1 = simulateTick(state1, new Map([["player-1", []]]), config);
    const newState2 = simulateTick(state2, new Map([["player-1", []]]), config);

    const actions1 = generateBotActions(newState1, config, "player-2", 1);
    const actions2 = generateBotActions(newState2, config, "player-2", 1);

    expect(actions1).toHaveLength(actions2.length);
    if (actions1.length > 0 && actions2.length > 0) {
      expect(actions1[0].nodeType).toBe(actions2[0].nodeType);
    }
  });
});

describe("bot-opponent match setup", () => {
  let config: typeof defaultGameConfig;

  beforeEach(() => {
    config = { ...defaultGameConfig };
  });

  it("initializes match with two players", () => {
    const state = createInitialState(config);
    expect(state.players).toHaveLength(2);
    expect(state.players[0].id).toBe("player-1");
    expect(state.players[1].id).toBe("player-2");
  });

  it("each player has own spawn point", () => {
    const state = createInitialState(config);
    expect(state.players[0].spawnPoint).not.toEqual(state.players[1].spawnPoint);
  });

  it("creates root nodes for each player", () => {
    const state = createInitialState(config);
    const player1Nodes = state.nodes.filter((n) => n.playerId === "player-1");
    const player2Nodes = state.nodes.filter((n) => n.playerId === "player-2");
    expect(player1Nodes.length).toBeGreaterThan(0);
    expect(player2Nodes.length).toBeGreaterThan(0);
  });
});