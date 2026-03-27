# node-network Specification

## Purpose
Defines node types, tree-structured networks, distance-limited connections, and placement validation rules.
## Requirements
### Requirement: Node types
The game SHALL support the following node types:
- **Root**: The player's origin node. Each player SHALL have exactly one root node placed at their map spawn point. The root node SHALL generate a small amount of resources.
- **Generator**: Produces resources each tick. Has no combat capabilities.
- **Turret**: Consumes resources to attack enemy nodes and edges within range.
- **Shield**: Consumes resources to reduce incoming damage to adjacent nodes in the tree.

#### Scenario: Root node placement
- **WHEN** a match starts
- **THEN** each player has one root node placed at their configured spawn point

#### Scenario: Root node is unique
- **WHEN** a player attempts to place a root node
- **THEN** the action is rejected (root is auto-placed at game start only)

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

### Requirement: Tree-structured networks
Each player's nodes SHALL form a tree structure rooted at their root node. A node SHALL connect to exactly one parent (the closest existing friendly node at placement time). No cycles SHALL be permitted.

#### Scenario: New node connects to closest friendly
- **WHEN** a player places a generator at position (5, 3) and their closest existing friendly node is at (3, 2)
- **THEN** the new generator connects to the node at (3, 2) with an edge between them

#### Scenario: First node after root
- **WHEN** a player has only a root node and places a generator within max connection distance
- **THEN** the generator connects to the root node

#### Scenario: No cycles
- **WHEN** a player attempts to place a node such that connecting it would form a cycle
- **THEN** the action is rejected (impossible with tree structure since new nodes always connect to existing nodes as leaves)

### Requirement: Placement validation

### Requirement: Node and edge health
Nodes and edges SHALL have health points. When health reaches zero, the node or edge is destroyed.

#### Scenario: Node destroyed
- **WHEN** a node's health drops to zero or below
- **THEN** the node is removed from the game

#### Scenario: Edge destroyed
- **WHEN** an edge's health drops to zero or below
- **THEN** the edge is removed and the tree may become disconnected

### Requirement: Placement validation
A node placement action SHALL be valid only if: (1) the target position is within max connection distance of at least one existing friendly node, (2) the target position is not occupied by another node, (3) the target position is within the map boundaries, (4) the player has sufficient resources to build the node type.

#### Scenario: Fully valid placement
- **WHEN** a player queues a node placement that satisfies all validation rules
- **THEN** the action is accepted and the node is placed

#### Scenario: Position occupied
- **WHEN** a player queues a node placement at a position already occupied by any node (friendly or enemy)
- **THEN** the action is rejected

#### Scenario: Insufficient resources
- **WHEN** a player queues a turret placement but has fewer resources than the turret cost
- **THEN** the action is rejected

