## ADDED Requirements

### Requirement: Map dimensions
The game SHALL be played on a finite 2D rectangular map defined by width and height in map configuration. All node positions SHALL be constrained within these boundaries.

#### Scenario: Node placed within bounds
- **WHEN** a player places a node within the map dimensions
- **THEN** the placement succeeds (subject to other validation rules)

#### Scenario: Node placed outside bounds
- **WHEN** a player places a node at a position outside the map dimensions
- **THEN** the placement is rejected

### Requirement: Spawn points
The map SHALL define one spawn point per player. Each player's root node SHALL be placed at their spawn point when the match begins.

#### Scenario: Two-player spawn
- **WHEN** a match starts with 2 players
- **THEN** Player A's root is placed at spawn point A and Player B's root is placed at spawn point B

### Requirement: Map configuration
The map SHALL be defined by a configuration object containing: width, height, max connection distance, tick duration, spawn points (per player), node type definitions (cost, health, range, production/consumption rates), and resource cap.

#### Scenario: Loading a map configuration
- **WHEN** the server starts a match
- **THEN** it loads a map configuration that defines all gameplay parameters

### Requirement: Default map
The game SHALL ship with at least one default map configuration suitable for a 2-player match.

#### Scenario: Default map used when none specified
- **WHEN** a match is created without specifying a map
- **THEN** the default map configuration is used
