## MODIFIED Requirements

### Requirement: Placement validation
A node placement action SHALL be valid only if: (1) the target position is within max connection distance of at least one existing friendly node, (2) the target position is not occupied by another node, (3) the target position is within the map boundaries, (4) the target position is at least `minNodeDistance` away from every existing node (friendly and enemy), (5) the player has sufficient resources to build the node type.

#### Scenario: Fully valid placement
- **WHEN** a player queues a node placement that satisfies all validation rules
- **THEN** the action is accepted and the node is placed

#### Scenario: Position occupied
- **WHEN** a player queues a node placement at a position already occupied by any node (friendly or enemy)
- **THEN** the action is rejected

#### Scenario: Insufficient resources
- **WHEN** a player queues a turret placement but has fewer resources than the turret cost
- **THEN** the action is rejected

#### Scenario: Too close to any node
- **WHEN** a player queues a node placement at a position that is less than `minNodeDistance` away from any existing node
- **THEN** the action is rejected with a minimum distance error

#### Scenario: Exactly at minimum distance
- **WHEN** a player queues a node placement at exactly `minNodeDistance` from the nearest existing node
- **THEN** the placement succeeds (inclusive boundary)

#### Scenario: Beyond minimum distance but within connection range
- **WHEN** `minNodeDistance` is 20 and `maxConnectionDistance` is 100 and a player places a node 50 units from the nearest existing node
- **THEN** the placement succeeds
