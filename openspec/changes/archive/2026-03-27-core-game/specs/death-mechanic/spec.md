## ADDED Requirements

### Requirement: Disconnected subtree detection
After each tick's combat resolution, the system SHALL detect any nodes that are no longer connected (via edges) to their player's root node. These nodes and their edges form a disconnected subtree.

#### Scenario: Edge destroyed causing disconnection
- **WHEN** an edge between two nodes is destroyed and one of the resulting subtrees does not contain the root
- **THEN** all nodes in the rootless subtree are marked as disconnected

#### Scenario: Node destroyed causing disconnection
- **WHEN** a non-leaf node is destroyed and its children are no longer connected to the root
- **THEN** all disconnected descendant nodes are marked as disconnected

### Requirement: Gradual death of disconnected nodes
Disconnected nodes SHALL lose health each tick. The death rate SHALL be defined in game configuration. When a disconnected node's health reaches zero, it is destroyed along with its edges.

#### Scenario: Disconnected node loses health
- **WHEN** a disconnected node has 20 health and the death rate is 5 health per tick
- **THEN** after one tick the node has 15 health, after three ticks it has 5 health, and after four ticks it is destroyed

#### Scenario: Reconnection stops death
- **WHEN** a disconnected node at 12 health is reconnected to the root (e.g., a player builds a new node bridging the gap)
- **THEN** the node stops losing health and resumes normal function

### Requirement: Cascading disconnection
When a disconnected node is destroyed and has children, those children SHALL also become disconnected and SHALL begin dying.

#### Scenario: Cascading death
- **WHEN** a disconnected node dies and had two child nodes
- **THEN** both children are now disconnected and begin losing health per tick

### Requirement: Root node destruction ends the game
When a player's root node is destroyed, that player SHALL lose the match immediately.

#### Scenario: Root destroyed
- **WHEN** a player's root node health reaches zero
- **THEN** the match ends and the opposing player wins

#### Scenario: Root disconnected
- **WHEN** the root node is disconnected from itself (impossible by definition, but the root itself can only be destroyed, not disconnected)
- **THEN** N/A — the root can only be destroyed via damage
