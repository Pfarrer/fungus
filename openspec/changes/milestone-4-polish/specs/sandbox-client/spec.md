## MODIFIED Requirements

### Requirement: Node rendering
Nodes SHALL be rendered as distinct visual elements differentiated by type. Each node type SHALL have a unique visual style. Each node SHALL display its current health as a health bar. Health bars SHALL interpolate smoothly between values when a tick-result arrives.

#### Scenario: Root node appearance
- **WHEN** a root node is rendered
- **THEN** it appears with a distinct visual style (e.g., larger circle, different color) from generators

#### Scenario: Generator appearance
- **WHEN** a generator node is rendered
- **THEN** it appears as a styled circle at its position

#### Scenario: Turret appearance
- **WHEN** a turret node is rendered
- **THEN** it appears with a distinct visual style (e.g., orange/yellow) differentiated from other node types

#### Scenario: Shield appearance
- **WHEN** a shield node is rendered
- **THEN** it appears with a distinct visual style (e.g., blue/cyan) differentiated from other node types

#### Scenario: Health bar display
- **WHEN** any node is rendered
- **THEN** a health bar is shown indicating current health relative to max health

#### Scenario: Health bar interpolation
- **WHEN** a tick-result arrives and a node's health has changed
- **THEN** the health bar smoothly animates from the previous value to the new value over 200ms

### Requirement: Edge rendering
Edges SHALL be rendered as lines connecting parent and child nodes. Edges SHALL visually connect node centers. Edge color SHALL reflect health status (full health vs damaged).

#### Scenario: Edge between nodes
- **WHEN** two nodes are connected by an edge
- **THEN** a line is drawn between the center positions of both nodes

#### Scenario: Damaged edge
- **WHEN** an edge has less than full health
- **THEN** the edge line color changes to indicate damage (e.g., red tint proportional to damage)

## ADDED Requirements

### Requirement: Damage flash effect
When a node takes damage between ticks, the node SHALL briefly flash a bright color to indicate the hit.

#### Scenario: Node takes damage
- **WHEN** a tick-result arrives and a node's health decreased from the previous tick
- **THEN** the node flashes white for 200ms

### Requirement: Node death animation
When a node is destroyed (present in previous state but absent in new state), a brief death animation SHALL play at the node's last position.

#### Scenario: Node destroyed
- **WHEN** a tick-result arrives and a node that existed in the previous state no longer exists
- **THEN** the node's circle expands and fades out over 400ms at its last known position

### Requirement: Edge break effect
When an edge is destroyed between ticks, a brief visual effect SHALL play along the edge's path.

#### Scenario: Edge destroyed
- **WHEN** a tick-result arrives and an edge that existed in the previous state no longer exists
- **THEN** the edge line flashes red and fades out over 300ms

### Requirement: Match end screen
When a winner is determined, a full-screen overlay SHALL appear displaying the match result, the winner, and a button to start a new match.

#### Scenario: Victory screen
- **WHEN** the current player wins the match
- **THEN** a full-screen overlay appears with "Victory!" text, the winning player's name, and a "New Match" button

#### Scenario: Defeat screen
- **WHEN** the current player loses the match
- **THEN** a full-screen overlay appears with "Defeat!" text and a "New Match" button

#### Scenario: New match button
- **WHEN** the player clicks "New Match" on the match end screen
- **THEN** the page reloads to start a fresh match connection

### Requirement: Full HUD display
The HUD SHALL display: connection status, current tick number, resources (current/cap), queued action count with expandable list, tick countdown timer, and a mini enemy network overview showing enemy node count by type.

#### Scenario: Enemy network overview
- **WHEN** the game is running
- **THEN** the HUD displays enemy node counts by type (root, generator, turret, shield)

#### Scenario: Queued actions list
- **WHEN** the player has queued actions
- **THEN** the HUD shows a list of queued action descriptions (e.g., "Place generator at (x, y)")

#### Scenario: Tick countdown timer
- **WHEN** a tick-countdown message is received with secondsRemaining
- **THEN** the HUD displays a countdown timer that updates in real-time

### Requirement: Shield visual aura
Shield nodes SHALL display a pulsing translucent aura around the nodes they protect. The aura radius SHALL indicate the shield's effective area.

#### Scenario: Shield aura on protected node
- **WHEN** a node is protected by an adjacent shield
- **THEN** a translucent blue pulsing circle is drawn around the protected node

#### Scenario: Shield node itself
- **WHEN** a shield node is rendered
- **THEN** it displays a static blue ring indicating its shield range
