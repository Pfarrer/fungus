## 1. Data Model

- [x] 1.1 Add `Construction` type to `types.ts` with fields: `id`, `playerId`, `nodeType`, `position`, `parentId`, `totalCost`, `funded`
- [x] 1.2 Add `constructions: Construction[]` field to `Player` type
- [x] 1.3 Remove `resourceCap` from `GameConfig` type and `defaultGameConfig`
- [x] 1.4 Update `createInitialState` to initialize empty `constructions` array per player

## 2. Construction Queue Module

- [x] 2.1 Create `packages/game/src/construction.ts` with `queueConstruction(state, config, playerId, nodeType, position)` function that validates placement and adds a construction entry
- [x] 2.2 Implement `fundConstructions(state, config)` function that distributes surplus equally across each player's construction queue
- [x] 2.3 Implement `activateCompletedConstructions(state, config)` function that removes fully-funded constructions and adds nodes/edges to game state
- [x] 2.4 Handle construction ID generation with resettable counters (matching existing pattern for node/edge IDs)

## 3. Node Placement Refactor

- [x] 3.1 Update `validatePlaceNode` in `node-placement.ts` to remove the resource sufficiency check
- [x] 3.2 Update `placeNode` in `node-placement.ts` to call `queueConstruction` instead of creating nodes directly (for non-root types)
- [x] 3.3 Ensure root node placement bypasses the construction queue and is placed directly

## 4. Resource Economy Refactor

- [x] 4.1 Update `generateResources` to set player resources to 0 after construction funding (surplus discard)
- [x] 4.2 Remove resource cap logic from `generateResources`
- [x] 4.3 Ensure consumption (turret/shield upkeep) is deducted from generated resources before construction funding

## 5. Game Loop Integration

- [x] 5.1 Update `simulateTick` tick order to: actions → generate resources → consume resources → fund constructions → activate completions → combat → death
- [x] 5.2 Integrate consumption step between resource generation and construction funding
- [x] 5.3 Add construction funding and activation steps to tick pipeline

## 6. Core Tests

- [x] 6.1 Test construction queue creation on valid PlaceNode action
- [x] 6.2 Test single construction funding from surplus
- [x] 6.3 Test equal surplus sharing across multiple constructions (even and uneven splits)
- [x] 6.4 Test surplus discarded when no constructions exist
- [x] 6.5 Test construction completion and node activation
- [x] 6.6 Test construction completion with overflow (excess resources lost)
- [x] 6.7 Test multiple constructions completing in same tick
- [x] 6.8 Test incomplete construction does not participate in gameplay
- [x] 6.9 Test completed building participates in combat same tick
- [x] 6.10 Test placement validation without resource check
- [x] 6.11 Test deterministic tick order with constructions
- [x] 6.12 Test root node bypasses construction queue

## 7. Existing Test Updates

- [x] 7.1 Update `resource-economy.test.ts` to remove resource cap tests and add surplus discard tests
- [x] 7.2 Update `game-loop.test.ts` to reflect new tick order and construction flow
- [x] 7.3 Update `node-placement.test.ts` to verify no upfront resource deduction and construction queueing
- [x] 7.4 Update `action-queue` related tests for construction queueing behavior
- [x] 7.5 Update `bot-opponent.ts` to account for construction delays in resource spending logic
- [x] 7.6 Update `initial-state.test.ts` to verify empty construction queues at game start

## 8. Server Updates

- [x] 8.1 Include construction queue in tick result messages sent to clients
- [x] 8.2 Update server tick processing to use new tick order
- [x] 8.3 Update e2e and integration tests for construction flow

## 9. Client Updates

- [x] 9.1 Add ghost node rendering for in-progress constructions (semi-transparent with progress bar)
- [x] 9.2 Update HUD to show construction progress for queued buildings
- [x] 9.3 Update placement validation UI to not show resource cost as blocking
- [x] 9.4 Add client tests for ghost node rendering and construction progress display
