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
