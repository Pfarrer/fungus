## Context

Currently, players accumulate resources in a pool (capped at 500). Placing a building deducts the cost instantly and the node appears on the map immediately. This means players can stockpile and spend at will.

The new model replaces hoarding with a flow-through system: each tick, net surplus (production minus consumption) is routed to construction queues. Resources not assigned to construction are lost. Buildings take multiple ticks to complete based on their cost relative to the player's surplus rate. Multiple concurrent constructions share surplus equally.

The change touches the core game loop, resource economy, node placement, and player state. The client and server need updates to handle construction progress display and tick result messaging.

## Goals / Non-Goals

**Goals:**
- Replace instant building placement with a tick-based construction queue funded by resource surplus
- Discard unspent surplus each tick (no hoarding)
- Enable equal sharing of surplus across concurrent constructions with fractional progress tracking
- Preserve all existing validation rules for placement (distance, occupancy, etc.)
- Integrate construction progress into the tick cycle deterministically

**Non-Goals:**
- Storage buildings (special nodes that retain surplus) - future change
- Construction cancellation or reprioritization - out of scope
- Variable construction speed based on node type - all buildings fund at the same rate from surplus
- Visual effects for construction (animations, particles) - client polish, separate change
- Construction queue ordering or priority - all queued buildings share equally

## Decisions

### 1. Construction queue lives on Player state

**Decision**: Add a `constructions` array to the `Player` type. Each entry tracks `nodeType`, `position`, `parentId`, `totalCost`, and `funded` (progress so far).

**Rationale**: The queue is per-player, tied to resource generation. Putting it on Player keeps the data model simple and avoids a separate module with its own state management. Construction is fundamentally a player-level concern.

**Alternative considered**: Separate `ConstructionQueue` module with its own state. Rejected because it adds indirection without benefit - the queue is always accessed in the context of a player's resource flow.

### 2. Resource flow within a tick: generate → consume → fund construction → discard remainder

**Decision**: New tick order:
1. Process actions (queue constructions via PlaceNode)
2. Generate resources (production from connected nodes)
3. Consume resources (turret/shield upkeep)
4. Fund constructions (surplus split equally across queue)
5. Activate completed buildings (add nodes/edges to state)
6. Resolve combat
7. Resolve death

**Rationale**: Generation happens before consumption so the net surplus is accurate. Construction funding happens before combat/death so newly completed buildings participate in combat the same tick they finish. This preserves the deterministic simulation guarantee.

**Alternative considered**: Fund constructions before generating resources. Rejected because it would require carrying surplus forward from the previous tick, re-introducing a form of stockpiling.

### 3. Surplus sharing: integer division with remainder carry-forward

**Decision**: When a player has `n` constructions and `surplus` resources, each construction receives `Math.floor(surplus / n)` resources. The remainder (`surplus % n`) is distributed one unit each to the first `remainder` constructions in queue order. Any resources assigned to construction are consumed; leftover surplus after funding is discarded (player resources return to 0).

**Rationale**: Using floor division with remainder carry-forward ensures deterministic behavior and no floating-point issues. The queue order provides a consistent tiebreaker for the remainder.

**Alternative considered**: Fractional (floating-point) progress. Rejected because it introduces precision issues in a deterministic simulation. Integer math is simpler to test and reason about.

### 4. Validation at queue time, not completion time

**Decision**: All placement validation (distance, occupancy, position, etc.) runs when the PlaceNode action is processed. If valid, the construction is queued. No re-validation at completion time.

**Rationale**: The game state at queue time is the correct moment to validate - the player is making a decision. Re-validating at completion could cause buildings to fail after being partially funded, which feels unfair and is harder to communicate.

**Edge case**: If the parent node is destroyed while a building is under construction, the building still completes but may be disconnected. This is consistent with existing behavior where edges can be destroyed independently.

### 5. Remove resource cap, player resources represent per-tick surplus

**Decision**: Remove `resourceCap` from `GameConfig`. Player `resources` field becomes 0 at the start of each tick (after funding). It temporarily holds generated resources during the tick for computation but is always 0 by tick end (funded to construction or discarded).

**Rationale**: The cap existed to prevent hoarding, but the new surplus-discard mechanic achieves the same goal more naturally. Keeping the cap would create a confusing interaction where resources are both capped and discarded.

### 6. Client displays ghost nodes for in-progress constructions

**Decision**: The server includes a `constructions` array in the tick result message. The client renders ghost nodes (semi-transparent) at queued positions with a progress bar showing funding percentage.

**Rationale**: Players need visibility into what's being built. Ghost nodes show where the building will appear without affecting gameplay (no collisions, no combat participation).

## Risks / Trade-offs

**[Fractional tick edge cases]** → Integer division with remainder means some buildings get one extra resource per tick. This is deterministic and consistent (based on queue order), but players might find the ordering subtle. Mitigated by documenting the behavior in the spec and showing per-building progress in the UI.

**[Construction blocked by combat losses]** → If production nodes are destroyed, surplus drops and constructions take longer. This is intentional - it creates strategic depth around protecting generators. No mitigation needed.

**[No cancellation means commitment]** → Players cannot undo a construction once queued. This simplifies the model but could feel punishing. A future change could add cancellation with partial refund. For now, the commitment encourages deliberate placement.

**[Tick order change is a breaking change]** → Existing replays and deterministic simulations will not match the new tick order. This affects the game-loop spec. Mitigated by versioning the change and ensuring the bot opponent adapts to new timing.
