## ADDED Requirements

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
