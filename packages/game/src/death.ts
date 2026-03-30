import type { GameConfig, GameState } from "./types.js";
import { getConnectedNodes } from "./resource-economy.js";

export function updateDisconnectedStatus(state: GameState): GameState {
  const updatedNodes = state.nodes.map((node) => {
    const connectedNodes = getConnectedNodes(
      { ...state, nodes: state.nodes.map((n) => ({ ...n, connected: true })) },
      node.playerId,
    );
    const connectedIds = new Set(connectedNodes.map((n) => n.id));
    return { ...node, connected: connectedIds.has(node.id) };
  });
  return { ...state, nodes: updatedNodes };
}

export function drainDisconnectedNodes(
  state: GameState,
  config: GameConfig,
): GameState {
  const updatedNodes = state.nodes.map((node) => {
    if (node.connected || node.health <= 0) return node;
    return { ...node, health: Math.max(0, node.health - config.deathRatePerTick) };
  });
  return { ...state, nodes: updatedNodes };
}

export function removeDeadNodes(state: GameState): GameState {
  const deadNodeIds = new Set(
    state.nodes.filter((n) => n.health <= 0).map((n) => n.id),
  );

  if (deadNodeIds.size === 0) return state;

  const survivingNodes = state.nodes.filter((n) => !deadNodeIds.has(n.id));
  const survivingEdges = state.edges.filter(
    (e) => !deadNodeIds.has(e.fromNodeId) && !deadNodeIds.has(e.toNodeId),
  );

  return { ...state, nodes: survivingNodes, edges: survivingEdges };
}

export function checkWinCondition(state: GameState): GameState {
  const roots = state.nodes.filter((n) => n.nodeType === "root");

  if (roots.length < state.players.length) {
    const survivingPlayerIds = new Set(roots.map((r) => r.playerId));
    const winner = state.players.find((p) => survivingPlayerIds.has(p.id));
    if (winner) {
      return { ...state, winner: winner.id };
    }
  }

  return state;
}

export function resolveDeath(
  state: GameState,
  config: GameConfig,
): GameState {
  let currentState = updateDisconnectedStatus(state);
  currentState = drainDisconnectedNodes(currentState, config);

  let prevDeadCount = 0;
  let currentDeadCount = currentState.nodes.filter((n) => n.health <= 0).length;

  while (currentDeadCount > prevDeadCount) {
    currentState = removeDeadNodes(currentState);
    currentState = updateDisconnectedStatus(currentState);
    currentState = drainDisconnectedNodes(currentState, config);
    prevDeadCount = currentDeadCount;
    currentDeadCount = currentState.nodes.filter((n) => n.health <= 0).length;
  }

  currentState = removeDeadNodes(currentState);
  currentState = checkWinCondition(currentState);

  return currentState;
}
