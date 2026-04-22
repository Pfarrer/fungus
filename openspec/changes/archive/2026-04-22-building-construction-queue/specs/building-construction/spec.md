## ADDED Requirements

### Requirement: Construction queue
Each player SHALL maintain a construction queue. When a PlaceNode action is validated and accepted, a construction entry SHALL be added to the player's queue instead of placing the node immediately. Each construction entry SHALL track: nodeType, position, parentId, totalCost, and funded (resources allocated so far, starting at 0).

#### Scenario: PlaceNode creates construction entry
- **WHEN** a player places a generator at position (5, 3) with a cost of 15
- **THEN** a construction entry is added to the player's queue with nodeType "generator", position (5, 3), totalCost 15, and funded 0

#### Scenario: Multiple constructions queued
- **WHEN** a player places a generator and then a turret in the same tick
- **THEN** both constructions appear in the player's queue in queue order

#### Scenario: Empty queue at game start
- **WHEN** a new match begins
- **THEN** all players have empty construction queues

### Requirement: Construction funding from surplus
Each tick, after resource generation and consumption, the remaining surplus SHALL be distributed to the player's construction queue. If the player has no constructions, the surplus SHALL be discarded. Player resources SHALL be set to 0 after construction funding.

#### Scenario: Single construction funded
- **WHEN** a player has a net surplus of 5 resources and one construction with totalCost 15 and funded 0
- **THEN** the construction's funded value becomes 5 and the player's resources become 0

#### Scenario: Surplus discarded with no constructions
- **WHEN** a player has a net surplus of 8 resources and no constructions in the queue
- **THEN** the surplus is discarded and the player's resources become 0

#### Scenario: Zero surplus with constructions
- **WHEN** a player has a net surplus of 0 and two constructions in the queue
- **THEN** no resources are allocated to either construction and both remain at their current funded values

### Requirement: Equal surplus sharing
When a player has multiple constructions, the surplus SHALL be split equally. Each construction SHALL receive `Math.floor(surplus / count)` resources. The remainder (`surplus % count`) SHALL be distributed one unit each to the first `remainder` constructions in queue order.

#### Scenario: Even split
- **WHEN** a player has a surplus of 6 and 3 constructions
- **THEN** each construction receives 2 resources

#### Scenario: Uneven split with remainder
- **WHEN** a player has a surplus of 7 and 3 constructions
- **THEN** the first construction receives 3, the second receives 2, and the third receives 2

#### Scenario: Surplus less than construction count
- **WHEN** a player has a surplus of 2 and 5 constructions
- **THEN** the first 2 constructions receive 1 each and the remaining 3 receive 0

### Requirement: Construction completion
When a construction's funded value reaches or exceeds its totalCost, the construction SHALL be removed from the queue and the corresponding node and edge SHALL be added to the game state. The node SHALL have full health and connect to its recorded parentId.

#### Scenario: Construction completes exactly
- **WHEN** a construction with totalCost 15 has funded 12 and receives 3 surplus
- **THEN** the construction is removed from the queue and the node appears on the map with full health

#### Scenario: Construction completes with overflow
- **WHEN** a construction with totalCost 10 has funded 8 and receives 5 surplus
- **THEN** the construction completes, the node appears on the map, and 3 excess resources are lost (not routed to other constructions)

#### Scenario: Multiple constructions complete same tick
- **WHEN** a player has two constructions both completing this tick
- **THEN** both nodes are added to the game state

### Requirement: Construction does not participate in gameplay
Constructions that are not yet complete SHALL NOT appear as nodes in the game state. They SHALL NOT block placement, participate in combat, generate resources, or consume resources. Only completed buildings are active game entities.

#### Scenario: Incomplete construction does not block placement
- **WHEN** a player has a construction in progress at position (5, 3)
- **THEN** another player can place a node at (5, 3) and it is not considered occupied

#### Scenario: Incomplete construction does not generate resources
- **WHEN** a player has a generator construction at 50% funding
- **THEN** the generator does not produce resources during the resource generation step

### Requirement: Construction state in tick results
The server SHALL include each player's construction queue in tick result messages. Each entry SHALL include nodeType, position, funded, and totalCost so the client can display progress.

#### Scenario: Tick result includes constructions
- **WHEN** a player has two constructions in progress
- **THEN** the tick result message includes a constructions array with both entries

#### Scenario: Completed construction removed from result
- **WHEN** a construction completes during a tick
- **THEN** the tick result for that player does not include the completed construction (it is now a node)
