import type { GameState } from "@fungus/game";
import type { VisualEffect } from "./effects.js";
import {
  createDamageFlash,
  createNodeDeath,
  createEdgeBreak,
} from "./effects.js";

const NODE_COLORS: Record<string, number> = {
  root: 0xe94560,
  generator: 0x53d769,
  turret: 0xff8c00,
  shield: 0x00bfff,
};

export function computeStateDiffs(prev: GameState, next: GameState): VisualEffect[] {
  const effects: VisualEffect[] = [];
  const prevNodeMap = new Map(prev.nodes.map((n) => [n.id, n]));
  const nextNodeMap = new Map(next.nodes.map((n) => [n.id, n]));
  const prevEdgeMap = new Map(prev.edges.map((e) => [e.id, e]));

  for (const [id, prevNode] of prevNodeMap) {
    const nextNode = nextNodeMap.get(id);
    if (!nextNode) {
      effects.push(createNodeDeath(
        id,
        prevNode.position.x,
        prevNode.position.y,
        10,
        NODE_COLORS[prevNode.nodeType] ?? 0xffffff,
      ));
    } else if (nextNode.health < prevNode.health) {
      effects.push(createDamageFlash(
        id,
        nextNode.position.x,
        nextNode.position.y,
      ));
    }
  }

  for (const [id, prevEdge] of prevEdgeMap) {
    if (!next.edges.some((e) => e.id === id)) {
      const fromNode = prevNodeMap.get(prevEdge.fromNodeId);
      const toNode = prevNodeMap.get(prevEdge.toNodeId);
      if (fromNode && toNode) {
        effects.push(createEdgeBreak(
          id,
          fromNode.position.x,
          fromNode.position.y,
          toNode.position.x,
          toNode.position.y,
        ));
      }
    }
  }

  return effects;
}
