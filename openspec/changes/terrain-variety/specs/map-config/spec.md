## MODIFIED Requirements

### Requirement: Map configuration
The map SHALL be defined by a configuration object containing: width, height, max connection distance, spawn points (per player), node type definitions (cost, health, production/consumption rates), resource cap, and a terrain grid. The terrain grid SHALL include a `cellSize` (pixel size per cell) and a 2D array of terrain type strings. A `terrainTypes` map SHALL define the properties (buildable, allowedNodeTypes) for each terrain type used in the grid.

#### Scenario: Loading a map configuration with terrain
- **WHEN** the server starts a match with a map that includes a terrain grid
- **THEN** it loads the terrain grid and terrain type definitions alongside existing map parameters

#### Scenario: Loading a map configuration without terrain
- **WHEN** the server starts a match with a map that does not include a terrain grid
- **THEN** the entire map is treated as ground terrain with no placement restrictions

### Requirement: Default map
The game SHALL ship with at least one default map configuration suitable for a 2-player match. The default configuration SHALL specify:
- Map: 800x600 pixels
- Max connection distance: 100 pixels
- Spawn points: (50, 300) and (750, 300)
- Tick duration: 1000ms
- Resource cap: 500
- Root: cost 0, health 100, production 1/tick
- Generator: cost 15, health 30, production 3/tick
- Turret: cost 25, health 20, consumption 2/tick, damage 5/tick, range 120
- Shield: cost 20, health 25, consumption 1/tick, reduction 20%
- Edge health: 20
- Terrain grid with cellSize 50, containing a mix of ground, rock, water, and minerals cells arranged to create strategic variety between and around spawn points

#### Scenario: Default map used when none specified
- **WHEN** a match is created without specifying a map
- **THEN** the default map configuration is used with terrain grid and all above values

#### Scenario: Default map has terrain variety
- **WHEN** the default map is loaded
- **THEN** the terrain grid contains at least one rock cell, at least one water cell, and at least one minerals cell
