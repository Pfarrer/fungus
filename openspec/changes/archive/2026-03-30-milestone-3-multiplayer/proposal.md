## Why

The game works locally with combat. Milestone 3 adds the competitive layer: two human players over the internet. This requires an authoritative server, WebSocket communication, and client-server protocol.

## What Changes

- Implement WebSocket server in `packages/server/` with match management
- Implement client-server protocol: action queueing, state broadcast, tick countdown, reconnection
- Authoritative game logic: server owns all state, validates all actions, clients are stateless renderers
- Tick-based server loop: collect actions, simulate, broadcast state at configurable intervals
- Support both real-time (100ms ticks) and correspondence (hours per tick) modes via configuration
- Client refactoring: strip local game loop, replace with WebSocket state sync

## Capabilities

### New Capabilities

- `multiplayer-sync`: WebSocket protocol, action queueing, state broadcast, reconnection, match lifecycle
- `game-server`: Authoritative server with tick loop, match management, player connection handling

### Modified Capabilities

- `game-loop`: Extract pure simulation from local loop; server drives the loop, client receives results
- `sandbox-client`: Remove local game loop, add WebSocket client, state sync, reconnection handling

## Impact

- Major changes to `packages/client/` — replaces local game loop with server sync
- `packages/server/` becomes a full implementation (no longer a stub)
- `packages/game/` logic unchanged (already pure functions) — server calls the same `simulateTick`
- Requires deployment infrastructure for the server (future concern)
