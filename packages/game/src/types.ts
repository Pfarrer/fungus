export interface Position {
  x: number;
  y: number;
}

export type NodeType = "root" | "generator" | "turret" | "shield";

export interface Node {
  id: string;
  playerId: string;
  nodeType: NodeType;
  position: Position;
  health: number;
  maxHealth: number;
  parentId: string | null;
  connected: boolean;
}

export interface Edge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  health: number;
  maxHealth: number;
}

export interface Player {
  id: string;
  resources: number;
  spawnPoint: Position;
}

export interface GameState {
  nodes: Node[];
  edges: Edge[];
  players: Player[];
  tick: number;
  winner: string | null;
}

export interface GameAction {
  type: "PlaceNode";
  nodeType: string;
  position: Position;
}

export interface NodeTypeConfig {
  cost: number;
  health: number;
  productionPerTick: number;
  consumptionPerTick: number;
}

export interface MapConfig {
  width: number;
  height: number;
  maxConnectionDistance: number;
  spawnPoints: Position[];
  nodeTypeConfigs: Record<string, NodeTypeConfig>;
}

export interface GameConfig {
  map: MapConfig;
  tickDurationMs: number;
  resourceCap: number;
}
