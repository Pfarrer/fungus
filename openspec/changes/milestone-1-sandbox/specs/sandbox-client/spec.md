## ADDED Requirements

### Requirement: Map rendering
The client SHALL render the flat map as a rectangular area with visible boundaries. The map SHALL be centered in the viewport by default.

#### Scenario: Map displays on load
- **WHEN** the client starts
- **THEN** the map is rendered as a filled rectangle with distinct borders showing the playable area

### Requirement: Node rendering
Nodes SHALL be rendered as distinct visual elements differentiated by type. Root nodes SHALL appear larger or differently styled than generators. Each node SHALL display its current health as a health bar.

#### Scenario: Root node appearance
- **WHEN** a root node is rendered
- **THEN** it appears with a distinct visual style (e.g., larger circle, different color) from generators

#### Scenario: Generator appearance
- **WHEN** a generator node is rendered
- **THEN** it appears as a styled circle at its position

#### Scenario: Health bar display
- **WHEN** any node is rendered
- **THEN** a health bar is shown indicating current health relative to max health

### Requirement: Edge rendering
Edges SHALL be rendered as lines connecting parent and child nodes. Edges SHALL visually connect node centers.

#### Scenario: Edge between nodes
- **WHEN** two nodes are connected by an edge
- **THEN** a line is drawn between the center positions of both nodes

### Requirement: Camera pan and zoom
The client SHALL support panning the viewport by click-dragging and zooming via scroll wheel or pinch gesture.

#### Scenario: Pan
- **WHEN** the player click-drags on the map
- **THEN** the viewport scrolls in the drag direction

#### Scenario: Zoom
- **WHEN** the player scrolls the mouse wheel
- **THEN** the viewport zooms in or out centered on the cursor position

### Requirement: Node placement UI
The client SHALL provide a node type palette (showing available node types and their costs). When a type is selected and the player clicks the map, a `PlaceNode` action SHALL be queued for the next tick. The client SHALL show a visual indicator of the max connection range around the cursor.

#### Scenario: Select generator
- **WHEN** the player clicks "Generator" in the palette
- **THEN** the generator type is selected and the cursor shows a placement range circle

#### Scenario: Place node on click
- **WHEN** a node type is selected and the player clicks within the map
- **THEN** a PlaceNode action is queued and a visual preview of the node appears at the clicked position

### Requirement: Action preview
The client SHALL indicate whether a placement would be valid before the player clicks, using visual feedback (e.g., green range circle if valid, red if invalid).

#### Scenario: Valid placement preview
- **WHEN** the cursor is within range of a friendly node and in bounds
- **THEN** the range circle is green

#### Scenario: Invalid placement preview
- **WHEN** the cursor is out of range of all friendly nodes or out of bounds
- **THEN** the range circle is red

### Requirement: HUD
The client SHALL display: current player resources, current tick number, tick mode (auto/manual), and tick countdown timer (in auto mode).

#### Scenario: HUD displays resources
- **WHEN** the player has 45 resources
- **THEN** the HUD shows "Resources: 45"

#### Scenario: HUD displays tick
- **WHEN** the game is at tick 23
- **THEN** the HUD shows "Tick: 23"
