import type { GameConfig, GameState, Node } from "./types.js";

export function getConnectedNodes(
  state: GameState,
  playerId: string,
): Node[] {
  const playerNodes = state.nodes.filter((n) => n.playerId === playerId);
  const root = playerNodes.find((n) => n.nodeType === "root");
  if (root === undefined) return [];

  const childMap = new Map<string, string[]>();
  for (const node of playerNodes) {
    if (node.parentId !== null) {
      const children = childMap.get(node.parentId) ?? [];
      children.push(node.id);
      childMap.set(node.parentId, children);
    }
  }

  const nodeMap = new Map(playerNodes.map((n) => [n.id, n]));
  const connected: Node[] = [];
  const queue = [root.id];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentNode = nodeMap.get(currentId);
    if (currentNode !== undefined) {
      connected.push(currentNode);
    }

    const children = childMap.get(currentId);
    if (children) {
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return connected;
}

export function generateResources(
  state: GameState,
  config: GameConfig,
): GameState {
  const updatedPlayers = state.players.map((player) => {
    const connected = getConnectedNodes(state, player.id);
    let totalProduction = 0;

    for (const node of connected) {
      const typeConfig = config.map.nodeTypeConfigs[node.nodeType];
      if (typeConfig) {
        totalProduction += typeConfig.productionPerTick;
      }
    }

    return { ...player, resources: player.resources + totalProduction };
  });

  return { ...state, players: updatedPlayers };
}

export function consumeResources(
  state: GameState,
  config: GameConfig,
): GameState {
  const updatedPlayers = state.players.map((player) => {
    const connected = getConnectedNodes(state, player.id);
    let totalConsumption = 0;

    for (const node of connected) {
      const typeConfig = config.map.nodeTypeConfigs[node.nodeType];
      if (typeConfig) {
        totalConsumption += typeConfig.consumptionPerTick;
      }
    }

    const newResources = Math.max(0, player.resources - totalConsumption);
    return { ...player, resources: newResources };
  });

  return { ...state, players: updatedPlayers };
}
