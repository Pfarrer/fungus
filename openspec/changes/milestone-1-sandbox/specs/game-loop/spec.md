## ADDED Requirements

### Requirement: Tick-based simulation
The game SHALL advance in discrete ticks. Each tick SHALL: collect queued player actions, validate and apply them sequentially, generate resources, and produce a new game state.

#### Scenario: Normal tick execution
- **WHEN** a tick executes with queued actions and connected generators
- **THEN** actions are validated/applied first, then resources are generated, then the new state is returned

#### Scenario: Empty tick
- **WHEN** a tick executes with no queued actions
- **THEN** resource generation still occurs

### Requirement: Sequential action validation
Actions within a tick SHALL be processed sequentially in queue order. Each action is validated and applied against the game state resulting from the previous action.

#### Scenario: Actions build on each other
- **WHEN** a player queues "place generator at A" (valid) then "place generator at B" which is only in range of A
- **THEN** A is placed first, then B is validated against the state including A and succeeds

#### Scenario: Failed action does not block later ones
- **WHEN** a player queues 3 actions and the 2nd fails validation
- **THEN** the 1st is applied, the 2nd is skipped, the 3rd is validated against the state after the 1st

### Requirement: Local tick modes
The sandbox SHALL support two tick modes:
- **Auto**: ticks run automatically at a configurable interval
- **Manual**: player clicks to advance one tick at a time

#### Scenario: Auto mode
- **WHEN** auto mode is active with a 1-second interval
- **THEN** a tick executes every 1 second without player input

#### Scenario: Manual mode
- **WHEN** manual mode is active and the player clicks "next tick"
- **THEN** exactly one tick executes

#### Scenario: Mode switching
- **WHEN** the player switches from auto to manual mode
- **THEN** automatic ticking stops and only manual advances are processed
