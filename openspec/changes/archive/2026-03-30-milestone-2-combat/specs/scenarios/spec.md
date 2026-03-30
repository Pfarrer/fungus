## ADDED Requirements

### Requirement: Scenario file format
The game SHALL support scenario files as JSON documents. Each scenario file SHALL define:
- `name`: A human-readable scenario name
- `description`: A short description of the scenario
- `enemyNodes`: An array of enemy node definitions, each with `id`, `nodeType`, `position` (x, y), and `parentId` (null for scenario root nodes)
- `enemyEdges`: An optional array of edge definitions, each with `id`, `fromNodeId`, and `toNodeId`. If omitted, edges SHALL be auto-generated from parent-child relationships.

#### Scenario: Valid scenario file
- **WHEN** a scenario JSON file contains name, description, enemyNodes with valid positions and types, and enemyNodes references valid parentIds
- **THEN** the scenario is valid and loadable

#### Scenario: Invalid scenario file
- **WHEN** a scenario JSON file is malformed or contains invalid node types or broken parent references
- **THEN** the loader rejects the file and returns an error

### Requirement: Scenario loading merges into game state
The game SHALL provide a `loadScenario(config, scenarioName)` function that reads the scenario file and returns a `GameState` with the player's initial state plus the enemy nodes and edges from the scenario.

#### Scenario: Load scenario creates enemy nodes
- **WHEN** a scenario with 5 enemy nodes is loaded
- **THEN** the resulting game state contains the player's root node plus 5 enemy nodes with the correct types and positions

#### Scenario: Enemy edges auto-generated
- **WHEN** a scenario defines enemy nodes with parent-child relationships but no explicit edges
- **THEN** edges are automatically created between each node and its parent

### Requirement: Scenario files location
Scenario files SHALL be stored in `packages/game/src/scenarios/` as `.json` files.

#### Scenario: Scenarios directory exists
- **WHEN** the game package is built
- **THEN** the scenarios directory contains at least one valid scenario JSON file

### Requirement: At least one pre-built scenario
The game SHALL include at least one pre-built scenario that provides a meaningful combat test — an enemy structure with a mix of node types positioned within range of the player's default spawn.

#### Scenario: Default scenario is playable
- **WHEN** the sandbox client starts
- **THEN** a default scenario can be loaded that places enemy nodes within turret range of the player's starting position
