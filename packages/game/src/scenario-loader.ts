import type { Edge, GameConfig, GameState, Node, ScenarioData } from "./types.js";
import { createInitialState } from "./initial-state.js";

import basicAssaultScenario from "./scenarios/basic-assault.json";
import shieldedFortressScenario from "./scenarios/shielded-fortress.json";

export const builtInScenarios: ScenarioData[] = [
  basicAssaultScenario as ScenarioData,
  shieldedFortressScenario as ScenarioData,
];

let nextId = 1000;

function resetScenarioIdCounter(): void {
  nextId = 1000;
}

function generateScenarioId(): string {
  return String(nextId++);
}

export function loadScenario(
  config: GameConfig,
  scenario: ScenarioData,
): GameState {
  resetScenarioIdCounter();

  const baseState = createInitialState(config);

  const firstPlayer = baseState.players[0];
  const firstPlayerNodes = baseState.nodes.filter(
    (n) => n.playerId === firstPlayer.id,
  );

  const enemyPlayerId = "enemy-scenario";

  const players = [
    firstPlayer,
    { id: enemyPlayerId, resources: 9999, spawnPoint: { x: 0, y: 0 }, constructions: [] },
  ];

  const enemyNodes: Node[] = scenario.enemyNodes.map((nodeData) => {
    const typeConfig = config.map.nodeTypeConfigs[nodeData.nodeType];
    const health = typeConfig?.health ?? 30;
    return {
      id: nodeData.id,
      playerId: enemyPlayerId,
      nodeType: nodeData.nodeType as GameState["nodes"][number]["nodeType"],
      position: { ...nodeData.position },
      health,
      maxHealth: health,
      parentId: nodeData.parentId,
      connected: true,
    };
  });

  let enemyEdges: Edge[];

  if (scenario.enemyEdges && scenario.enemyEdges.length > 0) {
    enemyEdges = scenario.enemyEdges.map((edgeData) => {
      const edgeHealth = config.map.edgeHealth;
      return {
        id: edgeData.id || generateScenarioId(),
        fromNodeId: edgeData.fromNodeId,
        toNodeId: edgeData.toNodeId,
        health: edgeHealth,
        maxHealth: edgeHealth,
      };
    });
  } else {
    enemyEdges = enemyNodes
      .filter((n) => n.parentId !== null)
      .map((n) => ({
        id: generateScenarioId(),
        fromNodeId: n.parentId!,
        toNodeId: n.id,
        health: config.map.edgeHealth,
        maxHealth: config.map.edgeHealth,
      }));
  }

  return {
    nodes: [...firstPlayerNodes, ...enemyNodes],
    edges: [...baseState.edges, ...enemyEdges],
    players,
    tick: 0,
    winner: null,
  };
}
