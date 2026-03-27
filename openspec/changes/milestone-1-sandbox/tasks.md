## 1. Project Scaffolding

- [ ] 1.1 Initialize monorepo with npm workspaces: root `package.json`, shared `tsconfig.json` with strict mode
- [ ] 1.2 Scaffold `packages/game/` with `package.json`, `tsconfig.json`, `src/index.ts` — no I/O dependencies
- [ ] 1.3 Scaffold `packages/server/` as a stub (placeholder `package.json` and `tsconfig.json` for future use)
- [ ] 1.4 Scaffold `packages/client/` with `package.json`, `tsconfig.json`, `src/index.ts`
- [ ] 1.5 Install PixiJS in `packages/client/`
- [ ] 1.6 Set up Vitest at root with shared config, add `test` script to root `package.json`
- [ ] 1.7 Verify `npm run build` and `npm run test` work at root level

## 2. Game Types and Configuration

- [ ] 2.1 Define all core types in `packages/game/src/types.ts`: Position, Node, Edge, NodeType, Player, GameState, GameAction, MapConfig, NodeTypeConfig, GameConfig
- [ ] 2.2 Export types from `packages/game/src/index.ts`
- [ ] 2.3 Create `packages/game/src/config.ts` with the default GameConfig (800x600 map, spawn points, node stats)
- [ ] 2.4 Create `packages/game/src/initial-state.ts` — `createInitialState(config)` that sets up players with root nodes at spawn points
- [ ] 2.5 Unit tests for initial state creation (correct spawn points, root nodes, starting resources)

## 3. Node Network Logic

- [ ] 3.1 Implement `euclideanDistance(a: Position, b: Position): number` in `packages/game/src/spatial.ts`
- [ ] 3.2 Implement `findClosestFriendlyNode(state, playerId, position): Node | null` — finds nearest friendly node within max connection distance
- [ ] 3.3 Implement `validatePlaceNode(state, playerId, nodeType, position): { valid: boolean, reason?: string }` — checks range, occupancy, bounds, resources, not root type
- [ ] 3.4 Implement `placeNode(state, playerId, nodeType, position): GameState` — creates node, creates edge to closest friendly, deducts cost
- [ ] 3.5 Unit tests: within range, out of range, occupied, out of bounds, insufficient resources, root placement rejected, correct parent assignment

## 4. Resource Economy Logic

- [ ] 4.1 Implement `getConnectedNodes(state, playerId): Node[]` — BFS from root, returns all reachable nodes
- [ ] 4.2 Implement `generateResources(state, config): GameState` — sum production from connected generators and roots per player, enforce cap
- [ ] 4.3 Unit tests: single generator, multiple generators, disconnected generator produces nothing, resource cap enforced, generators below cap stack

## 5. Game Loop

- [ ] 5.1 Implement `processActions(state, actions: GameAction[], config): GameState` — validate and apply actions sequentially per player
- [ ] 5.2 Implement `simulateTick(state, playerActions: Map<string, GameAction[]>, config): GameState` — full tick: process actions, generate resources, increment tick counter
- [ ] 5.3 Unit tests: empty tick, single action, multiple actions sequential, failed action doesn't block later ones
- [ ] 5.4 Determinism test: identical inputs produce identical outputs

## 6. Client — Rendering Setup

- [ ] 6.1 Create HTML entry point `packages/client/index.html` with canvas container
- [ ] 6.2 Initialize PixiJS Application in `packages/client/src/app.ts`
- [ ] 6.3 Implement map rendering: draw map background rectangle with border
- [ ] 6.4 Implement node rendering: draw nodes as circles, differentiate root vs generator style
- [ ] 6.5 Implement edge rendering: draw lines between connected nodes
- [ ] 6.6 Implement health bars on nodes (current/max)
- [ ] 6.7 Implement camera: pan (click-drag) and zoom (scroll wheel)

## 7. Client — Interaction and UI

- [ ] 7.1 Implement game state manager in client: receives GameState, updates PixiJS display
- [ ] 7.2 Implement local game loop adapter: calls `simulateTick` locally, supports auto and manual tick modes
- [ ] 7.3 Implement node type palette UI: display available types with costs
- [ ] 7.4 Implement node placement on click: select type from palette, click map to queue action
- [ ] 7.5 Implement placement preview: green/red range circle around cursor based on validity
- [ ] 7.6 Implement HUD: resource display, tick counter, tick mode indicator, auto-mode countdown

## 8. Integration and Verification

- [ ] 8.1 Wire client to local game loop: start game → place nodes → see resources grow → advance ticks
- [ ] 8.2 Verify node tree builds correctly (visual: edges connect to correct parents)
- [ ] 8.3 Verify resource generation (visual: HUD updates each tick)
- [ ] 8.4 Verify placement validation (visual: red circle when out of range, action rejected)
- [ ] 8.5 Verify auto and manual tick modes work correctly
