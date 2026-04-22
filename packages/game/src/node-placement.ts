import type { GameState, GameConfig, Position } from "./types.js";
import { findClosestFriendlyNodeWithinRange, findNearestNode, euclideanDistance } from "./spatial.js";
import { queueConstruction } from "./construction.js";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export function validatePlaceNode(
  state: GameState,
  config: GameConfig,
  playerId: string,
  nodeType: string,
  position: Position,
): ValidationResult {
  if (nodeType === "root") {
    return { valid: false, reason: "Cannot place additional root nodes" };
  }

  const { width, height, maxConnectionDistance } = config.map;

  if (position.x < 0 || position.x >= width || position.y < 0 || position.y >= height) {
    return { valid: false, reason: "Position is out of bounds" };
  }

  const occupied = state.nodes.some(
    (n) => n.position.x === position.x && n.position.y === position.y,
  );
  if (occupied) {
    return { valid: false, reason: "Position is already occupied" };
  }

  const nearestNode = findNearestNode(state, position);
  if (nearestNode !== null) {
    const dist = euclideanDistance(position, nearestNode.position);
    if (dist < config.map.minNodeDistance) {
      return { valid: false, reason: "Too close to existing node" };
    }
  }

  const closestNode = findClosestFriendlyNodeWithinRange(
    state,
    playerId,
    position,
    maxConnectionDistance,
  );
  if (closestNode === null) {
    return {
      valid: false,
      reason: "No friendly node within connection range",
    };
  }

  const typeConfig = config.map.nodeTypeConfigs[nodeType];
  if (typeConfig === undefined) {
    return { valid: false, reason: `Unknown node type: ${nodeType}` };
  }

  return { valid: true };
}

let nextNodeId = 100;

export function resetNodeIdCounter(): void {
  nextNodeId = 100;
}

export function generateNodeId(): string {
  return String(nextNodeId++);
}

let nextEdgeId = 100;

export function resetEdgeIdCounter(): void {
  nextEdgeId = 100;
}

export function generateEdgeId(): string {
  return String(nextEdgeId++);
}

export function placeNode(
  state: GameState,
  config: GameConfig,
  playerId: string,
  nodeType: string,
  position: Position,
): GameState {
  if (nodeType === "root") {
    return state;
  }

  const validation = validatePlaceNode(state, config, playerId, nodeType, position);
  if (!validation.valid) {
    return state;
  }

  return queueConstruction(state, config, playerId, nodeType, position);
}
