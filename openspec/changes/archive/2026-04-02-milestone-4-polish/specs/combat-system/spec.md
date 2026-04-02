## MODIFIED Requirements

### Requirement: Shield damage reduction
Shield nodes SHALL reduce incoming damage to their parent and child nodes in the tree by a percentage defined in game configuration. Shield effect SHALL stack additively up to the `maxShieldReductionPercent` cap. Shield nodes SHALL visually indicate which nodes they protect.

#### Scenario: Shield reduces damage
- **WHEN** a node with a 20% shield receives 10 damage
- **THEN** the node takes 8 damage instead of 10

#### Scenario: Multiple shields stack
- **WHEN** a node has two shield neighbors providing 20% reduction each, and receives 10 damage
- **THEN** the node takes 6 damage (40% reduction)

#### Scenario: Shield reduction capped
- **WHEN** a node has shields providing 120% total reduction and maxShieldReductionPercent is 90
- **THEN** the node takes 1 damage from a 10 damage attack (90% reduction)
