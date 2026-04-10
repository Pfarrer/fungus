## 1. Ghost Node Data Model

- [x] 1.1 Define a `PendingNode` interface in `main.ts` with fields: `position: { x: number; y: number }`, `nodeType: string`, `playerId: string`
- [x] 1.2 Add a `pendingNodes: PendingNode[]` module-level variable in `main.ts`

## 2. Renderer — Ghost Node Support

- [x] 2.1 Add a `ghostContainer: Container` to `GameRenderer` (initialized between `edgesContainer` and `nodesContainer` in z-order)
- [x] 2.2 Add a `renderGhostNodes(pendingNodes: PendingNode[], state: GameState, config: GameConfig)` method to `GameRenderer` that renders each pending node at ~40% opacity with its node-type color, radius, and a dashed outline — no health bar
- [x] 2.3 In `renderGhostNodes`, draw a ghost edge from each pending node to the closest friendly node within range (using `findClosestFriendlyNodeWithinRange` from `@fungus/game`), rendered at the same reduced opacity
- [x] 2.4 Clear `ghostContainer` children at the start of each `renderGhostNodes` call (same pattern as `renderEdges`/`renderNodes`)

## 3. Main — Ghost Node Lifecycle

- [x] 3.1 In the `setupInteraction` pointerdown handler, after successful validation and action queueing, push a `PendingNode` entry to `pendingNodes` with the position, nodeType, and currentPlayerId
- [x] 3.2 Call a new `renderGhostNodes()` helper after pushing the pending node to immediately show the ghost
- [x] 3.3 Create a `renderGhostNodes()` function that calls `renderer.renderGhostNodes(pendingNodes, gameState, config)` if gameState is non-null
- [x] 3.4 In the `renderState()` function, add reconciliation logic after the normal `renderer.render()` call: for each pending node, check if `gameState.nodes` contains a matching node (same position, nodeType, playerId). Clear `pendingNodes` array after reconciliation
- [x] 3.5 In `cleanupGame()`, reset `pendingNodes` to an empty array

## 4. Verification

- [x] 4.1 Run existing tests to ensure no regressions in game logic or renderer
- [x] 4.2 Manually verify: place a node in single-player mode and confirm ghost appears immediately, then materializes on tick
- [x] 4.3 Manually verify: place a node in an invalid position (e.g., occupied cell via race condition) and confirm ghost vanishes on tick