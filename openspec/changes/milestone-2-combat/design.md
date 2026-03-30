## Context

Milestone 1 established the building loop: resource generation, node placement with tree-structured networks, and tick-based simulation. The game currently supports `root` and `generator` node types with health bars rendered on all nodes but no combat mechanics.

The codebase is structured as:
- `packages/game/`: Pure TypeScript game engine with types, spatial math, node placement, resource economy, and game loop
- `packages/client/`: PixiJS-based sandbox client with rendering, camera, node placement UI, and tick controls

All game logic is deterministic (pure functions, no randomness). The client calls `simulateTick` directly with no server.

## Goals / Non-Goals

**Goals:**
- Add `turret` and `shield` node types with combat stats (damage, attack range, shield reduction)
- Implement per-tick combat resolution: turrets target nearest enemy, shields reduce damage, damage applied
- Implement death mechanic: disconnected subtree detection, gradual health drain, cascading death, root destruction = game over
- Add pre-built scenario system: JSON files defining enemy node layouts loadable from sandbox UI
- Add debug overlay to client showing connection status and health values

**Non-Goals:**
- AI-controlled opponents (scenarios are static, player-vs-enemy-structure only)
- Server-side multiplayer (determinism is maintained for future multiplayer)
- Weapon variety or targeting strategies beyond "nearest enemy"
- Animated combat effects or particle systems

## Decisions

### Combat resolution is a pure function in game loop

**Decision:** Add `resolveCombat(state, config)` and `resolveDeath(state, config)` as pure functions called within `simulateTick`, matching the existing pattern of `generateResources`.

**Alternatives considered:**
- Separate combat system with event emitters — rejected: adds complexity without benefit in a deterministic, single-threaded model
- Combat as a pre-tick phase — rejected: the spec requires combat to happen within the tick after actions are processed

### Turret targeting: nearest enemy node/edge by Euclidean distance

**Decision:** Turrets find the nearest enemy node within attack range first. If no enemy node is in range, target the nearest point on any enemy edge (closest midpoint of edge endpoints to the turret). Each turret picks one target per tick.

**Rationale:** Simple, deterministic, easy to reason about. Edges as targets allow attacking connections to disconnect enemy subtrees.

### Shield stacking is additive based on adjacency in the tree

**Decision:** A node's effective shield reduction equals the sum of `shieldReductionPercent` from all shield nodes that are direct children or the parent in the tree. Capped at 90% to prevent invulnerability.

**Rationale:** Tree adjacency is natural (edges define the network). Additive stacking rewards investing in shields but the cap prevents degenerate strategies.

### Death uses a per-tick health drain, not instant removal

**Decision:** Disconnected nodes lose `deathRatePerTick` health each tick. When health reaches 0, the node and its edges are removed, and children cascade to disconnected status.

**Rationale:** Gives the player a window to reconnect broken branches, creating tactical decisions during combat.

### Scenarios are JSON files with a loader function

**Decision:** Scenario files live in `packages/game/src/scenarios/` as `.json` files. Each defines a list of enemy nodes (id, type, position, parentId) and optionally edges. A `loadScenario(config, scenarioName)` function merges the scenario nodes into the initial game state.

**Alternatives considered:**
- Scenarios as TypeScript modules — rejected: JSON is easier to create and edit without recompilation
- Scenarios embedded in config — rejected: separates scenario data from game config concerns

### Edge health comes from a global config, not per-edge-type

**Decision:** Add `edgeHealth` to `MapConfig`. All edges created at placement use this value.

**Rationale:** Edges don't have types, so a single global value is simplest.

### Debug overlay is a togglable HTML overlay, not Pixi graphics

**Decision:** The debug overlay renders as HTML elements positioned over the canvas, toggled via a keyboard shortcut (pressing 'D'). Shows connection status (green/red dot) and numeric health values next to each node.

**Alternatives considered:**
- Pixi-based overlay — rejected: text rendering in Pixi is heavier and less readable than HTML
- Always-visible — rejected: clutters the view during normal play

## Risks / Trade-offs

- **[Turret targeting closest node is simplistic]** → Players may find strategies where they "hide" valuable nodes behind expendable ones. Acceptable for Milestone 2; future milestones can add targeting preferences.
- **[Shield cap of 90% is a magic number]** → Needs playtesting. Configurable via game config so it can be tuned.
- **[Edge targeting requires point-to-line-segment distance]** → Slightly more complex math than node targeting, but standard computational geometry.
- **[Scenario JSON doesn't validate itself]** → Malformed scenario files could cause runtime errors. The loader should validate structure.
