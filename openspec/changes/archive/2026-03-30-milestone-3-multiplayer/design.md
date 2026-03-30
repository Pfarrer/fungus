## Context

The game engine (`packages/game`) provides pure, deterministic simulation functions (`simulateTick`, `processActions`, etc.). The client (`packages/client`) currently runs the game loop locally — auto-ticking, managing state, and calling `simulateTick` directly. There is no server implementation; `packages/server` is a stub.

This change transforms the architecture from single-player sandbox to two-player competitive by introducing an authoritative server that owns all game state and drives the tick loop.

## Goals / Non-Goals

**Goals:**
- Authoritative server owns all `GameState` — clients are stateless renderers
- WebSocket protocol for action submission and state broadcast
- Tick-based server loop at configurable intervals (real-time 100ms to correspondence hours)
- Graceful disconnection/reconnection without match destruction
- Minimal changes to `packages/game` (already pure functions)

**Non-Goals:**
- Matchmaking or lobby system (players connect via URL with match/player IDs)
- Authentication or authorization
- Persistence (match state lives in memory only)
- Spectator mode
- Scaling / load balancing

## Decisions

### Decision: WebSocket over HTTP polling
WebSocket provides low-latency bidirectional communication needed for real-time ticks. HTTP polling would add unnecessary overhead and latency.

### Decision: Full state broadcast per tick
Instead of delta patches, the server broadcasts the complete `GameState` on every tick. This simplifies the client (no diffing needed) and avoids state desync issues. The `GameState` is small enough (< 100 nodes, < 200 edges) that serialization cost is negligible.

### Decision: Action queueing (not immediate execution)
Players queue actions between ticks. On each tick, the server collects all queued actions and passes them to `simulateTick`. This ensures deterministic resolution — both players' actions are processed atomically within the same tick.

### Decision: Match survives disconnection
When a player disconnects, the match continues. The disconnected player's action queue stays empty (they auto-pass). On reconnection, the server sends the full current state. This prevents griefing via disconnect and supports unstable connections.

### Decision: URL-based match/player identity
Match ID and player ID are passed as URL query params (`?matchId=X&playerId=Y`). No session management or tokens. This is the simplest approach for a two-player game without authentication.

## Risks / Trade-offs

**[State size]** Full state broadcast per tick could grow expensive → At expected scale (< 1000 entities), this is negligible. Can add delta compression later if needed.

**[No persistence]** Server restart loses all matches → Acceptable for MVP. Add Redis/DB backing later.

**[No authentication]** Anyone with a match URL can join → Acceptable for local/LAN play. Add auth for public deployment.

**[Tick timing]** Server-side `setInterval` can drift under load → Acceptable for MVP. Could use fixed timestep with catch-up for production.

**[Action validation]** Actions are queued without pre-validation; `simulateTick` validates internally → If invalid actions are queued, they're silently ignored during simulation. Client-side validation provides immediate feedback.
