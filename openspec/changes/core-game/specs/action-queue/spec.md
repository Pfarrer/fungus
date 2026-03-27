## ADDED Requirements

### Requirement: Action types
The system SHALL support the following action types:
- **PlaceNode**: Place a node of a specified type at a specified position
- (Future: UpgradeNode, SellNode, etc.)

#### Scenario: PlaceNode action
- **WHEN** a player queues a PlaceNode action with type "generator" at position (5, 3)
- **THEN** the action is stored in the player's queue for the current tick

### Requirement: Per-tick action queue
Each player SHALL have an action queue that accumulates actions between ticks. When a tick triggers, the entire queue is collected for validation and resolution.

#### Scenario: Multiple actions queued
- **WHEN** a player queues "place generator at (3,2)" and then "place generator at (4,2)" before the tick fires
- **THEN** both actions are collected when the tick executes

#### Scenario: Queue clears after tick
- **WHEN** a tick has processed all queued actions
- **THEN** the player's queue is empty for the next tick

### Requirement: Sequential action validation within a tick
Actions within a single tick SHALL be validated and applied sequentially in queue order. Earlier actions in the queue affect the game state for later validations (e.g., placing a generator first may provide resources for a later turret placement within the same tick).

#### Scenario: Resource dependency within a tick
- **WHEN** a player queues "place generator at (3,2)" then "place turret at (4,3)" and has exactly enough resources for the generator but not both
- **THEN** the generator is placed first, resources are deducted, and the turret is evaluated against the remaining resources (likely rejected unless generator produces immediately)

#### Scenario: Bridge building within a tick
- **WHEN** a player queues "place generator at (3,2)" (within range of existing node) then "place turret at (5,3)" (out of range of existing node but within range of the just-placed generator)
- **THEN** the turret placement is validated against the state after the generator was placed, and succeeds if within range of the new generator

### Requirement: Action rejection
If an action fails validation, it SHALL be rejected and the game state SHALL remain unchanged for that action. Subsequent actions in the queue SHALL still be validated against the current (possibly modified) state.

#### Scenario: Failed action does not block later actions
- **WHEN** a player queues 3 actions and the 2nd fails validation
- **THEN** the 1st is applied, the 2nd is skipped, and the 3rd is validated against the state after the 1st
