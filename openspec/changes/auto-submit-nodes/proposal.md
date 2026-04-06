## Why

Players currently plan nodes by clicking on the map and then must manually click an "Execute Actions" button to submit them to the server. This adds an unnecessary step — players want their node placements to take effect as soon as possible. Removing the manual submission step makes the game feel more responsive and reduces the cognitive overhead of managing a submission queue.

## What Changes

- When a player clicks to place a node, the action is immediately sent to the server's action queue instead of being held in a manual submit batch
- The "Execute Actions" button is removed from the UI
- A local pending-actions buffer is retained only when connectivity is unavailable, and flushes once the connection resumes
- The server-side action queue and tick processing remain unchanged — they already support receiving actions incrementally between ticks

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `action-queue`: Actions are now submitted one at a time immediately on placement rather than batched behind a manual submit step. The per-action validation and server queue behavior remain the same, with a local pending buffer used only while connectivity is unavailable.

## Impact

- **Client** (`packages/client/src/main.ts`): Primary change area — remove batching UI, add immediate submission on click
- **Protocol** (`packages/server/src/protocol.ts`): No changes needed — server already accepts `queue-actions` with any number of actions
- **Server** (`packages/server/src/match.ts`): No changes needed — `queueActions` already appends to the per-player queue
- **Game logic** (`packages/game/`): No changes needed
