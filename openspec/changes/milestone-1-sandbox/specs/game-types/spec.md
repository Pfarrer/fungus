## ADDED Requirements

### Requirement: Core type definitions
The game SHALL define the following core types in `packages/game/`:
- `Position`: `{ x: number, y: number }`
- `Node`: `{ id: string, playerId: string, nodeType: NodeType, position: Position, health: number, maxHealth: number, parentId: string | null, connected: boolean }`
- `Edge`: `{ id: string, fromNodeId: string, toNodeId: string, health: number, maxHealth: number }`
- `NodeType`: `"root" | "generator" | "turret" | "shield"` (turret and shield reserved for future milestones)
- `Player`: `{ id: string, resources: number, spawnPoint: Position }`
- `GameState`: `{ nodes: Node[], edges: Edge[], players: Player[], tick: number, winner: string | null }`
- `GameAction`: `{ type: "PlaceNode", nodeType: string, position: Position }` (discriminated union, extensible)
- `MapConfig`: `{ width: number, height: number, maxConnectionDistance: number, spawnPoints: Position[], nodeTypeConfigs: Record<string, NodeTypeConfig> }`
- `NodeTypeConfig`: `{ cost: number, health: number, productionPerTick: number, consumptionPerTick: number }`
- `GameConfig`: `{ map: MapConfig, tickDurationMs: number, resourceCap: number }`

#### Scenario: Types are importable
- **WHEN** a package imports from `@fungus/game`
- **THEN** all core types listed above are available

#### Scenario: Types are shared between packages
- **WHEN** both `@fungus/client` and `@fungus/server` import types from `@fungus/game`
- **THEN** they resolve to the same type definitions (no duplication)
