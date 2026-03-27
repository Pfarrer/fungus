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
} from "./types.js";

export { defaultGameConfig } from "./config.js";
export { createInitialState } from "./initial-state.js";
export { euclideanDistance, findClosestFriendlyNode } from "./spatial.js";
export { validatePlaceNode, placeNode } from "./node-placement.js";
export { getConnectedNodes, generateResources } from "./resource-economy.js";
export { processActions, simulateTick } from "./game-loop.js";
