import type { GameState, Node, Position } from "./types.js";

export function euclideanDistance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
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
