## Context

The game map is currently a uniform 800x600 rectangle with no spatial variety. `MapConfig` defines width, height, spawn points, max connection distance, and node type configs. Node placement validation (`validatePlaceNode`) checks bounds, occupation, connection range, and cost — but never checks what's "under" the node. The renderer draws a flat background color.

The terrain system adds a grid-based terrain layer where each cell has a type. Some types block construction entirely (obstacles), some restrict which node types can be built (special undergrounds), and the default type places no restrictions.

## Goals / Non-Goals

**Goals:**
- Define terrain types and a terrain grid within the existing `MapConfig` structure
- Block node placement on obstacle cells
- Restrict certain node types to certain terrain types (underground-specific placement)
- Render terrain visually on the map
- Keep the system data-driven so terrain is configured per-map, not hardcoded

**Non-Goals:**
- New node types (explicitly out of scope)
- Procedural terrain generation (terrain is defined in map config)
- Terrain that changes during gameplay (static terrain)
- Movement or pathfinding around obstacles (only placement is blocked)
- Terrain effects on combat, resources, or other gameplay beyond placement restrictions

## Decisions

### 1. Grid-based terrain representation

**Decision**: Represent terrain as a 2D grid of cells, each with a `TerrainType` string. The grid resolution is independent of pixel coordinates — each cell covers a square area of the map.

**Rationale**: The map is continuous (pixel-based positions), but terrain is inherently spatial and regional. A grid is the simplest representation that maps well to both validation (point → cell lookup) and rendering (fill rectangles by type).

**Alternatives**:
- *Polygon regions*: More flexible shapes but far more complex collision detection and rendering. Overkill for this use case.
- *Per-pixel terrain map*: Unnecessarily large data for what's essentially a handful of terrain zones.

### 2. Cell size and grid dimensions

**Decision**: Use a configurable cell size (e.g., 50x50 pixels). The grid dimensions are derived: `cols = ceil(width / cellSize)`, `rows = ceil(height / cellSize)`.

**Rationale**: A cell size of 50 on an 800x600 map yields a 16x12 grid (192 cells) — manageable data size, coarse enough to create meaningful regions, fine enough for interesting shapes. Making it configurable allows different maps to have different granularity.

### 3. Terrain type definitions

**Decision**: Define terrain types as a union: `"ground" | "water" | "minerals" | "rock"`. Each terrain type has a `buildable` flag and an optional `allowedNodeTypes` list. Obstacles (rock) have `buildable: false`. Special undergrounds have `buildable: true` with `allowedNodeTypes` restricting which nodes can go there. `ground` has no restrictions.

**Rationale**: A simple allow-list per terrain type keeps validation straightforward. Adding `allowedNodeTypes: null` means "all types allowed" (default ground behavior).

**Alternatives**:
- *Tag-based system*: Nodes and terrain both have tags, and placement requires matching tags. More flexible but over-engineered for the current scope.

### 4. Placement validation integration

**Decision**: Add a terrain check to `validatePlaceNode` that: (1) resolves the target position to a terrain cell, (2) checks if the cell is buildable, (3) if the cell has `allowedNodeTypes`, verifies the node type is in the list.

**Rationale**: Minimal change to the existing validation pipeline — one new check added in sequence with the existing checks.

### 5. Default map terrain

**Decision**: The default map config includes a hand-crafted terrain grid with a mix of ground, water, minerals, and rock cells creating interesting strategic regions around and between spawn points.

**Rationale**: A default map with no terrain defeats the purpose. A hand-crafted layout ensures the default experience showcases the feature well.

### 6. Terrain rendering

**Decision**: Add a terrain rendering pass in the renderer that draws filled rectangles for each cell before the map background border. Use distinct colors per terrain type. Obstacles get a distinct pattern or darker fill.

**Rationale**: Visual feedback is essential for players to make terrain-informed decisions. Drawing cells as filled rectangles is efficient with Pixi.js `Graphics`.

## Risks / Trade-offs

- **Grid resolution vs. precision**: A 50px cell size means nodes near cell boundaries may feel slightly off. → Mitigation: Use the cell the node center falls in. For most node sizes (radius 8-12), this is accurate enough.
- **Terrain data size in config**: A 16x12 grid is 192 entries, manageable in JSON. Larger maps with finer grids could bloat config. → Mitigation: Start with 50px cells. Can add RLE or sparse encoding later if needed.
- **Backward compatibility**: Existing maps/scenarios without terrain data still need to work. → Mitigation: If no terrain grid is provided, treat the entire map as `ground` (no restrictions).
