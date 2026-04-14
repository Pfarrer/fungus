## Context

The game uses a tree-structured node network where players place nodes (generators, turrets, shields) connected to existing friendly nodes. Placement validation currently checks: node type restrictions, map bounds, position occupancy, connection range (`maxConnectionDistance`), and resource cost. There is no minimum distance between nodes, allowing placements arbitrarily close together.

The spatial layer (`packages/game/src/spatial.ts`) provides `euclideanDistance` and `findClosestFriendlyNode` helpers. The validation function (`packages/game/src/node-placement.ts`) runs checks sequentially and returns the first failure reason.

## Goals / Non-Goals

**Goals:**
- Enforce a configurable minimum Euclidean distance between any two nodes on the map (friendly or enemy)
- Make the minimum distance a map configuration parameter with a sensible default
- Provide clear rejection feedback when placement is too close

**Non-Goals:**
- Changing the existing connection range or tree structure rules
- Performance optimization for spatial queries (the node count per match is small)
- Per-node-type minimum distances

## Decisions

### 1. Add `minNodeDistance` to `MapConfig`

Add a `minNodeDistance: number` field to the `MapConfig` interface in `types.ts` and set a default value of `20` in `config.ts`.

**Rationale**: 20px gives meaningful spacing (5 nodes could fit across the 100px connection range) without being overly restrictive. Keeps the rule simple and configurable per map.

**Alternative considered**: A per-node-type minimum distance. Rejected to keep the first implementation simple; can be added later if needed.

### 2. Add a `findNearestNode` helper to `spatial.ts`

Create a function that finds the nearest node of any ownership to a given position. This is used to check minimum distance against all nodes, not just friendly ones.

**Rationale**: Reuses the existing `euclideanDistance` pattern. The occupied check already looks at all nodes for exact position match; this generalizes to a distance threshold.

### 3. Check order in `validatePlaceNode`

Insert the minimum distance check after the "occupied" check and before the "connection range" check. The full order becomes:
1. Root node rejection
2. Map bounds
3. Position occupied (exact match)
4. **Minimum distance to any node** (new)
5. Connection range (friendly node within `maxConnectionDistance`)
6. Node type config lookup
7. Player lookup
8. Resource cost

**Rationale**: The minimum distance check is a stricter version of the occupied check (distance > 0 vs distance >= `minNodeDistance`), so it logically follows it. Placing it before the connection range check means cheaper validation failures are caught first.

## Risks / Trade-offs

- **[Default value may need tuning]** → The default of 20px can be adjusted in the map config; no code change needed for different maps.
- **[Client placement preview needs updating]** → The client's placement preview logic will need to show "too close" feedback. This is a client-side concern but the validation result already provides a reason string.
