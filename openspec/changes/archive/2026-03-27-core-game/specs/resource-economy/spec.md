## ADDED Requirements

### Requirement: Resource generation
Generator nodes and root nodes SHALL produce resources each tick. The amount produced per tick SHALL be defined per node type in the game configuration.

#### Scenario: Generator produces resources
- **WHEN** a tick executes and a player has a generator node
- **THEN** the player's resource total increases by the generator's production rate

#### Scenario: Multiple generators stack
- **WHEN** a player has 5 generators and each produces 2 resources per tick
- **THEN** the player gains 10 resources that tick

#### Scenario: Disconnected generator does not produce
- **WHEN** a generator is disconnected from the root node
- **THEN** the generator does not produce resources that tick

### Requirement: Resource consumption
Turret and shield nodes SHALL consume resources each tick. If the player has insufficient resources, the node SHALL NOT function (turrets do not fire, shields do not absorb) but the node SHALL remain alive.

#### Scenario: Turret fires with sufficient resources
- **WHEN** a tick executes, a player has 50 resources, and their turret costs 5 per tick
- **THEN** the player's resources decrease by 5 and the turret fires at enemies in range

#### Scenario: Turret inactive with insufficient resources
- **WHEN** a tick executes, a player has 2 resources, and their turret costs 5 per tick
- **THEN** the turret does not fire that tick but remains alive

#### Scenario: Disconnected combat node does not consume
- **WHEN** a turret is disconnected from the root node
- **THEN** the turret does not consume resources and does not function

### Requirement: Node build costs
Each node type SHALL have a resource cost to build. The cost SHALL be deducted from the player's resources at the time of placement.

#### Scenario: Successful node purchase
- **WHEN** a player with 20 resources places a generator costing 15
- **THEN** the player's resources become 5 and the generator is placed

#### Scenario: Cannot afford node
- **WHEN** a player with 10 resources attempts to place a turret costing 25
- **THEN** the action is rejected and resources remain unchanged

### Requirement: Resource cap
Players SHALL have a maximum resource cap defined in game configuration. Generated resources SHALL NOT exceed this cap.

#### Scenario: Resources capped
- **WHEN** a player is at the resource cap and generators produce more
- **THEN** the player's resources remain at the cap (excess is lost)
