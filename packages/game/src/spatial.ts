import type { GameState, Node, Position } from "./types.js";

export function euclideanDistance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointToSegmentDistance(
  point: Position,
  segStart: Position,
  segEnd: Position,
): number {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return euclideanDistance(point, segStart);
  }

  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = segStart.x + t * dx;
  const projY = segStart.y + t * dy;
  return euclideanDistance(point, { x: projX, y: projY });
}

export function findNearestNode(state: GameState, position: Position): Node | null {
  if (state.nodes.length === 0) return null;

  let closest: Node | null = null;
  let closestDist = Infinity;

  for (const node of state.nodes) {
    const dist = euclideanDistance(position, node.position);
    if (dist < closestDist) {
      closestDist = dist;
      closest = node;
    }
  }

  return closest;
}

export function findClosestFriendlyNode(
  state: GameState,
  playerId: string,
  position: Position,
): Node | null {
  const friendlyNodes = state.nodes.filter(
    (n) => n.playerId === playerId && n.connected,
  );

  if (friendlyNodes.length === 0) return null;

  let closest: Node | null = null;
  let closestDist = Infinity;

  for (const node of friendlyNodes) {
    const dist = euclideanDistance(position, node.position);
    if (dist < closestDist) {
      closestDist = dist;
      closest = node;
    }
  }

  return closest;
}

export function findClosestFriendlyNodeWithinRange(
  state: GameState,
  playerId: string,
  position: Position,
  maxDistance: number,
): Node | null {
  const closest = findClosestFriendlyNode(state, playerId, position);
  if (closest === null) return null;

  const dist = euclideanDistance(position, closest.position);
  if (dist <= maxDistance) return closest;

  return null;
}
