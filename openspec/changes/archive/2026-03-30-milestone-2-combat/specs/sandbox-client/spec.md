## MODIFIED Requirements

### Requirement: Node rendering
Nodes SHALL be rendered as distinct visual elements differentiated by type. Each node type SHALL have a unique visual style. Each node SHALL display its current health as a health bar.

#### Scenario: Root node appearance
- **WHEN** a root node is rendered
- **THEN** it appears with a distinct visual style (e.g., larger circle, different color) from generators

#### Scenario: Generator appearance
- **WHEN** a generator node is rendered
- **THEN** it appears as a styled circle at its position

#### Scenario: Turret appearance
- **WHEN** a turret node is rendered
- **THEN** it appears with a distinct visual style (e.g., orange/yellow) differentiated from other node types

#### Scenario: Shield appearance
- **WHEN** a shield node is rendered
- **THEN** it appears with a distinct visual style (e.g., blue/cyan) differentiated from other node types

#### Scenario: Health bar display
- **WHEN** any node is rendered
- **THEN** a health bar is shown indicating current health relative to max health

### Requirement: Edge rendering
Edges SHALL be rendered as lines connecting parent and child nodes. Edges SHALL visually connect node centers. Edge color SHALL reflect health status (full health vs damaged).

#### Scenario: Edge between nodes
- **WHEN** two nodes are connected by an edge
- **THEN** a line is drawn between the center positions of both nodes

#### Scenario: Damaged edge
- **WHEN** an edge has less than full health
- **THEN** the edge line color changes to indicate damage (e.g., red tint proportional to damage)

## ADDED Requirements

### Requirement: Debug overlay
The client SHALL provide a toggleable debug overlay (activated by pressing 'D') that displays:
- Connection status indicator (green dot for connected, red dot for disconnected) next to each node
- Numeric health values (current/max) next to each node
- Attack range circles for turret nodes
- Shield range indicators for shield nodes

#### Scenario: Toggle debug overlay
- **WHEN** the player presses 'D'
- **THEN** the debug overlay appears showing connection status and health values for all nodes

#### Scenario: Toggle off debug overlay
- **WHEN** the player presses 'D' while the debug overlay is visible
- **THEN** the debug overlay is hidden

#### Scenario: Disconnected node in debug
- **WHEN** the debug overlay is active and a node is disconnected
- **THEN** a red indicator appears next to that node

#### Scenario: Turret range in debug
- **WHEN** the debug overlay is active and a turret exists
- **THEN** a circle shows the turret's attack range

### Requirement: Scenario loader UI
The client SHALL provide a scenario loader that lists available scenarios and allows the player to load one. When a scenario is loaded, the game state is reset with the scenario's enemy structure.

#### Scenario: List scenarios
- **WHEN** the sandbox client is open and the player opens the scenario loader
- **THEN** a list of available scenarios is displayed with names and descriptions

#### Scenario: Load scenario
- **WHEN** the player selects a scenario from the list
- **THEN** the game state is reset and the scenario's enemy nodes are placed on the map

#### Scenario: Scenario loader UI element
- **WHEN** the sandbox client is running
- **THEN** a "Scenarios" button or tab is accessible from the UI
