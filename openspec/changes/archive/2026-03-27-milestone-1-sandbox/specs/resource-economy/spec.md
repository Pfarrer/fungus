## ADDED Requirements

### Requirement: Resource generation
Generator nodes and root nodes SHALL produce resources each tick. The amount produced per tick SHALL be defined per node type in `NodeTypeConfig.productionPerTick`. Only connected nodes (reachable from root via edges) SHALL produce resources.

#### Scenario: Generator produces resources
- **WHEN** a tick executes and a player has a connected generator with productionPerTick of 3
- **THEN** the player's resource total increases by 3

#### Scenario: Multiple generators stack
- **WHEN** a player has 5 connected generators each producing 3 per tick
- **THEN** the player gains 15 resources that tick

#### Scenario: Disconnected generator does not produce
- **WHEN** a generator is not connected to the root node
- **THEN** the generator does not produce resources

### Requirement: Node build costs
Each node type SHALL have a resource cost to build, defined in `NodeTypeConfig.cost`. The cost SHALL be deducted from the player's resources at placement time. The root node SHALL have a cost of 0.

#### Scenario: Successful node purchase
- **WHEN** a player with 20 resources places a generator costing 15
- **THEN** the player's resources become 5 and the generator is placed

#### Scenario: Root costs nothing
- **WHEN** the game initializes and root nodes are auto-placed
- **THEN** no resources are deducted

### Requirement: Resource cap
Players SHALL have a maximum resource cap defined in `GameConfig.resourceCap`. Generated resources SHALL NOT cause a player's total to exceed this cap.

#### Scenario: Resources capped
- **WHEN** a player is at the cap of 500 and generators would produce 30
- **THEN** the player's resources remain at 500 (excess is lost)

#### Scenario: Resources below cap
- **WHEN** a player has 400 resources (cap 500) and generators produce 30
- **THEN** the player's resources become 430
