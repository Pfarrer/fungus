## ADDED Requirements

### Requirement: Local game tick loop
The single player mode SHALL run the game locally using `simulateTick` from `@fungus/game` on a fixed interval defined by `GameConfig.tickDurationMs`.

#### Scenario: Game starts with selected scenario
- **WHEN** the user starts a single player game with a selected scenario
- **THEN** `loadScenario` SHALL be called with `defaultGameConfig` and the selected scenario to produce the initial `GameState`

#### Scenario: Ticks execute on interval
- **WHEN** a single player game is running
- **THEN** `simulateTick` SHALL be called every `tickDurationMs` milliseconds with the current game state and queued actions, producing an updated state

### Requirement: Local action queuing
The player SHALL be able to place nodes and queue actions in single player mode using the same interaction pattern as multiplayer.

#### Scenario: Player queues actions between ticks
- **WHEN** the player clicks to place nodes between ticks
- **THEN** actions SHALL be queued and passed to `simulateTick` on the next tick

#### Scenario: Tick processes queued actions
- **WHEN** a tick fires with queued actions
- **THEN** `simulateTick` SHALL receive all queued actions and the game state SHALL update accordingly, then the renderer SHALL display the new state

### Requirement: Win/loss detection in single player
The single player mode SHALL detect when the game ends (a winner is determined) and display the result.

#### Scenario: Player wins scenario
- **WHEN** `simulateTick` produces a game state where `winner` equals the player's ID
- **THEN** a victory message SHALL be displayed

#### Scenario: Player loses scenario
- **WHEN** `simulateTick` produces a game state where `winner` is set to a non-player ID
- **THEN** a defeat message SHALL be displayed

### Requirement: No network connection in single player
Single player mode SHALL NOT create any WebSocket connection.

#### Scenario: Single player starts without WebSocket
- **WHEN** the user starts a single player game
- **THEN** no WebSocket connection SHALL be created, and the game SHALL run entirely in the browser
