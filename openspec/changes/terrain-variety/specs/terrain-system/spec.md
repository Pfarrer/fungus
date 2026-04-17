## ADDED Requirements

### Requirement: Terrain types
The game SHALL define the following terrain types:
- **ground**: Default terrain. All node types may be placed on ground.
- **rock**: Obstacle terrain. No nodes may be placed on rock cells.
- **water**: Special underground. Only nodes whose types are listed in the terrain type's `allowedNodeTypes` may be placed on water cells.
- **minerals**: Special underground. Only nodes whose types are listed in the terrain type's `allowedNodeTypes` may be placed on mineral cells.

Each terrain type SHALL define a `buildable` boolean and an optional `allowedNodeTypes` array. When `buildable` is `false`, no node placement is permitted. When `buildable` is `true` and `allowedNodeTypes` is defined, only the listed node types are permitted. When `buildable` is `true` and `allowedNodeTypes` is `null` or undefined, all node types are permitted.

#### Scenario: Ground allows all node types
- **WHEN** a player places a generator on a ground cell
- **THEN** the placement is accepted (subject to other validation rules)

#### Scenario: Rock blocks all placement
- **WHEN** a player places any node on a rock cell
- **THEN** the placement is rejected with an obstacle error

#### Scenario: Water restricts to allowed types
- **WHEN** water terrain defines `allowedNodeTypes: ["generator"]` and a player places a generator on a water cell
- **THEN** the placement is accepted

#### Scenario: Water rejects disallowed types
- **WHEN** water terrain defines `allowedNodeTypes: ["generator"]` and a player places a turret on a water cell
- **THEN** the placement is rejected with a terrain restriction error

### Requirement: Terrain grid
The map configuration SHALL include a terrain grid that assigns a terrain type to every cell on the map. The grid SHALL be defined by a `cellSize` (in pixels) and a 2D array of terrain type strings. Grid dimensions SHALL be derived as `cols = ceil(mapWidth / cellSize)` and `rows = ceil(mapHeight / cellSize)`.

#### Scenario: Terrain grid covers entire map
- **WHEN** the map is 800x600 with cellSize 50
- **THEN** the terrain grid has 16 columns and 12 rows (192 cells)

#### Scenario: Position resolves to correct cell
- **WHEN** a node is placed at position (375, 125) on a map with cellSize 50
- **THEN** the terrain cell at column 7, row 2 is looked up

### Requirement: Position-to-cell resolution
The game SHALL provide a function that converts a pixel position (x, y) to a terrain cell index (col, row) using `col = floor(x / cellSize)` and `row = floor(y / cellSize)`.

#### Scenario: Position in first cell
- **WHEN** a position (10, 10) is resolved with cellSize 50
- **THEN** the result is column 0, row 0

#### Scenario: Position at cell boundary
- **WHEN** a position (50, 0) is resolved with cellSize 50
- **THEN** the result is column 1, row 0

#### Scenario: Position outside grid
- **WHEN** a position (900, 300) is resolved on an 800x600 map with cellSize 50
- **THEN** the cell index is out of bounds and placement is rejected by bounds checking

### Requirement: Default terrain types configuration
The game SHALL define default terrain type properties:
- `ground`: buildable `true`, allowedNodeTypes `null`
- `rock`: buildable `false`, allowedNodeTypes `null`
- `water`: buildable `true`, allowedNodeTypes `["generator"]`
- `minerals`: buildable `true`, allowedNodeTypes `["generator"]`

#### Scenario: Default terrain type properties loaded
- **WHEN** the game loads terrain type configuration without custom overrides
- **THEN** ground permits all types, rock blocks all, water and minerals permit generators only

### Requirement: Terrain rendering
The renderer SHALL display each terrain cell as a filled rectangle with a color specific to its terrain type. Obstacle cells (rock) SHALL use a distinct color. The terrain layer SHALL be rendered beneath all other map elements.

#### Scenario: Terrain cells rendered
- **WHEN** the map has a water cell at column 3, row 4 with cellSize 50
- **THEN** a filled rectangle is drawn at pixel coordinates (150, 200) with size 50x50 in the water color

#### Scenario: Obstacles visually distinct
- **WHEN** the map has rock cells
- **THEN** rock cells are rendered with a visually distinct color from ground cells

### Requirement: Terrain-compatible placement validation
Node placement validation SHALL resolve the target position to a terrain cell and check: (1) the cell is buildable, (2) if `allowedNodeTypes` is defined, the node type is in the list. A failed terrain check SHALL return a specific error reason.

#### Scenario: Placement on valid terrain
- **WHEN** a player places a generator on a minerals cell that allows generators
- **THEN** terrain validation passes and other checks proceed

#### Scenario: Placement on obstacle
- **WHEN** a player places a node on a rock cell
- **THEN** validation fails with reason indicating the cell is an obstacle

#### Scenario: Wrong node type for terrain
- **WHEN** a player places a turret on a water cell that only allows generators
- **THEN** validation fails with reason indicating the node type is not allowed on this terrain

### Requirement: Missing terrain defaults to ground
If a map configuration does not include a terrain grid, the game SHALL treat the entire map as ground terrain with no placement restrictions.

#### Scenario: Legacy map without terrain
- **WHEN** a map config has no terrain grid defined
- **THEN** all positions behave as ground terrain and placement works as before
