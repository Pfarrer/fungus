## ADDED Requirements

### Requirement: Map dimensions
The game SHALL be played on a finite 2D rectangular map defined by `MapConfig.width` and `MapConfig.height`. All node positions SHALL satisfy `0 <= x < width` and `0 <= y < height`.

#### Scenario: Valid position
- **WHEN** a node is placed at (400, 300) on an 800x600 map
- **THEN** the position is within bounds

#### Scenario: Edge position rejected
- **WHEN** a node is placed at (800, 300) on an 800x600 map
- **THEN** the placement is rejected (x must be less than width)

### Requirement: Default map configuration
The game SHALL include a default `GameConfig` with:
- Map: 800x600 pixels
- Max connection distance: 100 pixels
- Spawn points: (50, 300) and (750, 300)
- Tick duration: 1000ms
- Resource cap: 500
- Root: cost 0, health 100, production 1/tick
- Generator: cost 15, health 30, production 3/tick

#### Scenario: Default config loads
- **WHEN** the game starts without specifying a config
- **THEN** the default config above is used

### Requirement: Spawn point assignment
Each player SHALL be assigned one spawn point from the map configuration. Player 1 receives the first spawn point, player 2 the second.

#### Scenario: Two players assigned
- **WHEN** the game initializes with 2 players and spawn points [(50,300), (750,300)]
- **THEN** player 1's root is at (50,300) and player 2's root is at (750,300)
