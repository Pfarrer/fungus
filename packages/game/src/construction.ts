import type { Construction, GameConfig, GameState, Position } from "./types.js";
import { findClosestFriendlyNodeWithinRange, findNearestNode, euclideanDistance } from "./spatial.js";

let nextConstructionId = 1000;

export function resetConstructionIdCounter(): void {
  nextConstructionId = 1000;
}

function generateConstructionId(): string {
  return `construction-${nextConstructionId++}`;
}

let nextNodeId = 200;
let nextEdgeId = 200;

function generateNodeId(): string {
  return String(nextNodeId++);
}

function generateEdgeId(): string {
  return String(nextEdgeId++);
}

export function resetActivationIdCounter(): void {
  nextNodeId = 200;
  nextEdgeId = 200;
}

export function queueConstruction(
  state: GameState,
  config: GameConfig,
  playerId: string,
  nodeType: string,
  position: Position,
): GameState {
  if (nodeType === "root") {
    return state;
  }

  const { width, height, maxConnectionDistance, minNodeDistance } = config.map;

  if (position.x < 0 || position.x >= width || position.y < 0 || position.y >= height) {
    return state;
  }

  const occupied = state.nodes.some(
    (n) => n.position.x === position.x && n.position.y === position.y,
  );
  if (occupied) return state;

  const nearestNode = findNearestNode(state, position);
  if (nearestNode !== null) {
    const dist = euclideanDistance(position, nearestNode.position);
    if (dist < minNodeDistance) return state;
  }

  const closestNode = findClosestFriendlyNodeWithinRange(
    state,
    playerId,
    position,
    maxConnectionDistance,
  );
  if (closestNode === null) return state;

  const typeConfig = config.map.nodeTypeConfigs[nodeType];
  if (typeConfig === undefined) return state;

  const player = state.players.find((p) => p.id === playerId);
  if (player === undefined) return state;

  const construction: Construction = {
    id: generateConstructionId(),
    playerId,
    nodeType: nodeType as Construction["nodeType"],
    position: { ...position },
    parentId: closestNode.id,
    totalCost: typeConfig.cost,
    funded: 0,
  };

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId
        ? { ...p, constructions: [...p.constructions, construction] }
        : p,
    ),
  };
}

export function fundConstructions(state: GameState): GameState {
  const updatedPlayers = state.players.map((player) => {
    if (player.constructions.length === 0) {
      return { ...player, resources: 0 };
    }

    const surplus = player.resources;
    const count = player.constructions.length;
    const perConstruction = Math.floor(surplus / count);
    const remainder = surplus % count;

    const updatedConstructions = player.constructions.map((c, i) => ({
      ...c,
      funded: c.funded + perConstruction + (i < remainder ? 1 : 0),
    }));

    return {
      ...player,
      resources: 0,
      constructions: updatedConstructions,
    };
  });

  return { ...state, players: updatedPlayers };
}

export function activateCompletedConstructions(
  state: GameState,
  config: GameConfig,
): GameState {
  let currentState = { ...state };
  const updatedPlayers = state.players.map((player) => {
    const completed = player.constructions.filter((c) => c.funded >= c.totalCost);
    const remaining = player.constructions.filter((c) => c.funded < c.totalCost);

    for (const construction of completed) {
      const typeConfig = config.map.nodeTypeConfigs[construction.nodeType];
      if (typeConfig === undefined) continue;

      const parentNode = currentState.nodes.find((n) => n.id === construction.parentId);
      if (parentNode === undefined) continue;

      const newNodeId = generateNodeId();
      const newEdgeId = generateEdgeId();

      const newNode = {
        id: newNodeId,
        playerId: construction.playerId,
        nodeType: construction.nodeType,
        position: { ...construction.position },
        health: typeConfig.health,
        maxHealth: typeConfig.health,
        parentId: construction.parentId,
        connected: true,
      };

      const newEdge = {
        id: newEdgeId,
        fromNodeId: construction.parentId,
        toNodeId: newNodeId,
        health: config.map.edgeHealth,
        maxHealth: config.map.edgeHealth,
      };

      currentState = {
        ...currentState,
        nodes: [...currentState.nodes, newNode],
        edges: [...currentState.edges, newEdge],
      };
    }

    return { ...player, constructions: remaining };
  });

  return { ...currentState, players: updatedPlayers };
}
