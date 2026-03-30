import type { Edge, GameConfig, GameState, Node } from "./types.js";
import { euclideanDistance, pointToSegmentDistance } from "./spatial.js";
import { getConnectedNodes } from "./resource-economy.js";

export interface TargetResult {
  targetId: string;
  targetType: "node" | "edge";
  damage: number;
}

function findNearestEnemyNode(
  turret: Node,
  turretOwner: string,
  connectedEnemyNodes: Node[],
  attackRange: number,
): Node | null {
  let nearest: Node | null = null;
  let nearestDist = Infinity;

  for (const enemy of connectedEnemyNodes) {
    if (enemy.playerId === turretOwner) continue;
    const dist = euclideanDistance(turret.position, enemy.position);
    if (dist <= attackRange && dist < nearestDist) {
      nearest = enemy;
      nearestDist = dist;
    }
  }

  return nearest;
}

function findNearestEnemyEdge(
  turret: Node,
  turretOwner: string,
  state: GameState,
  attackRange: number,
): Edge | null {
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));
  let nearest: Edge | null = null;
  let nearestDist = Infinity;

  for (const edge of state.edges) {
    const fromNode = nodeMap.get(edge.fromNodeId);
    const toNode = nodeMap.get(edge.toNodeId);
    if (!fromNode || !toNode) continue;
    if (fromNode.playerId === turretOwner || toNode.playerId === turretOwner) continue;

    const dist = pointToSegmentDistance(
      turret.position,
      fromNode.position,
      toNode.position,
    );

    if (dist <= attackRange && dist < nearestDist) {
      nearest = edge;
      nearestDist = dist;
    }
  }

  return nearest;
}

export function getShieldReductionForNode(
  nodeId: string,
  playerId: string,
  config: GameConfig,
  nodes: Node[],
): number {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const node = nodeMap.get(nodeId);
  if (!node) return 0;

  let totalReduction = 0;

  if (node.parentId !== null) {
    const parent = nodeMap.get(node.parentId);
    if (parent && parent.playerId === playerId) {
      const parentConfig = config.map.nodeTypeConfigs[parent.nodeType];
      if (parentConfig?.shieldReductionPercent) {
        totalReduction += parentConfig.shieldReductionPercent;
      }
    }
  }

  for (const other of nodes) {
    if (other.playerId === playerId && other.parentId === nodeId) {
      const childConfig = config.map.nodeTypeConfigs[other.nodeType];
      if (childConfig?.shieldReductionPercent) {
        totalReduction += childConfig.shieldReductionPercent;
      }
    }
  }

  return Math.min(totalReduction, config.maxShieldReductionPercent);
}

export function resolveCombat(
  state: GameState,
  config: GameConfig,
): GameState {
  const nodes = state.nodes;

  const connectedByPlayer = new Map<string, Node[]>();
  for (const player of state.players) {
    connectedByPlayer.set(player.id, getConnectedNodes(state, player.id));
  }

  const turretTargets: Array<{
    turret: Node;
    target: TargetResult;
  }> = [];

  for (const player of state.players) {
    const playerTurrets = nodes.filter(
      (n) =>
        n.playerId === player.id &&
        n.nodeType === "turret" &&
        n.connected &&
        n.health > 0,
    );

    const turretConfig = config.map.nodeTypeConfigs.turret;
    if (!turretConfig?.attackRange || !turretConfig?.damagePerTick) continue;

    const connectedEnemies: Node[] = [];
    for (const enemyPlayer of state.players) {
      if (enemyPlayer.id === player.id) continue;
      const enemyConnected = connectedByPlayer.get(enemyPlayer.id) ?? [];
      connectedEnemies.push(...enemyConnected);
    }

    for (const turret of playerTurrets) {
      const targetNode = findNearestEnemyNode(
        turret,
        player.id,
        connectedEnemies,
        turretConfig.attackRange,
      );

      if (targetNode) {
        const reduction = getShieldReductionForNode(
          targetNode.id,
          targetNode.playerId,
          config,
          nodes,
        );
        const rawDamage = turretConfig.damagePerTick;
        const finalDamage = Math.round(
          rawDamage * (1 - reduction / 100),
        );

        turretTargets.push({
          turret,
          target: { targetId: targetNode.id, targetType: "node", damage: finalDamage },
        });
        continue;
      }

      const targetEdge = findNearestEnemyEdge(
        turret,
        player.id,
        state,
        turretConfig.attackRange,
      );

      if (targetEdge) {
        turretTargets.push({
          turret,
          target: { targetId: targetEdge.id, targetType: "edge", damage: turretConfig.damagePerTick },
        });
      }
    }
  }

  const updatedNodes = nodes.map((node) => {
    let totalDamage = 0;
    for (const { target } of turretTargets) {
      if (target.targetType === "node" && target.targetId === node.id) {
        totalDamage += target.damage;
      }
    }
    if (totalDamage === 0) return node;
    return { ...node, health: node.health - totalDamage };
  });

  const updatedEdges = state.edges.map((edge) => {
    let totalDamage = 0;
    for (const { target } of turretTargets) {
      if (target.targetType === "edge" && target.targetId === edge.id) {
        totalDamage += target.damage;
      }
    }
    if (totalDamage === 0) return edge;
    return { ...edge, health: edge.health - totalDamage };
  });

  return { ...state, nodes: updatedNodes, edges: updatedEdges };
}
