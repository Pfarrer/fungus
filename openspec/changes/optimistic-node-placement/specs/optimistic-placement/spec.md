## ADDED Requirements

### Requirement: Ghost node rendering on placement
The client SHALL render a ghost node immediately when a player places a valid node, before the tick result confirms the placement. The ghost node SHALL appear at the clicked position with reduced opacity (~40%) and no health bar.

#### Scenario: Valid placement shows ghost node
- **WHEN** a player clicks a valid position to place a generator node
- **THEN** a semi-transparent generator ghost node appears immediately at that position
- **AND** the ghost node renders without a health bar

#### Scenario: Invalid placement shows no ghost
- **WHEN** a player clicks a position that fails client-side validation
- **THEN** no ghost node is rendered

### Requirement: Ghost edge rendering
When a ghost node is rendered, the client SHALL also render a ghost edge connecting it to the closest friendly node within range, displayed at the same reduced opacity as the ghost node.

#### Scenario: Ghost node shows connecting edge
- **WHEN** a player places a node and a friendly node is within connection range
- **THEN** a semi-transparent edge is drawn between the ghost node and the closest friendly node

#### Scenario: Ghost node with no friendly node in range
- **WHEN** a player places a node but no friendly node is within connection range
- **THEN** the placement fails validation and no ghost node or edge is rendered

### Requirement: Multiple ghost nodes
The client SHALL support rendering multiple ghost nodes simultaneously when a player queues multiple node placements before a tick fires.

#### Scenario: Two rapid placements show two ghosts
- **WHEN** a player places a generator at (3,2) and then a turret at (4,2) before the tick fires
- **THEN** both ghost nodes are rendered simultaneously at their respective positions

### Requirement: Ghost-to-solid reconciliation on tick
When a tick result arrives, the client SHALL reconcile each ghost node against the new game state. If a matching node (same position, type, and player) exists in the authoritative state, the ghost is removed and the confirmed node renders normally. If no match exists, the ghost is removed.

#### Scenario: Successful placement materializes
- **WHEN** a tick result arrives and the new game state contains a generator at position (3,2) owned by the player who placed a ghost there
- **THEN** the ghost node is removed and the confirmed generator renders at full opacity with a health bar

#### Scenario: Failed placement removes ghost
- **WHEN** a tick result arrives and the new game state does not contain a node matching a ghost node's position, type, and player
- **THEN** the ghost node is removed without a confirmed node appearing

#### Scenario: All ghosts cleared on tick result
- **WHEN** a tick result arrives
- **THEN** all pending ghost nodes are reconciled and removed, regardless of outcome

### Requirement: Works in both game modes
Ghost node rendering SHALL work identically in single-player (local game loop) and multiplayer (WebSocket) modes. In single-player mode, ghost nodes reconcile when the local tick fires. In multiplayer mode, ghost nodes reconcile when the server sends a tick-result message.

#### Scenario: Ghost node in single player
- **WHEN** a player places a node in single-player mode and the local game loop tick fires
- **THEN** the ghost node reconciles against the locally simulated tick result

#### Scenario: Ghost node in multiplayer
- **WHEN** a player places a node in multiplayer mode and the server sends a tick-result
- **THEN** the ghost node reconciles against the server's tick result
