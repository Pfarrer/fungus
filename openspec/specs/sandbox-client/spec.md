# sandbox-client Specification

## Purpose
Client application that renders the game world, handles user input, and manages local single-player and multiplayer game sessions.

## Requirements

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

### Requirement: Menu-first startup
The client SHALL display the main menu on startup instead of immediately connecting to a game server. The existing direct-connect behavior via URL query params (`matchId`, `playerId`) SHALL only activate when the user initiates a game from the menu.

#### Scenario: Fresh load without query params
- **WHEN** the client loads without `matchId` or `playerId` in the URL
- **THEN** the main menu is displayed and no WebSocket connection is established

#### Scenario: Refresh with established multiplayer URL params
- **WHEN** the client loads with `matchId` and `playerId` already present in the URL
- **THEN** the client uses those URL params to reconnect to the existing multiplayer session instead of showing a fresh menu flow

#### Scenario: Player name display in HUD
- **WHEN** the game is running and a player name has been entered
- **THEN** the HUD displays the player's name from the active player entry in `GameState.players`

### Requirement: Local single-player game loop
The client SHALL support running a single-player game using a local tick simulation. The local game loop SHALL use `simulateTick` from `@fungus/game` and produce `GameState` updates at the configured tick interval, bypassing the WebSocket connection entirely.

#### Scenario: Single-player tick execution
- **WHEN** a single-player game is active
- **THEN** ticks are simulated locally at the configured `tickDurationMs` interval using `simulateTick`

#### Scenario: Single-player action queuing
- **WHEN** the player queues actions in single-player mode
- **THEN** actions are applied locally in the next tick simulation without sending to a server

#### Scenario: Single-player state rendering
- **WHEN** a local tick completes
- **THEN** the resulting `GameState` is rendered identically to a server-provided state

### Requirement: Scenario loader UI
The client SHALL provide a scenario loader that lists available scenarios and allows the player to load one. When a scenario is loaded, the game state is reset with the scenario's enemy structure.

#### Scenario: List scenarios
- **WHEN** the sandbox client is open and the player opens the scenario loader
- **THEN** a list of available scenarios is displayed with names and descriptions

#### Scenario: Load scenario
- **WHEN** the player selects a scenario from the list
- **THEN** the game state is reset and the scenario's enemy nodes are placed on the map

#### Scenario: Scenario loader UI element
- **WHEN** the sandbox client is running
- **THEN** a "Scenarios" button or tab is accessible from the UI

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
The HUD SHALL display: connection status, current tick number, resources (current/cap), queued action count with expandable list, tick countdown timer, a mini enemy network overview showing enemy node count by type, and multiplayer presence feedback including reconnect progress and opponent state when applicable.

#### Scenario: Enemy network overview
- **WHEN** the game is running
- **THEN** the HUD displays enemy node counts by type (root, generator, turret, shield)

#### Scenario: Queued actions list
- **WHEN** the player has queued actions
- **THEN** the HUD shows a list of queued action descriptions (e.g., "Place generator at (x, y)")

#### Scenario: Tick countdown timer
- **WHEN** a tick-countdown message is received with secondsRemaining
- **THEN** the HUD displays a countdown timer that updates in real-time

#### Scenario: Presence feedback while reconnecting
- **WHEN** the multiplayer connection is retrying after a disconnect
- **THEN** the HUD shows reconnect progress or a retry timer

#### Scenario: Opponent disconnect indicator
- **WHEN** the remote player disconnects during an active match
- **THEN** the HUD shows that the opponent is disconnected or waiting to return

#### Scenario: Presence returns to normal
- **WHEN** the remote player reconnects successfully
- **THEN** the HUD returns to the normal connected state

### Requirement: Shield visual aura
Shield nodes SHALL display a pulsing translucent aura around the nodes they protect. The aura radius SHALL indicate the shield's effective area.

#### Scenario: Shield aura on protected node
- **WHEN** a node is protected by an adjacent shield
- **THEN** a translucent blue pulsing circle is drawn around the protected node

#### Scenario: Shield node itself
- **WHEN** a shield node is rendered
- **THEN** it displays a static blue ring indicating its shield range
