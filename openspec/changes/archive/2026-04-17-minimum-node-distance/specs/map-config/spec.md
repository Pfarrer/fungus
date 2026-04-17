## MODIFIED Requirements

### Requirement: Map configuration
The map SHALL be defined by a configuration object containing: width, height, max connection distance, min node distance, spawn points (per player), node type definitions (cost, health, production/consumption rates), and resource cap.

#### Scenario: Loading a map configuration
- **WHEN** the server starts a match
- **THEN** it loads a map configuration that defines all gameplay parameters including minNodeDistance

### Requirement: Default map
The game SHALL ship with at least one default map configuration suitable for a 2-player match. The default configuration SHALL specify:
- Map: 800x600 pixels
- Max connection distance: 100 pixels
- Min node distance: 20 pixels
- Spawn points: (50, 300) and (750, 300)
- Tick duration: 1000ms
- Resource cap: 500
- Root: cost 0, health 100, production 1/tick
- Generator: cost 15, health 30, production 3/tick
- Turret: cost 25, health 20, consumption 2/tick, damage 5/tick, range 120
- Shield: cost 20, health 25, consumption 1/tick, reduction 20%
- Edge health: 20

#### Scenario: Default map used when none specified
- **WHEN** a match is created without specifying a map
- **THEN** the default map configuration is used with the above values including minNodeDistance of 20

#### Scenario: Balance values are tuned for competitive play
- **WHEN** a match is played with default config
- **THEN** resource production and node costs create meaningful economic decisions (a generator pays for itself in ~5 ticks, a turret kills a root in ~20 ticks unshielded)
