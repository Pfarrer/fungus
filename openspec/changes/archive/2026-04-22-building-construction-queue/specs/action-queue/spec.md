## MODIFIED Requirements

### Requirement: Action types
The system SHALL support the following action types:
- **PlaceNode**: Queue a construction for a node of a specified type at a specified position. The node SHALL NOT appear on the map until the construction is fully funded.
- (Future: UpgradeNode, SellNode, etc.)

#### Scenario: PlaceNode action queues construction
- **WHEN** a player queues a PlaceNode action with type "generator" at position (5, 3)
- **THEN** a construction entry is added to the player's construction queue for the generator

### Requirement: Sequential action validation within a tick
Actions within a single tick SHALL be validated and applied sequentially in queue order. Earlier actions in the queue affect the game state for later validations. PlaceNode actions add constructions to the queue but do not immediately create nodes. Validation of later placements considers existing nodes only (not in-progress constructions).

#### Scenario: Two constructions queued in one tick
- **WHEN** a player queues "place generator at (3,2)" then "place turret at (4,3)" in the same tick
- **THEN** the generator construction is queued first, then the turret construction is queued, and both are funded from surplus

#### Scenario: Bridge building across ticks only
- **WHEN** a player queues "place generator at (3,2)" (within range) then "place turret at (5,3)" (out of range of existing nodes but within range of the planned generator)
- **THEN** the turret placement is rejected because the generator construction is not yet a node on the map

#### Scenario: Failed action does not block later actions
- **WHEN** a player queues 3 actions and the 2nd fails validation
- **THEN** the 1st construction is queued, the 2nd is skipped, and the 3rd is validated against the current state
