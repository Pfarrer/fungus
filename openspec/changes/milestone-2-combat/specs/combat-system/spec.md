## MODIFIED Requirements

### Requirement: Turret targeting
Turrets SHALL target the nearest enemy node or edge within their attack range. The attack range SHALL be defined per turret type in game configuration.

#### Scenario: Turret attacks nearest enemy
- **WHEN** a turret has sufficient resources, is connected to root, and an enemy node is within attack range
- **THEN** the turret deals damage to the nearest enemy node

#### Scenario: Turret attacks enemy edge
- **WHEN** a turret has sufficient resources, no enemy nodes are in range, but an enemy edge is within range
- **THEN** the turret deals damage to the nearest enemy edge

#### Scenario: No targets in range
- **WHEN** a turret is active but no enemy nodes or edges are within attack range
- **THEN** the turret consumes resources but deals no damage

### Requirement: Turret damage per tick
Each turret SHALL deal a fixed amount of damage per tick to its target, defined in game configuration. Damage SHALL be applied after targeting is resolved.

#### Scenario: Single turret damage
- **WHEN** a turret deals 3 damage per tick and targets an enemy node with 10 health
- **THEN** the enemy node's health becomes 7

#### Scenario: Multiple turrets focus same target
- **WHEN** two turrets both target the same enemy node, each dealing 3 damage, and the node has 10 health
- **THEN** the enemy node's health becomes 4

### Requirement: Shield damage reduction
Shield nodes SHALL reduce incoming damage to their parent and child nodes in the tree by a percentage defined in game configuration. Shield effect SHALL stack additively (e.g., two 20% shields on the same node provide 40% reduction).

#### Scenario: Shield reduces damage
- **WHEN** a node with a 20% shield receives 10 damage
- **THEN** the node takes 8 damage instead of 10

#### Scenario: Multiple shields stack
- **WHEN** a node has two shield neighbors providing 20% reduction each, and receives 10 damage
- **THEN** the node takes 6 damage (40% reduction)

### Requirement: Combat resolution order
Within a tick, combat SHALL resolve as: (1) turrets consume resources, (2) turrets select targets, (3) shield calculations reduce damage, (4) damage is applied to targets. All combat in a single tick SHALL be resolved before any node/edge removal.

#### Scenario: Damage applied before removal
- **WHEN** an enemy node takes lethal damage from two turrets in the same tick
- **THEN** the node is destroyed at the end of combat resolution (not mid-tick), and both turrets' damage is fully applied (no wasted damage from the second turret hitting a dead target)
