## Why

The map is a flat, uniform rectangle with no spatial variety. Every position is functionally identical, so gameplay decisions boil down to distance from the root and proximity to the enemy. Adding terrain types and obstacles creates meaningful spatial strategy — players must route around obstacles, compete for valuable terrain, and adapt their network shape to the map layout.

## What Changes

- Introduce a **terrain layer** on the map composed of cells, each assigned a terrain type (e.g., `ground`, `water`, `minerals`, `rock`).
- Terrain data is defined in `MapConfig` and loaded with the rest of the map configuration.
- **Obstacles** (e.g., `rock`) block node placement entirely — no node can be built on an obstacle cell.
- **Special undergrounds** (e.g., `water`, `minerals`) do not block placement but restrict which node types can be built on them. For example, generators might only be placeable on `minerals` terrain, providing areas of special economic interest.
- The placement validation function checks terrain compatibility before allowing a node placement.
- The renderer displays terrain visually so players can see underground types and obstacles at a glance.
- New node types are explicitly out of scope — only the terrain system and placement restrictions on existing node types are introduced.

## Capabilities

### New Capabilities
- `terrain-system`: Defines terrain types, terrain map data, obstacle blocking, underground-specific placement restrictions, and terrain rendering.

### Modified Capabilities
- `map-config`: Map configuration now includes a terrain grid alongside existing dimensions and spawn points.
- `node-network`: Placement validation must check terrain compatibility for the target cell.

## Impact

- **types.ts**: New `TerrainType`, `TerrainCell`, and terrain-related additions to `MapConfig`.
- **config.ts**: Default map config gains a terrain grid (or terrain generation parameters).
- **node-placement.ts**: `validatePlaceNode` adds terrain checks — obstacle blocking and underground-type restrictions.
- **renderer.ts**: New terrain rendering pass beneath existing map rendering.
- **map-config spec**: Requirements updated to cover terrain grid configuration.
- **node-network spec**: Requirements updated to cover terrain-based placement rules.
