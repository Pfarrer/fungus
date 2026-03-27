## Why

The first playable version of Fungus must be a local sandbox where a single player can build node networks, see resources flow, and understand the core building loop. No server, no combat, no multiplayer — just the foundational mechanics: place nodes, connect them into trees, generate resources. This validates the game logic architecture and provides a visual prototype to iterate on.

## What Changes

- Set up TypeScript monorepo with three packages: `game` (pure logic), `server` (stub), `client` (PixiJS)
- Implement core game types: `Position`, `Node`, `Edge`, `NodeType`, `Player`, `GameState`
- Implement node placement: tree-structured networks, distance-limited connections, auto-connect to closest friendly node
- Implement resource economy: generators and root nodes produce resources per tick, resource cap, node build costs
- Implement local game loop: tick-based simulation running in the browser, no server needed
- Implement PixiJS client: render map, nodes, edges; node placement UI with type palette; HUD showing resources and tick count
- Include a default 2-player map configuration (though sandbox is single-player, the map defines spawn points and bounds)

## Capabilities

### New Capabilities

- `game-types`: Core type definitions shared across all packages
- `node-network`: Node placement, tree connectivity, distance-limited edges, placement validation
- `resource-economy`: Resource generation, consumption, build costs, resource cap
- `game-loop`: Local tick-based simulation engine (no networking)
- `map-config`: Map definition, spawn points, bounds, node type configs, default map
- `sandbox-client`: PixiJS rendering, node placement UI, HUD, local game loop integration

### Modified Capabilities

(none — new project)

## Impact

- New project: requires monorepo setup, TypeScript config, PixiJS dependency, Vitest setup
- `packages/game/` is the foundation everything else builds on
- `packages/server/` is a stub placeholder for milestone 3
- `packages/client/` is the PixiJS application
- All game logic must be pure functions (no I/O) to support both local and server execution
