import type { Edge, GameConfig, GameState, Node } from "./types.js";

let nextId = 1;

function resetIdCounter(): void {
  nextId = 1;
}

function generateId(): string {
  return String(nextId++);
}

export function createInitialState(config: GameConfig): GameState {
  resetIdCounter();

  const players = config.map.spawnPoints.map((spawnPoint, index) => ({
    id: `player-${index + 1}`,
    resources: 0,
    spawnPoint,
  }));

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const player of players) {
    const rootNodeId = generateId();
    const rootTypeConfig = config.map.nodeTypeConfigs.root;

    nodes.push({
      id: rootNodeId,
      playerId: player.id,
      nodeType: "root",
      position: { ...player.spawnPoint },
      health: rootTypeConfig.health,
      maxHealth: rootTypeConfig.health,
      parentId: null,
      connected: true,
    });
  }

  return {
    nodes,
    edges,
    players,
    tick: 0,
    winner: null,
  };
}
