## ADDED Requirements

### Requirement: Tick-based simulation
The game SHALL advance in discrete ticks. Each tick SHALL collect all queued player actions, validate them, apply them to game state, simulate one step of game logic, and produce a new game state.

#### Scenario: Normal tick execution
- **WHEN** a tick is triggered
- **THEN** the system collects queued actions from all players, validates each action, applies valid actions to game state, runs simulation (resource generation, combat, death), and produces a new game state

#### Scenario: Empty tick
- **WHEN** a tick triggers and no player has queued any actions
- **THEN** the system still advances simulation (resources generate, combat resolves, death timers tick)

### Requirement: Configurable tick duration
The game SHALL accept a tick duration as a map configuration parameter. Valid durations SHALL range from 100ms (real-time mode) to 86400000ms (24-hour correspondence mode).

#### Scenario: Real-time mode
- **WHEN** tick duration is set to 100ms
- **THEN** the server executes ticks every 100ms

#### Scenario: Correspondence mode
- **WHEN** tick duration is set to 14400000ms (4 hours)
- **THEN** the server executes ticks every 4 hours, allowing players to queue actions at any time between ticks

### Requirement: Auto-submit on tick deadline
When a tick deadline is reached, all queued actions from each player SHALL be submitted for validation and resolution automatically. Players SHALL NOT be required to explicitly submit.

#### Scenario: Tick fires with queued actions
- **WHEN** tick deadline arrives and Player A has 3 queued actions
- **THEN** all 3 actions are collected, validated, and resolved as part of that tick

#### Scenario: Tick fires with no actions
- **WHEN** tick deadline arrives and a player has queued no actions
- **THEN** that player's turn is treated as a no-op and simulation proceeds normally

### Requirement: Deterministic simulation
Given identical game state and identical actions, the simulation SHALL always produce identical output regardless of execution speed or timing between ticks.

#### Scenario: Determinism across speeds
- **WHEN** the same game state and actions are simulated with a 100ms tick duration vs a 14400000ms tick duration
- **THEN** both simulations produce identical game states after the same number of ticks
