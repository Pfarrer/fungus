## MODIFIED Requirements

### Requirement: Core type definitions
The game SHALL define the following core types in `packages/game/`:
- `Position`: `{ x: number, y: number }`
- `Node`: `{ id: string, playerId: string, nodeType: NodeType, position: Position, health: number, maxHealth: number, parentId: string | null, connected: boolean }`
- `Edge`: `{ id: string, fromNodeId: string, toNodeId: string, health: number, maxHealth: number }`
- `NodeType`: `"root" | "generator" | "turret" | "shield"`
- `Player`: `{ id: string, resources: number, spawnPoint: Position }`
- `GameState`: `{ nodes: Node[], edges: Edge[], players: Player[], tick: number, winner: string | null }`
- `GameAction`: `{ type: "PlaceNode", nodeType: string, position: Position }`
- `MapConfig`: `{ width: number, height: number, maxConnectionDistance: number, spawnPoints: Position[], nodeTypeConfigs: Record<string, NodeTypeConfig>, edgeHealth: number }`
- `NodeTypeConfig`: `{ cost: number, health: number, productionPerTick: number, consumptionPerTick: number, damagePerTick?: number, attackRange?: number, shieldReductionPercent?: number }`
- `GameConfig`: `{ map: MapConfig, tickDurationMs: number, resourceCap: number, deathRatePerTick: number, maxShieldReductionPercent: number }`
- `ScenarioData`: `{ name: string, description: string, enemyNodes: Array<{ id: string, nodeType: string, position: Position, parentId: string | null }>, enemyEdges?: Array<{ id: string, fromNodeId: string, toNodeId: string }> }`

#### Scenario: Types are importable
- **WHEN** a package imports from `@fungus/game`
- **THEN** all core types listed above are available

#### Scenario: Types are shared between packages
- **WHEN** both `@fungus/client` and `@fungus/server` import types from `@fungus/game`
- **THEN** they resolve to the same type definitions (no duplication)

#### Scenario: Combat stats are optional on NodeTypeConfig
- **WHEN** a NodeTypeConfig is created for a generator (non-combat type)
- **THEN** damagePerTick, attackRange, and shieldReductionPercent are optional and default to undefined

#### Scenario: Turret config has combat stats
- **WHEN** the turret NodeTypeConfig is defined
- **THEN** it includes damagePerTick (number) and attackRange (number)

#### Scenario: Shield config has shield stat
- **WHEN** the shield NodeTypeConfig is defined
- **THEN** it includes shieldReductionPercent (number between 0 and 100)
