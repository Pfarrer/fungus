## MODIFIED Requirements

### Requirement: Tick-based simulation
The game SHALL advance in discrete ticks. Each tick SHALL collect all queued player actions, validate them, apply them to game state, simulate one step of game logic, and produce a new game state. The simulation order within a tick SHALL be: (1) process actions, (2) generate resources, (3) resolve combat, (4) resolve death.

#### Scenario: Normal tick execution
- **WHEN** a tick is triggered
- **THEN** the system collects queued actions from all players, validates each action, applies valid actions to game state, runs simulation (resources, combat, death), and produces a new game state

#### Scenario: Empty tick
- **WHEN** a tick triggers and no player has queued any actions
- **THEN** the system still advances simulation (resources generate, combat resolves, death timers tick)

#### Scenario: Tick order is deterministic
- **WHEN** the same game state and actions are processed
- **THEN** the tick order is always: actions → resources → combat → death

### Requirement: Deterministic simulation
Given identical game state and identical actions, the simulation SHALL always produce identical output regardless of execution speed or timing between ticks.

#### Scenario: Determinism across speeds
- **WHEN** the same game state and actions are simulated with a 100ms tick duration vs a 14400000ms tick duration
- **THEN** both simulations produce identical game states after the same number of ticks
