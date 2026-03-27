## ADDED Requirements

### Requirement: Tree-structured networks
Each player's nodes SHALL form a tree structure rooted at their root node. A node SHALL connect to exactly one parent (the closest existing friendly node at placement time). No cycles SHALL be permitted.

#### Scenario: New node connects to closest friendly
- **WHEN** a player places a generator at position (5, 3) and their closest existing friendly node is at (3, 2)
- **THEN** the new generator's parentId is set to the node at (3, 2) and an edge is created between them

#### Scenario: First node after root
- **WHEN** a player has only a root node and places a generator within max connection distance
- **THEN** the generator connects to the root node

### Requirement: Distance-limited connections
Each connection between nodes SHALL have a maximum distance defined by map configuration. A player SHALL only place a new node if the Euclidean distance to at least one existing friendly node is less than or equal to the maximum connection distance.

#### Scenario: Within range
- **WHEN** max connection distance is 100 and a player places a node 80 units from their closest friendly node
- **THEN** the placement succeeds and an edge is created

#### Scenario: Out of range
- **WHEN** max connection distance is 100 and a player places a node 120 units from their closest friendly node
- **THEN** the placement is rejected with an out-of-range error

#### Scenario: Exactly at range
- **WHEN** max connection distance is 100 and the distance to the closest friendly node is exactly 100
- **THEN** the placement succeeds (inclusive boundary)

### Requirement: Node placement validation
A node placement action SHALL be valid only if all of the following hold: (1) the target position is within max connection distance of at least one existing friendly node, (2) the target position is not occupied by another node, (3) the target position is within the map boundaries (0 <= x < width, 0 <= y < height), (4) the player has sufficient resources to build the node type.

#### Scenario: Fully valid placement
- **WHEN** a player places a generator that satisfies all four validation rules
- **THEN** the node is created, edge is created, and resources are deducted

#### Scenario: Position occupied
- **WHEN** a player places a node at a position already occupied by any node
- **THEN** the action is rejected and resources are unchanged

#### Scenario: Out of bounds
- **WHEN** a player places a node at (-5, 300) on a 800x600 map
- **THEN** the action is rejected

#### Scenario: Insufficient resources
- **WHEN** a player with 10 resources attempts to place a generator costing 15
- **THEN** the action is rejected and resources remain 10

### Requirement: Root node auto-placement
The root node SHALL be automatically placed at the player's spawn point when the game initializes. Players SHALL NOT place additional root nodes.

#### Scenario: Root placed at game start
- **WHEN** the game initializes with a map that has spawn points at (50, 300) and (750, 300)
- **THEN** player 1 has a root node at (50, 300) and player 2 has a root node at (750, 300)

#### Scenario: Root placement rejected
- **WHEN** a player attempts to place a node of type "root"
- **THEN** the action is rejected
