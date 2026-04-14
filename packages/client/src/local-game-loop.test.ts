import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LocalGameLoop, type BotMatchConfig } from "./local-game-loop.js";
import { createInitialState, defaultGameConfig, simulateTick } from "@fungus/game";
import type { GameAction, GameConfig, GameState } from "@fungus/game";

describe("LocalGameLoop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("start calls onTick with initial state", () => {
    const initialState = createInitialState(defaultGameConfig);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, defaultGameConfig, initialState);

    loop.start();

    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenCalledWith(initialState);
  });

  it("executes ticks at configured interval", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 200 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, config, initialState);

    loop.start();
    expect(onTick).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(onTick).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(200);
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it("uses simulateTick under the hood to advance state", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, config, initialState);

    loop.start();

    vi.advanceTimersByTime(100);

    const expectedActions = new Map<string, GameAction[]>();
    for (const player of initialState.players) {
      expectedActions.set(player.id, []);
    }
    const expectedState = simulateTick(initialState, expectedActions, config);

    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick.mock.calls[1][0]).toEqual(expectedState);
  });

  it("queues actions that are processed on next tick", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, config, initialState);

    loop.start();

    const action: GameAction = {
      type: "PlaceNode",
      nodeType: "generator",
      position: { x: 60, y: 310 },
    };
    loop.queueAction(action);

    vi.advanceTimersByTime(100);

    expect(onTick).toHaveBeenCalledTimes(2);
    const tickState: GameState = onTick.mock.calls[1][0];
    expect(tickState.tick).toBeGreaterThan(initialState.tick);
  });

  it("actions are drained after tick and not re-processed", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, config, initialState);

    loop.start();

    const action: GameAction = {
      type: "PlaceNode",
      nodeType: "generator",
      position: { x: 60, y: 310 },
    };
    loop.queueAction(action);

    vi.advanceTimersByTime(100);
    const stateAfterFirstTick: GameState = onTick.mock.calls[1][0];

    vi.advanceTimersByTime(100);
    const stateAfterSecondTick: GameState = onTick.mock.calls[2][0];

    expect(stateAfterSecondTick.nodes.length).toBe(
      stateAfterFirstTick.nodes.length,
    );
  });

  it("stop prevents further ticks", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, config, initialState);

    loop.start();
    expect(onTick).toHaveBeenCalledTimes(1);

    loop.stop();

    vi.advanceTimersByTime(500);
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("getState returns the latest game state", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, config, initialState);

    loop.start();

    expect(loop.getState()).toBe(initialState);

    vi.advanceTimersByTime(100);

    const latestState = loop.getState();
    expect(latestState.tick).toBe(initialState.tick + 1);
  });

  it("uses createInitialState when no initial state provided", () => {
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick, defaultGameConfig);

    loop.start();

    const state = onTick.mock.calls[0][0] as GameState;
    expect(state.players.length).toBe(2);
    expect(state.tick).toBe(0);
    expect(state.nodes.length).toBe(2);
  });

  it("uses defaultGameConfig when no config provided", () => {
    const onTick = vi.fn();
    const loop = new LocalGameLoop(onTick);

    loop.start();

    expect(onTick).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(defaultGameConfig.tickDurationMs);
    expect(onTick).toHaveBeenCalledTimes(2);
  });
});

describe("LocalGameLoop with bot match", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with bot match config", () => {
    const initialState = createInitialState(defaultGameConfig);
    const onTick = vi.fn();
    const botConfig: BotMatchConfig = {
      playerId: "player-1",
      opponentId: "player-2",
    };
    const loop = new LocalGameLoop(onTick, defaultGameConfig, initialState, botConfig);

    loop.start();

    expect(onTick).toHaveBeenCalledTimes(1);
    const state = onTick.mock.calls[0][0] as GameState;
    expect(state.players).toHaveLength(2);
  });

  it("generates bot actions each tick", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const botConfig: BotMatchConfig = {
      playerId: "player-1",
      opponentId: "player-2",
    };
    const loop = new LocalGameLoop(onTick, config, initialState, botConfig);

    loop.start();
    expect(onTick).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(onTick).toHaveBeenCalledTimes(2);

    const stateAfterTick = onTick.mock.calls[1][0] as GameState;
    expect(stateAfterTick.tick).toBe(1);
  });

  it("bot opponent has resources after tick", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    initialState.players[1].resources = 50;

    const onTick = vi.fn();
    const botConfig: BotMatchConfig = {
      playerId: "player-1",
      opponentId: "player-2",
    };
    const loop = new LocalGameLoop(onTick, config, initialState, botConfig);

    loop.start();
    vi.advanceTimersByTime(100);

    const state = onTick.mock.calls[1][0] as GameState;
    const botPlayer = state.players.find((p) => p.id === "player-2");
    expect(botPlayer).toBeDefined();
  });

  it("state advances with bot actions processed", () => {
    const config: GameConfig = { ...defaultGameConfig, tickDurationMs: 100 };
    const initialState = createInitialState(config);
    const onTick = vi.fn();
    const botConfig: BotMatchConfig = {
      playerId: "player-1",
      opponentId: "player-2",
    };
    const loop = new LocalGameLoop(onTick, config, initialState, botConfig);

    loop.start();
    vi.advanceTimersByTime(300);

    const state = onTick.mock.calls[3][0] as GameState;
    expect(state.tick).toBe(3);
  });
});
