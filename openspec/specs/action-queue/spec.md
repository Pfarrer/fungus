# action-queue Specification

## Purpose
TBD - created by archiving change core-game. Update Purpose after archive.
## Requirements
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

### Requirement: Immediate action submission
The client SHALL submit each action to the server immediately upon placement, without requiring a manual submit step. Actions SHALL NOT be held in a local batch awaiting user confirmation. If connectivity is unavailable, pending actions SHALL be retained locally until connectivity resumes, then sent in original order.

#### Scenario: Single node placed and submitted immediately
- **WHEN** a player clicks a valid position to place a generator
- **THEN** the PlaceNode action is sent to the server immediately via a `queue-actions` message containing that single action

#### Scenario: Multiple rapid placements
- **WHEN** a player places two nodes in rapid succession before the next tick
- **THEN** each action is sent as a separate `queue-actions` message immediately on click, and both accumulate in the server-side queue for the next tick

#### Scenario: Invalid placement is not submitted
- **WHEN** a player clicks a position that fails client-side validation (e.g., out of range, insufficient resources)
- **THEN** no action is sent to the server

#### Scenario: Connectivity interruption retains pending actions
- **WHEN** a player places a valid node while the client is disconnected or reconnecting
- **THEN** the action is retained locally as pending instead of being dropped

#### Scenario: Pending actions flush on reconnect
- **WHEN** connectivity resumes after one or more valid actions were retained locally
- **THEN** the client sends those pending actions to the server in the same order they were created

### Requirement: No manual submission UI
The client SHALL NOT display a manual submission button or require any user action beyond clicking to place a node. The "Execute Actions" UI element SHALL be removed.

#### Scenario: Player places node without extra step
- **WHEN** a player clicks a valid position to place a node
- **THEN** the action is submitted automatically with no additional button click required

