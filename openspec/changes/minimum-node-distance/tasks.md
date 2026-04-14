## 1. Type & Config Changes

- [ ] 1.1 Add `minNodeDistance: number` field to the `MapConfig` interface in `packages/game/src/types.ts`
- [ ] 1.2 Add `minNodeDistance: 20` to the default map config in `packages/game/src/config.ts`

## 2. Spatial Helper

- [ ] 2.1 Add `findNearestNode(state: GameState, position: Position): Node | null` to `packages/game/src/spatial.ts` that returns the nearest node of any ownership to a given position
- [ ] 2.2 Export the new function from `packages/game/src/index.ts`

## 3. Validation Logic

- [ ] 3.1 Add minimum distance check in `validatePlaceNode` (`packages/game/src/node-placement.ts`) after the occupied check: reject if the nearest node is closer than `config.map.minNodeDistance`
- [ ] 3.2 Return a descriptive reason string like "Too close to existing node" on rejection

## 4. Tests

- [ ] 4.1 Add test: rejects placement when distance to nearest node is less than `minNodeDistance`
- [ ] 4.2 Add test: accepts placement when distance to nearest node equals `minNodeDistance` (inclusive boundary)
- [ ] 4.3 Add test: accepts placement when distance to nearest node is greater than `minNodeDistance`
- [ ] 4.4 Add test: minimum distance is enforced against enemy nodes, not just friendly
- [ ] 4.5 Update existing tests that create map config objects to include `minNodeDistance` field

## 5. Client Updates

- [ ] 5.1 Update client placement preview in `packages/client/src/main.ts` to show feedback when placement is too close to another node
- [ ] 5.2 Update client test config objects to include `minNodeDistance`
