## MODIFIED Requirements

### Requirement: Resource generation
Generator nodes and root nodes SHALL produce resources each tick. The amount produced per tick SHALL be defined per node type in the game configuration. Generated resources are temporary and exist only within the tick for consumption and construction funding. After funding constructions, remaining resources SHALL be discarded and the player's resource total SHALL be set to 0.

#### Scenario: Generator produces resources
- **WHEN** a tick executes and a player has a generator node
- **THEN** the player's resource total increases by the generator's production rate

#### Scenario: Multiple generators stack
- **WHEN** a player has 5 generators and each produces 2 resources per tick
- **THEN** the player gains 10 resources that tick

#### Scenario: Disconnected generator does not produce
- **WHEN** a generator is disconnected from the root node
- **THEN** the generator does not produce resources that tick

#### Scenario: Surplus discarded after construction funding
- **WHEN** a tick completes and a player has 3 remaining resources after consumption and construction funding
- **THEN** the player's resource total is set to 0

### Requirement: Resource consumption
Turret and shield nodes SHALL consume resources each tick. If the player has insufficient resources, the node SHALL NOT function (turrets do not fire, shields do not absorb) but the node SHALL remain alive. Consumption is deducted from generated resources before construction funding.

#### Scenario: Turret fires with sufficient resources
- **WHEN** a tick executes, a player has 50 generated resources, and their turret costs 5 per tick
- **THEN** the player's resources decrease by 5 and the turret fires at enemies in range

#### Scenario: Turret inactive with insufficient resources
- **WHEN** a tick executes, a player has 2 generated resources, and their turret costs 5 per tick
- **THEN** the turret does not fire that tick but remains alive

#### Scenario: Disconnected combat node does not consume
- **WHEN** a turret is disconnected from the root node
- **THEN** the turret does not consume resources and does not function

### Requirement: Node build costs
Each node type SHALL have a resource cost to build. The cost SHALL NOT be deducted at placement time. Instead, the cost SHALL be recorded as the totalCost of a construction entry in the player's construction queue. Resources SHALL be allocated to constructions over multiple ticks from the player's surplus. The root node SHALL have a cost of 0 and SHALL be placed directly without entering the construction queue.

#### Scenario: Building queued with cost
- **WHEN** a player places a generator costing 15
- **THEN** a construction entry is created with totalCost 15 and funded 0, and no resources are deducted

#### Scenario: Root costs nothing and bypasses queue
- **WHEN** the game initializes and root nodes are auto-placed
- **THEN** no resources are deducted and no construction entry is created

#### Scenario: No upfront resource check required
- **WHEN** a player with 0 resources places a turret costing 25
- **THEN** the construction is queued (resources are not checked at placement time)

## REMOVED Requirements

### Requirement: Resource cap
**Reason**: The static resource cap is replaced by the per-tick surplus model. Resources are discarded after construction funding, making a cap unnecessary.
**Migration**: Remove `resourceCap` from `GameConfig`. Player resources are always 0 at the end of each tick. Surplus that exceeds construction needs is discarded automatically.
