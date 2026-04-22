## MODIFIED Requirements

### Requirement: Placement validation
A node placement action SHALL be valid only if: (1) the target position is within max connection distance of at least one existing friendly node, (2) the target position is not occupied by another node, (3) the target position is within the map boundaries, (4) the target position is at least `minNodeDistance` away from every existing node (friendly and enemy), (5) the node type is not "root". The player's current resource total SHALL NOT be checked at placement time since buildings are funded over time through the construction queue.

#### Scenario: Fully valid placement
- **WHEN** a player queues a node placement that satisfies all validation rules
- **THEN** the action is accepted and a construction entry is added to the queue

#### Scenario: Position occupied
- **WHEN** a player queues a node placement at a position already occupied by any node (friendly or enemy)
- **THEN** the action is rejected

#### Scenario: No resource check at placement
- **WHEN** a player with 0 resources queues a turret placement costing 25
- **THEN** the construction is accepted into the queue (funding happens over ticks)

#### Scenario: Too close to any node
- **WHEN** a player queues a node placement at a position that is less than `minNodeDistance` away from any existing node
- **THEN** the action is rejected with a minimum distance error

#### Scenario: Exactly at minimum distance
- **WHEN** a player queues a node placement at exactly `minNodeDistance` from the nearest existing node
- **THEN** the placement succeeds (inclusive boundary)

#### Scenario: Beyond minimum distance but within connection range
- **WHEN** `minNodeDistance` is 20 and `maxConnectionDistance` is 100 and a player places a node 50 units from the nearest existing node
- **THEN** the placement succeeds
