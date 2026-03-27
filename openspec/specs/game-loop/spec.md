# game-loop Specification

## Purpose
Defines tick-based simulation that advances game state in discrete steps.

## Requirements
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

### Requirement: Sequential action validation
Actions within a tick SHALL be processed sequentially in queue order. Each action is validated and applied against the game state resulting from the previous action.

#### Scenario: Actions build on each other
- **WHEN** a player queues "place generator at A" (valid) then "place generator at B" which is only in range of A
- **THEN** A is placed first, then B is validated against the state including A and succeeds

#### Scenario: Failed action does not block later ones
- **WHEN** a player queues 3 actions and the 2nd fails validation
- **THEN** the 1st is applied, the 2nd is skipped, the 3rd is validated against the state after the 1st

### Requirement: Local tick modes (sandbox mode)
The sandbox SHALL support two tick modes:
- **Auto**: ticks run automatically at a configurable interval (default 1 second)
- **Manual**: player clicks to advance one tick at a time (useful for debugging)

#### Scenario: Auto mode
- **WHEN** auto mode is active with a 1-second interval
- **THEN** a tick executes every 1 second without player input

#### Scenario: Manual mode
- **WHEN** manual mode is active and the player clicks "next tick"
- **THEN** exactly one tick executes

#### Scenario: Mode switching
- **WHEN** the player switches from auto to manual mode
- **THEN** automatic ticking stops and only manual advances are processed

### Requirement: Deterministic simulation
Given identical game state and identical actions, the simulation SHALL always produce identical output regardless of execution speed or timing between ticks.

#### Scenario: Determinism across speeds
- **WHEN** the same game state and actions are simulated with a 100ms tick duration vs a 14400000ms tick duration
- **THEN** both simulations produce identical game states after the same number of ticks

