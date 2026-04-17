## MODIFIED Requirements

### Requirement: Placement validation
A node placement action SHALL be valid only if: (1) the target position is within max connection distance of at least one existing friendly node, (2) the target position is not occupied by another node, (3) the target position is within the map boundaries, (4) the player has sufficient resources to build the node type, (5) the target position's terrain cell is buildable, (6) the node type is allowed on the target position's terrain cell (if the terrain type defines `allowedNodeTypes`).

#### Scenario: Fully valid placement
- **WHEN** a player queues a node placement that satisfies all validation rules including terrain compatibility
- **THEN** the action is accepted and the node is placed

#### Scenario: Position occupied
- **WHEN** a player queues a node placement at a position already occupied by any node (friendly or enemy)
- **THEN** the action is rejected

#### Scenario: Insufficient resources
- **WHEN** a player queues a turret placement but has fewer resources than the turret cost
- **THEN** the action is rejected and resources remain unchanged

#### Scenario: Obstacle terrain blocks placement
- **WHEN** a player places a node at a position on a rock terrain cell
- **THEN** the action is rejected with a terrain obstacle error

#### Scenario: Node type not allowed on terrain
- **WHEN** a player places a turret on a water cell that only allows generators
- **THEN** the action is rejected with a terrain restriction error

#### Scenario: Node type allowed on terrain
- **WHEN** a player places a generator on a minerals cell that allows generators
- **THEN** terrain validation passes and the placement proceeds to other checks
