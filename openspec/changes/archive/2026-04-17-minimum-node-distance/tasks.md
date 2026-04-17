## 1. Type & Config Changes

- [x] 1.1 Add `minNodeDistance: number` field to the `MapConfig` interface in `packages/game/src/types.ts`
- [x] 1.2 Add `minNodeDistance: 20` to the default map config in `packages/game/src/config.ts`

## 2. Spatial Helper

- [x] 2.1 Add `findNearestNode(state: GameState, position: Position): Node | null` to `packages/game/src/spatial.ts` that returns the nearest node of any ownership to a given position
- [x] 2.2 Export the new function from `packages/game/src/index.ts`

## 3. Validation Logic

- [x] 3.1 Add minimum distance check in `validatePlaceNode` (`packages/game/src/node-placement.ts`) after the occupied check: reject if the nearest node is closer than `config.map.minNodeDistance`
- [x] 3.2 Return a descriptive reason string like "Too close to existing node" on rejection

## 4. Tests

- [x] 4.1 Add test: rejects placement when distance to nearest node is less than `minNodeDistance`
- [x] 4.2 Add test: accepts placement when distance to nearest node equals `minNodeDistance` (inclusive boundary)
- [x] 4.3 Add test: accepts placement when distance to nearest node is greater than `minNodeDistance`
- [x] 4.4 Add test: minimum distance is enforced against enemy nodes, not just friendly
- [x] 4.5 Update existing tests that create map config objects to include `minNodeDistance` field

## 5. Client Updates

- [x] 5.1 Update client placement preview in `packages/client/src/main.ts` to show feedback when placement is too close to another node
- [x] 5.2 Update client test config objects to include `minNodeDistance`
