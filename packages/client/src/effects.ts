export type EffectType = "DamageFlash" | "NodeDeath" | "EdgeBreak";

export interface BaseEffect {
  type: EffectType;
  elapsed: number;
  duration: number;
}

export interface DamageFlashEffect extends BaseEffect {
  type: "DamageFlash";
  nodeId: string;
  x: number;
  y: number;
}

export interface NodeDeathEffect extends BaseEffect {
  type: "NodeDeath";
  nodeId: string;
  x: number;
  y: number;
  radius: number;
  color: number;
}

export interface EdgeBreakEffect extends BaseEffect {
  type: "EdgeBreak";
  edgeId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export type VisualEffect = DamageFlashEffect | NodeDeathEffect | EdgeBreakEffect;

export const MAX_EFFECTS = 50;

export function createDamageFlash(
  nodeId: string,
  x: number,
  y: number,
): DamageFlashEffect {
  return { type: "DamageFlash", nodeId, x, y, elapsed: 0, duration: 200 };
}

export function createNodeDeath(
  nodeId: string,
  x: number,
  y: number,
  radius: number,
  color: number,
): NodeDeathEffect {
  return { type: "NodeDeath", nodeId, x, y, radius, color, elapsed: 0, duration: 400 };
}

export function createEdgeBreak(
  edgeId: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): EdgeBreakEffect {
  return { type: "EdgeBreak", edgeId, fromX, fromY, toX, toY, elapsed: 0, duration: 300 };
}
