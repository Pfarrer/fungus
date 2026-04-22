import type { GameAction, GameConfig, GameState } from "./types.js";
import { placeNode } from "./node-placement.js";
import { generateResources, consumeResources } from "./resource-economy.js";
import { fundConstructions, activateCompletedConstructions } from "./construction.js";
import { resolveCombat } from "./combat.js";
import { resolveDeath } from "./death.js";

export function processActions(
  state: GameState,
  actions: GameAction[],
  playerId: string,
  config: GameConfig,
): GameState {
  let currentState = state;

  for (const action of actions) {
    if (action.type === "PlaceNode") {
      currentState = placeNode(
        currentState,
        config,
        playerId,
        action.nodeType,
        action.position,
      );
    }
  }

  return currentState;
}

export function simulateTick(
  state: GameState,
  playerActions: Map<string, GameAction[]>,
  config: GameConfig,
): GameState {
  let currentState = { ...state };

  for (const [playerId, actions] of playerActions) {
    currentState = processActions(currentState, actions, playerId, config);
  }

  currentState = generateResources(currentState, config);
  currentState = consumeResources(currentState, config);
  currentState = fundConstructions(currentState);
  currentState = activateCompletedConstructions(currentState, config);
  currentState = resolveCombat(currentState, config);
  currentState = resolveDeath(currentState, config);
  currentState = { ...currentState, tick: currentState.tick + 1 };

  return currentState;
}
