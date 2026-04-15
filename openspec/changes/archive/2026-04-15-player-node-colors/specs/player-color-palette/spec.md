## ADDED Requirements

### Requirement: Active player uses fixed palette
The system SHALL render the active player's nodes using a fixed color palette. The active player's palette SHALL NOT change based on player slot assignment.

#### Scenario: Active player sees consistent colors
- **WHEN** the active player is player-1 in one match and player-2 in another
- **THEN** their own nodes use the same colors in both matches

### Requirement: Opponent uses distinct palette
The system SHALL render all non-active-player nodes using a palette that is visually distinct from the active player's palette. The two palettes SHALL be distinguishable at a glance.

#### Scenario: Opponent nodes are visually different
- **WHEN** a match contains both the active player's nodes and an opponent's nodes
- **THEN** all opponent nodes use colors from a palette that differs from the active player's palette

### Requirement: Node types remain distinguishable within each palette
Within each player's palette, the system SHALL render different node types (root, generator, turret, shield) with visually distinct colors or shades so that node type can be identified regardless of player ownership.

#### Scenario: Generator vs turret for active player
- **WHEN** the active player has both a generator and a turret on the map
- **THEN** the two node types have different colors within the active player's palette

#### Scenario: Generator vs turret for opponent
- **WHEN** the opponent has both a generator and a turret on the map
- **THEN** the two node types have different colors within the opponent's palette

### Requirement: Player-aware edge coloring
The system SHALL render edges using the color palette of the player who owns the connected nodes. All edges SHALL use the owning player's edge color rather than a single global color.

#### Scenario: Active player edges use self palette
- **WHEN** an edge connects two of the active player's nodes
- **THEN** the edge is rendered in the active player's edge color

#### Scenario: Opponent edges use opponent palette
- **WHEN** an edge connects two of the opponent's nodes
- **THEN** the edge is rendered in the opponent's edge color

### Requirement: Player-aware visual effects
Visual effects (node death particles, damage flashes, ghost nodes) SHALL use colors from the palette of the player who owns the affected node.

#### Scenario: Node death uses owner's palette
- **WHEN** a node owned by the opponent is destroyed
- **THEN** the death particle effect uses the opponent's palette color for that node type

#### Scenario: Ghost node uses active player palette
- **WHEN** the active player places a pending node
- **THEN** the ghost preview renders in the active player's palette color for that node type

### Requirement: Placement preview uses active player palette
The placement preview (hover indicator) SHALL render in the active player's palette colors.

#### Scenario: Preview shows active player color
- **WHEN** the active player hovers over a valid placement position with a node type selected
- **THEN** the preview circle uses the active player's palette color for that node type
