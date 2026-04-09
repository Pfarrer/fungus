## Context

The game uses a tick-based architecture: players queue actions (e.g., `PlaceNode`), which are processed at fixed intervals by either a local game loop (single-player) or a server (multiplayer). The current rendering pipeline only shows nodes that exist in the authoritative `GameState`. There is a preview system that renders a semi-transparent node on hover, but no persisted "ghost" after clicking.

Key files involved:
- `packages/client/src/main.ts` — click handler, action queueing, tick result handling
- `packages/client/src/renderer.ts` — PixiJS rendering of all game entities
- `packages/client/src/local-game-loop.ts` — single-player tick processing
- `packages/game/src/node-placement.ts` — `validatePlaceNode` for client-side pre-validation

## Goals / Non-Goals

**Goals:**
- Immediate visual feedback when placing a node — show a ghost node at the clicked position
- Ghost nodes visually distinct from confirmed nodes (reduced opacity)
- On tick confirmation: ghost either materializes (becomes part of normal render) or fades out
- Works for both single-player and multiplayer modes
- Supports multiple queued placements within the same tick (multiple ghost nodes)

**Non-Goals:**
- Client-side prediction of other players' actions
- Server-side changes — this is purely a client rendering concern
- Ghost nodes for actions other than PlaceNode (future actions don't exist yet)
- Rollback/replay of the local game state

## Decisions

### Decision 1: Ghost node state stored in main.ts, not in GameState

The `GameState` type is owned by `@fungus/game` and is authoritative. Ghost nodes are a UI-only concern and should NOT pollute the game state. Instead, `main.ts` maintains a separate `pendingNodes` array of `{ position, nodeType, playerId }` entries.

**Rationale**: Keeps the separation clean. The renderer receives ghost nodes as a separate argument, not interleaved with real nodes. No risk of ghost data leaking into game logic.

**Alternative considered**: Inject ghost nodes into a copy of GameState. Rejected — would require generating fake IDs, costs, edges, and health values that could collide with real data.

### Decision 2: Renderer renders ghost nodes in a separate pass

The `GameRenderer.render()` method gains an optional `ghostNodes` parameter. Ghost nodes are rendered into a dedicated `ghostContainer` (between `edgesContainer` and `nodesContainer`) so they layer correctly — edges below ghost nodes, ghost nodes below real nodes.

**Rationale**: Separation of concerns. Ghost nodes use simpler rendering (no health bars, no shield auras). Clear z-ordering without z-index hacks.

**Alternative considered**: Add a `pending` flag to the existing node render loop. Rejected — would couple rendering logic to action state and complicate the health bar / shield aura code.

### Decision 3: Ghost-to-solid reconciliation via position matching

On tick result, match each ghost node to a real node by `{ position, nodeType, playerId }`. If a matching node exists in the new `GameState.nodes`, the placement succeeded and the ghost is removed (the normal render now shows it). If no match exists, the placement failed and the ghost is removed (optionally with a fade-out effect).

**Rationale**: Positions are unique (validation prevents placing on occupied cells). Matching by position is deterministic and requires no fake IDs or correlation IDs.

**Alternative considered**: Use an action correlation ID. Rejected — adds complexity to the action protocol for a purely client-side concern.

### Decision 4: Ghost node visual style

Ghost nodes render at ~40% opacity with a dashed outline, no health bar, and a connecting line to the closest friendly node (also at reduced opacity). This distinguishes them clearly from confirmed nodes while communicating the intended connection.

**Rationale**: Enough visual information to communicate intent without looking like a confirmed node. No health bar since the node doesn't exist yet.

### Decision 5: Clear all ghost nodes on tick result

Every tick result clears all ghost nodes regardless of success/failure. Successful placements appear as normal nodes in the new state. Failed placements simply vanish.

**Rationale**: Simpler than tracking individual ghost node lifetimes. In practice, the tick interval is short (5s) and players rarely have more than 1-2 pending actions.

## Risks / Trade-offs

- **[Ghost node displayed but action not yet sent]** → If the action fails to queue (e.g., connection drops between validation and send), the ghost will persist until the next tick result, then vanish. This is acceptable — the delay is at most one tick duration.
- **[Position collision with another player's action]** → Two players could place at the same position in the same tick. Only one succeeds. The other player's ghost vanishes on tick result. No visual glitch since ghosts are player-specific.
- **[Multiple ghosts at same position]** → Client-side validation prevents this (checks `gameState` for occupation), but if a player somehow queues two actions at the same position, only the first would succeed. Both ghosts would vanish on tick result.
