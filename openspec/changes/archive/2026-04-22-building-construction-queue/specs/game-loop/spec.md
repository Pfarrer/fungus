## MODIFIED Requirements

### Requirement: Tick-based simulation
The game SHALL advance in discrete ticks. Each tick SHALL collect all queued player actions, validate them, apply them to game state, simulate one step of game logic, and produce a new game state. The simulation order within a tick SHALL be: (1) process actions (queue constructions), (2) generate resources, (3) consume resources (turret/shield upkeep), (4) fund constructions from surplus, (5) activate completed constructions, (6) resolve combat, (7) resolve death.

#### Scenario: Normal tick execution
- **WHEN** a tick is triggered
- **THEN** the system collects queued actions, queues constructions, generates resources, consumes upkeep, funds constructions from surplus, activates completed buildings, resolves combat, resolves death, and produces a new game state

#### Scenario: Empty tick
- **WHEN** a tick triggers and no player has queued any actions
- **THEN** the system still advances simulation (resources generate, consumption runs, constructions fund, combat resolves, death timers tick)

#### Scenario: Tick order is deterministic
- **WHEN** the same game state and actions are processed
- **THEN** the tick order is always: actions → generate resources → consume resources → fund constructions → activate completions → combat → death

#### Scenario: Completed building participates in combat same tick
- **WHEN** a turret construction completes during the fund-constructions step
- **THEN** the turret is active on the map and participates in the combat step of the same tick

### Requirement: Deterministic simulation
Given identical game state and identical actions, the simulation SHALL always produce identical output regardless of execution speed or timing between ticks. Construction funding order and surplus sharing SHALL be deterministic based on queue order.

#### Scenario: Determinism across speeds
- **WHEN** the same game state and actions are simulated with a 100ms tick duration vs a 14400000ms tick duration
- **THEN** both simulations produce identical game states after the same number of ticks

#### Scenario: Deterministic surplus sharing
- **WHEN** a player has 7 surplus and 3 constructions (totalCost 5 each)
- **THEN** the first construction always receives 3, the second always receives 2, and the third always receives 2, regardless of execution environment
