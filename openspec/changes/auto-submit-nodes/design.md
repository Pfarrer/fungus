## Context

The game is a real-time multiplayer strategy game with a tick-based simulation loop. Currently, the client batches node placement actions locally and requires the player to click an "Execute Actions" button to submit them to the server. The server already accepts incremental action submissions between ticks via `queue-actions` WebSocket messages and appends them to per-player queues (`Match.actionQueues`). Ticks fire on a timer, collect all queued actions, and process them through `simulateTick()`.

**Current client flow:**
1. Player selects node type from palette
2. Player clicks map → action validated client-side → pushed to `queuedActions[]`
3. "Execute Actions" button appears with count
4. Player clicks button → `connection.queueActions(queuedActions)` sends all at once
5. `queuedActions` cleared, `actionsSentThisTick = true`

**Key files:**
- `packages/client/src/main.ts` — UI, interaction, local action queue, submit button
- `packages/client/src/connection.ts` — `queueActions()` WebSocket method
- `packages/server/src/match.ts` — server-side action queue and tick loop
- `packages/server/src/protocol.ts` — message types

## Goals / Non-Goals

**Goals:**
- Submit each node placement action to the server immediately upon valid click
- Remove the manual "Execute Actions" submission step
- Retain pending actions locally if connectivity is unavailable, and flush them when the connection resumes
- Maintain existing server-side behavior (no server changes required)

**Non-Goals:**
- Changing the server-side tick processing or action queue
- Adding undo/cancel functionality for submitted actions
- Changing how actions are validated (client-side preview validation stays the same)
- Supporting action batching for future action types

## Decisions

### Decision: Send one action per click immediately

**Choice:** On each valid pointerdown, immediately call `connection.queueActions([action])`.

**Alternative:** Keep a short debounce window (e.g., 100ms) to batch rapid clicks.

**Rationale:** The server already handles incremental submissions. Each click produces one action, and sending it immediately gives the fastest feedback loop. Debouncing adds complexity with no clear benefit since the tick timer is the real bottleneck (typically seconds).

### Decision: Remove the execute button and manual-submit queue

**Choice:** Remove the manual-submit queue (`queuedActions[]`, `actionsSentThisTick`), the "Execute Actions" button, and the queued actions HUD display. Retain only a local pending buffer for actions created while the client is disconnected or reconnecting.

**Alternative:** Remove all local buffering entirely.

**Rationale:** The manual queue is no longer needed once submission is automatic, but removing all local buffering would drop user actions during reconnect windows because the transport currently cannot send while the socket is closed. A narrow pending buffer preserves player intent only when connectivity is unavailable without keeping the old manual-submit UX.

### Decision: Remove explicit submission-success HUD copy

**Choice:** Remove HUD copy that claims an action "was submitted" or "was queued" successfully.

**Alternative:** Add a transport acknowledgment so the HUD can confirm server receipt.

**Rationale:** The current protocol has no server acknowledgment for queued actions, so the client cannot truthfully confirm that the server received a placement. The spec should avoid promising that level of certainty until an ack exists.

## Risks / Trade-offs

- **[No undo]** → Once submitted, actions cannot be cancelled. This is acceptable because the current flow also has no undo (actions are submitted as a batch). Future work can add cancellation if needed.
- **[Race condition on rapid clicks]** → If a player clicks faster than WebSocket messages can be sent, actions queue up in the browser's WebSocket buffer. This is fine — the server processes them in order.
- **[Reconnect window]** → If connectivity drops, immediate-send actions cannot leave the client. The client therefore retains pending actions locally until connectivity resumes, then flushes them in order.
- **[Placement preview uses stale state]** → The client validates placement against the last known game state. Between submission and the next tick, the state could change (e.g., another player destroys a nearby node). This already exists in the current design and is handled by server-side re-validation during tick processing.
