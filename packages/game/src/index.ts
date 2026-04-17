export type {
  Position,
  NodeType,
  Node,
  Edge,
  Player,
  GameState,
  GameAction,
  NodeTypeConfig,
  MapConfig,
  GameConfig,
  ScenarioNodeData,
  ScenarioEdgeData,
  ScenarioData,
} from "./types.js";

export { defaultGameConfig } from "./config.js";
export { createInitialState } from "./initial-state.js";
export { euclideanDistance, findNearestNode, findClosestFriendlyNode, pointToSegmentDistance } from "./spatial.js";
export { validatePlaceNode, placeNode } from "./node-placement.js";
export { getConnectedNodes, generateResources } from "./resource-economy.js";
export { processActions, simulateTick } from "./game-loop.js";
export { getShieldReductionForNode, resolveCombat } from "./combat.js";
export { updateDisconnectedStatus, drainDisconnectedNodes, removeDeadNodes, checkWinCondition, resolveDeath } from "./death.js";
export { loadScenario, builtInScenarios } from "./scenario-loader.js";
export { generateBotActions } from "./bot-opponent.js";
