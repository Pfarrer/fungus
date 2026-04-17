import type { GameState, GameConfig, Position } from "./types.js";
import { findClosestFriendlyNodeWithinRange, findNearestNode, euclideanDistance } from "./spatial.js";

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

  const player = state.players.find((p) => p.id === playerId);
  if (player === undefined) {
    return { valid: false, reason: `Unknown player: ${playerId}` };
  }

  if (player.resources < typeConfig.cost) {
    return {
      valid: false,
      reason: `Insufficient resources (need ${typeConfig.cost}, have ${player.resources})`,
    };
  }

  return { valid: true };
}

let nextNodeId = 100;

export function resetNodeIdCounter(): void {
  nextNodeId = 100;
}

function generateNodeId(): string {
  return String(nextNodeId++);
}

let nextEdgeId = 100;

export function resetEdgeIdCounter(): void {
  nextEdgeId = 100;
}

function generateEdgeId(): string {
  return String(nextEdgeId++);
}

export function placeNode(
  state: GameState,
  config: GameConfig,
  playerId: string,
  nodeType: string,
  position: Position,
): GameState {
  const validation = validatePlaceNode(state, config, playerId, nodeType, position);
  if (!validation.valid) {
    return state;
  }

  const closestNode = findClosestFriendlyNodeWithinRange(
    state,
    playerId,
    position,
    config.map.maxConnectionDistance,
  );

  if (closestNode === null) {
    return state;
  }

  const typeConfig = config.map.nodeTypeConfigs[nodeType];

  const newNodeId = generateNodeId();
  const newEdgeId = generateEdgeId();

  const newNode = {
    id: newNodeId,
    playerId,
    nodeType: nodeType as GameState["nodes"][number]["nodeType"],
    position: { ...position },
    health: typeConfig.health,
    maxHealth: typeConfig.health,
    parentId: closestNode.id,
    connected: true,
  };

  const newEdge = {
    id: newEdgeId,
    fromNodeId: closestNode.id,
    toNodeId: newNodeId,
    health: config.map.edgeHealth,
    maxHealth: config.map.edgeHealth,
  };

  return {
    ...state,
    nodes: [...state.nodes, newNode],
    edges: [...state.edges, newEdge],
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, resources: p.resources - typeConfig.cost }
        : p,
    ),
  };
}
