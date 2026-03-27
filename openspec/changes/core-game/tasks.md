## 1. Project Scaffolding

- [ ] 1.1 Initialize monorepo with TypeScript (workspaces): root `package.json`, `tsconfig.json`, shared compiler settings
- [ ] 1.2 Scaffold `packages/game/` — pure game logic package with no I/O dependencies
- [ ] 1.3 Scaffold `packages/server/` — Node.js WebSocket server package
- [ ] 1.4 Scaffold `packages/client/` — PixiJS browser client package
- [ ] 1.5 Set up Vitest across all packages with shared config and a `test` script at root

## 2. Game Types and State Model

- [ ] 2.1 Define core types: `Position`, `Node`, `Edge`, `NodeType`, `Player`, `GameState`
- [ ] 2.2 Define action types: `PlaceNodeAction`, `GameAction` (discriminated union)
- [ ] 2.3 Define configuration types: `MapConfig`, `NodeTypeConfig`, `GameConfig`
- [ ] 2.4 Define server message types: `QueueActionsMessage`, `TickResultMessage`, `TickCountdownMessage`
- [ ] 2.5 Create a `createInitialState(config: GameConfig): GameState` function that sets up root nodes at spawn points

## 3. Game Logic — Node Network

- [ ] 3.1 Implement `findClosestFriendlyNode(state, player, position)` — finds nearest friendly node within max connection distance
- [ ] 3.2 Implement `validatePlaceNode(state, player, nodeType, position)` — checks range, occupancy, bounds, resources
- [ ] 3.3 Implement `placeNode(state, player, nodeType, position)` — creates node, creates edge to closest friendly, deducts cost
- [ ] 3.4 Implement `findConnectedSubtree(state, rootNodeId)` — BFS/DFS from root to find all connected nodes
- [ ] 3.5 Implement `detectDisconnectedNodes(state, player)` — returns nodes not reachable from root after edge/node destruction
- [ ] 3.6 Unit tests for all node network operations

## 4. Game Logic — Resource Economy

- [ ] 4.1 Implement `generateResources(state, tick)` — sum production from all connected generators and root nodes per player
- [ ] 4.2 Implement `consumeResources(state, tick)` — deduct consumption from connected turrets and shields per player
- [ ] 4.3 Implement `capResources(state, config)` — enforce resource cap after generation
- [ ] 4.4 Implement `applyResourceTransaction(state, player, cost)` — deduct cost with insufficient-funds check
- [ ] 4.5 Unit tests for resource economy operations

## 5. Game Logic — Combat System

- [ ] 5.1 Implement `findTurretTargets(state, turret, config)` — find nearest enemy nodes/edges within attack range
- [ ] 5.2 Implement `calculateShieldReduction(state, targetNode)` — sum shield percentages from adjacent nodes
- [ ] 5.3 Implement `resolveCombat(state, config)` — full combat pass: consume resources, select targets, calculate shields, apply damage, remove dead nodes/edges
- [ ] 5.4 Unit tests for combat resolution

## 6. Game Logic — Death Mechanic

- [ ] 6.1 Implement `applyDeathDrain(state, config)` — reduce health of all disconnected nodes by death rate
- [ ] 6.2 Implement `removeDeadNodes(state)` — destroy nodes at zero health, remove their edges, detect new disconnections
- [ ] 6.3 Implement `checkWinCondition(state)` — return winner if a root node is destroyed
- [ ] 6.4 Unit tests for death mechanic and win condition

## 7. Game Logic — Game Loop

- [ ] 7.1 Implement `processActions(state, playerActions, config)` — validate and apply queued actions sequentially per player
- [ ] 7.2 Implement `simulateTick(state, playerActions, config)` — full tick: process actions, generate resources, consume resources, resolve combat, death drain, check win condition
- [ ] 7.3 Integration test: full game from initial state through several ticks with both players placing nodes and combat
- [ ] 7.4 Determinism test: run identical inputs through simulateTick and assert identical outputs

## 8. Default Map Configuration

- [ ] 8.1 Define a default 2-player map config: 800x600 map, spawn points at opposite corners, reasonable node costs/ranges/health values
- [ ] 8.2 Add a map validation function that ensures config is self-consistent (costs positive, ranges reasonable, spawn points in bounds)

## 9. Server

- [ ] 9.1 Set up WebSocket server (using `ws` library) in `packages/server/`
- [ ] 9.2 Implement player connection handling: associate WebSocket connections with match players, send initial game state on connect
- [ ] 9.3 Implement action message handler: receive `queue-actions` messages, append to player's queue
- [ ] 9.4 Implement tick loop: `setInterval` at configured tick duration, collect queues, call `simulateTick`, broadcast `tick-result` to all clients
- [ ] 9.5 Implement tick countdown: broadcast `tick-countdown` messages at regular intervals before each tick
- [ ] 9.6 Implement reconnection: on reconnect, send current game state snapshot
- [ ] 9.7 Implement match lifecycle: create match → wait for players → start game loop → end match on win condition
- [ ] 9.8 Server integration tests using mock WebSocket clients

## 10. Client — Rendering

- [ ] 10.1 Set up PixiJS application in `packages/client/` with HTML entry point
- [ ] 10.2 Implement map rendering: draw flat map background with boundary visualization
- [ ] 10.3 Implement node rendering: draw nodes as styled circles/shapes with health bars, differentiate by type (root, generator, turret, shield)
- [ ] 10.4 Implement edge rendering: draw connections between nodes with health indication (color/thickness)
- [ ] 10.5 Implement camera/viewport: pan and zoom to navigate the map
- [ ] 10.6 Implement client-side interpolation for smooth animations between ticks (health bar transitions, damage effects)

## 11. Client — Interaction

- [ ] 11.1 Implement WebSocket client: connect to server, handle `tick-result`, `tick-countdown`, and reconnection
- [ ] 11.2 Implement state management: receive server state, render current state, maintain tick countdown display
- [ ] 11.3 Implement node placement UI: select node type from palette, click map to queue placement, show valid placement range indicator
- [ ] 11.4 Implement action preview: show validation feedback before queueing (green/red based on whether placement would be valid)
- [ ] 11.5 Implement HUD: display player resources, tick countdown, queued actions summary, enemy info

## 12. End-to-End Integration

- [ ] 12.1 Start server and two clients in development mode, verify full game loop works
- [ ] 12.2 Verify real-time mode (short tick duration) feels responsive
- [ ] 12.3 Verify correspondence-like mode (long tick duration) works correctly
- [ ] 12.4 Verify win condition: destroy enemy root, match ends, winner displayed
