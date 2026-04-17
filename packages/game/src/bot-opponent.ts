import type { GameAction, GameConfig, GameState, Node, Position } from "./types.js";
import { validatePlaceNode } from "./node-placement.js";

const NODE_TYPES: string[] = ["generator", "turret", "shield"];

function dist(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function getEnemySpawn(state: GameState, botPlayerId: string): Position {
  const enemy = state.players.find((p) => p.id !== botPlayerId);
  return enemy?.spawnPoint ?? { x: 0, y: 0 };
}

function getConnectedFriendlyNodes(state: GameState, playerId: string): Node[] {
  return state.nodes.filter((n) => n.playerId === playerId && n.connected);
}

function generateExpansionTargets(
  state: GameState,
  config: GameConfig,
  playerId: string,
): Position[] {
  const friendlyNodes = getConnectedFriendlyNodes(state, playerId);
  if (friendlyNodes.length === 0) return [];

  const enemySpawn = getEnemySpawn(state, playerId);
  const positions: Position[] = [];
  const maxDist = config.map.maxConnectionDistance;
  const occupied = new Set(state.nodes.map((n) => `${n.position.x},${n.position.y}`));

  const sortedNodes = [...friendlyNodes].sort((a, b) =>
    dist(a.position, enemySpawn) - dist(b.position, enemySpawn),
  );

  const frontierNodes = sortedNodes.slice(0, Math.max(5, Math.ceil(sortedNodes.length * 0.4)));

  for (const anchor of frontierNodes) {
    const angleToEnemy = Math.atan2(
      enemySpawn.y - anchor.position.y,
      enemySpawn.x - anchor.position.x,
    );

    for (let offset = -2; offset <= 2; offset++) {
      const angle = angleToEnemy + (offset * Math.PI) / 12;
      for (let r = maxDist * 0.5; r <= maxDist * 0.95; r += maxDist * 0.25) {
        const x = Math.round(anchor.position.x + Math.cos(angle) * r);
        const y = Math.round(anchor.position.y + Math.sin(angle) * r);

        if (x < 5 || x >= config.map.width - 5 || y < 5 || y >= config.map.height - 5) continue;
        const key = `${x},${y}`;
        if (occupied.has(key)) continue;

        occupied.add(key);
        positions.push({ x, y });
      }
    }
  }

  positions.sort((a, b) => {
    const distA = dist(a, enemySpawn);
    const distB = dist(b, enemySpawn);
    if (distA !== distB) return distA - distB;
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  return positions;
}

function scoreAction(
  state: GameState,
  config: GameConfig,
  playerId: string,
  nodeType: string,
  position: Position,
): number {
  const nodeConfig = config.map.nodeTypeConfigs[nodeType];
  if (!nodeConfig) return -Infinity;

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return -Infinity;

  if (player.resources < nodeConfig.cost) return -Infinity;

  const validation = validatePlaceNode(state, config, playerId, nodeType, position);
  if (!validation.valid) return -Infinity;

  const enemySpawn = getEnemySpawn(state, playerId);
  const distToEnemy = dist(position, enemySpawn);
  const friendlyNodes = getConnectedFriendlyNodes(state, playerId);
  const enemyNodes = state.nodes.filter((n) => n.playerId !== playerId && n.connected);

  const generatorCount = friendlyNodes.filter((n) => n.nodeType === "generator").length;
  const turretCount = friendlyNodes.filter((n) => n.nodeType === "turret").length;
  const totalNodes = friendlyNodes.length;

  const resourcesAfterBuy = player.resources - nodeConfig.cost;

  let score = 0;

  const nearbyEnemyNodes = enemyNodes.filter(
    (en) => dist(position, en.position) < (config.map.nodeTypeConfigs.turret?.attackRange ?? 120),
  );

  switch (nodeType) {
    case "generator": {
      const incomeValue = nodeConfig.productionPerTick * 10;
      score = incomeValue;

      if (generatorCount < 3) {
        score *= 2.5;
      } else if (generatorCount < 6) {
        score *= 1.5;
      }

      if (distToEnemy < 200) {
        score *= 0.6;
      }

      score += distToEnemy * -0.05;

      if (totalNodes < 5) {
        score *= 1.8;
      }
      break;
    }

    case "turret": {
      score = 10;

      if (nearbyEnemyNodes.length > 0) {
        score += 40 + nearbyEnemyNodes.length * 15;
      }

      const attackRange = nodeConfig.attackRange ?? 120;
      const closestEnemyDist = enemyNodes.length > 0
        ? Math.min(...enemyNodes.map((en) => dist(position, en.position)))
        : Infinity;

      if (closestEnemyDist <= attackRange * 1.2) {
        score += 30;
      }

      if (turretCount < 2 && nearbyEnemyNodes.length > 0) {
        score *= 2;
      }

      if (generatorCount < 2) {
        score *= 0.3;
      }

      score += distToEnemy * -0.15;
      break;
    }

    case "shield": {
      score = 5;

      const hasTurretNearby = friendlyNodes.some(
        (n) => n.nodeType === "turret" && dist(position, n.position) < 60,
      );
      if (hasTurretNearby) {
        score += 20;
      }

      if (nearbyEnemyNodes.length > 0) {
        score += 15;
      }

      if (generatorCount < 2) {
        score *= 0.2;
      }

      score += distToEnemy * -0.1;
      break;
    }
  }

  if (resourcesAfterBuy < 15 && player.resources >= 30) {
    score *= 0.7;
  }

  return score;
}

export function generateBotActions(
  state: GameState,
  config: GameConfig,
  playerId: string,
  maxActions: number = 3,
): GameAction[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  if (player.resources < 15) return [];

  const friendlyNodes = getConnectedFriendlyNodes(state, playerId);
  if (friendlyNodes.length === 0) return [];

  const positions = generateExpansionTargets(state, config, playerId);
  if (positions.length === 0) return [];

  type Scored = { action: GameAction; score: number };
  const candidates: Scored[] = [];

  for (const nodeType of NODE_TYPES) {
    const nodeConfig = config.map.nodeTypeConfigs[nodeType];
    if (!nodeConfig || player.resources < nodeConfig.cost) continue;

    for (const position of positions) {
      const s = scoreAction(state, config, playerId, nodeType, position);
      if (s > 0) {
        candidates.push({
          action: { type: "PlaceNode", nodeType, position },
          score: s,
        });
      }
    }
  }

  candidates.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.001) return b.score - a.score;
    if (a.action.nodeType !== b.action.nodeType) {
      return a.action.nodeType.localeCompare(b.action.nodeType);
    }
    if (a.action.position.x !== b.action.position.x) {
      return a.action.position.x - b.action.position.x;
    }
    return a.action.position.y - b.action.position.y;
  });

  const selected: GameAction[] = [];
  const usedPositions = new Set<string>();
  let spentResources = 0;

  for (const candidate of candidates) {
    if (selected.length >= maxActions) break;

    const posKey = `${candidate.action.position.x},${candidate.action.position.y}`;
    if (usedPositions.has(posKey)) continue;

    const nodeConfig = config.map.nodeTypeConfigs[candidate.action.nodeType];
    if (player.resources - spentResources < nodeConfig.cost) continue;

    const validation = validatePlaceNode(
      state,
      config,
      playerId,
      candidate.action.nodeType,
      candidate.action.position,
    );
    if (!validation.valid) continue;

    selected.push(candidate.action);
    usedPositions.add(posKey);
    spentResources += nodeConfig.cost;
  }

  return selected;
}