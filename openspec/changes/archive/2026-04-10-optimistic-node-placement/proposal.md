## Why

Players experience a delay between clicking to place a node and seeing it on screen. The node only appears after the server processes the tick and sends back the updated game state. This breaks the feedback loop — the player clicks and sees nothing until the tick fires, making the game feel sluggish and unresponsive.

## What Changes

- Introduce "optimistic nodes" — ghost nodes rendered at reduced opacity immediately when the player clicks to place a node
- Ghost nodes persist until the next tick result arrives from the server (or local simulation)
- On tick confirmation: if the node appears in the authoritative game state at that position, the ghost materializes into a normal node (full opacity); if the placement was invalid (node absent from state), the ghost fades out and is removed
- Works for both single-player (local game loop) and multiplayer (WebSocket) modes

## Capabilities

### New Capabilities
- `optimistic-placement`: Client-side optimistic rendering of pending node placements with ghost-to-solid transition on tick confirmation and removal on rejection

### Modified Capabilities
- `action-queue`: Adds a new requirement for tracking queued actions with their positions/types to support rendering ghost nodes between action submission and tick resolution

## Impact

- **Client renderer** (`packages/client/src/renderer.ts`): Must support rendering ghost nodes alongside authoritative nodes
- **Client main** (`packages/client/src/main.ts`): Must track pending actions, render ghost nodes immediately on click, and reconcile on tick result
- **Client local game loop** (`packages/client/src/local-game-loop.ts`): No changes needed — tick callback already provides updated state
- **Game package** (`@fungus/game`): No changes — `validatePlaceNode` already used client-side for pre-validation
