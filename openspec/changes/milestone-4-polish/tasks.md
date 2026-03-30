## 1. Visual Effects Foundation

- [ ] 1.1 Create `packages/client/src/effects.ts` — visual effect event types (`DamageFlash`, `NodeDeath`, `EdgeBreak`) with duration and state
- [ ] 1.2 Add effect queue to `GameRenderer` that stores active effects with elapsed time, processes them each frame via `app.ticker`
- [ ] 1.3 Compute state diffs on tick-result: compare previous and new `GameState` to detect health changes, node removals, edge removals
- [ ] 1.4 Implement damage flash: on node health decrease, add `DamageFlash` effect that renders a white overlay circle for 200ms
- [ ] 1.5 Implement node death animation: on node removal, add `NodeDeath` effect that expands and fades the node circle over 400ms
- [ ] 1.6 Implement edge break effect: on edge removal, add `EdgeBreak` effect that flashes red and fades the edge line over 300ms
- [ ] 1.7 Cap effect queue at 50 events; discard oldest when exceeded

## 2. Health Bar Interpolation

- [ ] 2.1 Track per-node previous health values in `GameRenderer` (map from node ID to last known health)
- [ ] 2.2 On tick-result, set target health for each node and start a 200ms lerp in the ticker
- [ ] 2.3 Render interpolated health bar width each frame during the lerp period
- [ ] 2.4 Snap to final value when lerp completes or new tick arrives

## 3. Shield Visual Aura

- [ ] 3.1 When rendering a shield node, draw a static translucent blue ring around it indicating shield range
- [ ] 3.2 Compute shield-protected nodes each render (nodes adjacent to a shield in the tree) and draw a pulsing translucent blue circle around them
- [ ] 3.3 Pulse the aura using a sine wave on the alpha channel (range 0.1–0.3) driven by `app.ticker.elapsedMS`

## 4. Full HUD

- [ ] 4.1 Add enemy network overview section to HUD: count enemy nodes by type (root, generator, turret, shield) and display as compact text
- [ ] 4.2 Add expandable queued actions list below the existing queued count: show each action as "Place <type> at (x, y)"
- [ ] 4.3 Make tick countdown timer update smoothly in real-time (use `setInterval` at 100ms to decrement displayed value between server countdowns)

## 5. Match End Screen

- [ ] 5.1 Create a full-screen HTML overlay that appears when `gameState.winner` is non-null
- [ ] 5.2 Display "Victory!" or "Defeat!" based on whether winner matches current player ID
- [ ] 5.3 Show final stats: tick count, nodes built, resources spent
- [ ] 5.4 Add "New Match" button that reloads the page to reconnect
- [ ] 5.5 Hide the game HUD and palette when match end screen is shown

## 6. Balance Tuning

- [ ] 6.1 Review and adjust `defaultGameConfig` values in `packages/game/src/config.ts` based on game math
- [ ] 6.2 Ensure generator pays for itself in ~5 ticks (cost 15, production 3/tick)
- [ ] 6.3 Ensure turret kills unshielded root in ~20 ticks (health 100, damage 5/tick)
- [ ] 6.4 Ensure shield meaningfully extends survival (20% reduction is significant)
- [ ] 6.5 Update `map-config` spec to reflect final balanced values

## 7. Tests

- [ ] 7.1 Client tests: verify state diff computation detects health changes, node removals, edge removals

## 8. Integration & Wiring

- [ ] 8.1 Wire tick-result handler to compute diffs and push visual effects to the renderer
- [ ] 8.2 Wire match end screen to appear on winner state
- [ ] 8.3 Wire full HUD components (enemy overview, action list, countdown)
- [ ] 8.4 End-to-end smoke test: two clients connect → nodes placed → combat → visual effects → match ends → end screen appears
