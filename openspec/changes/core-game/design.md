## Context

Fungus is a 2D competitive multiplayer strategy game where players build tree-structured networks of nodes on a flat map, competing over territory and resources. This is a new project with no existing codebase.

The game operates on a tick-based simulation with configurable tick duration, supporting modes from real-time (100ms ticks) to correspondence (hours per tick). Players queue actions within each tick window; the server validates and resolves them simultaneously.

## Goals / Non-Goals

**Goals:**
- Build a playable 1v1 prototype with core mechanics: node placement, tree connectivity, resource economy, combat, and the slow-death mechanic
- Single authoritative server with stateless clients (all game state lives server-side)
- Web-native client accessible from any browser, optimized for both real-time and correspondence play
- Shared game logic between server and client (validation, simulation) to prevent drift

**Non-Goals:**
- Terrain, elevation, or map obstacles (flat open map for v1)
- Matchmaking, lobbies, accounts, or persistence beyond a single match
- More than 2 players per match
- Native client builds or mobile apps
- Pathfinding beyond tree traversal
- Real-time physics, collision detection, or frame-rate-dependent systems
- AI opponents (human-only for v1)
- Action cancellation from the queue (open question, deferred)

## Decisions

### 1. TypeScript full-stack

**Choice:** TypeScript for server, client, and shared game logic.

**Rationale:** The game is logic-heavy (tick simulation, resource economy, tree operations) not graphics-heavy. One language across the stack eliminates client/server logic drift. Shared game logic package means validation and simulation run identically on both sides.

**Alternatives considered:**
- Rust/Go server + Godot client: Better performance ceiling, but requires two languages, duplicated logic, and players must download a client — incompatible with correspondence mode
- Godot web export: Heavy payload (5-10MB), still two languages, loses the simplicity advantage

### 2. PixiJS for client rendering

**Choice:** PixiJS for 2D canvas rendering.

**Rationale:** Lightweight 2D rendering engine with good sprite/batching support, input handling, and text rendering. The game's visual complexity is low (nodes, edges, simple projectiles) — PixiJS handles this comfortably without the overhead of a full game engine.

**Alternatives considered:**
- Raw HTML5 Canvas: Zero dependencies but reinvents sprite batching, camera transforms, and input handling
- Phaser: Full game engine, too heavy for what's needed (includes physics, audio engine, scene management)

### 3. Monorepo with shared game logic package

**Choice:** Single repository with three packages sharing game logic.

```
fungus/
  packages/
    game/              ← pure logic, zero I/O dependencies
    server/            ← Node.js WebSocket server
    client/            ← PixiJS browser client
```

**Rationale:** The server must run game logic for authoritative simulation. The client runs game logic for action validation preview and potential local prediction. Sharing via a single package prevents logic divergence.

**Key constraint:** `packages/game/` must have zero I/O — no network calls, no file access, no DOM. Pure functions that take state + actions and produce new state.

### 4. Tick-based authoritative server

**Choice:** Server owns all game state. Each tick: collect queued actions → validate → simulate → broadcast new state.

**Rationale:** Tick-based simulation is inherently deterministic and doesn't need the complex netcode of continuous real-time games (no interpolation, no lag compensation, no client-side prediction beyond UI responsiveness). The configurable tick duration means the same architecture serves all play modes.

### 5. WebSocket for client-server communication

**Choice:** WebSocket for bidirectional communication.

**Rationale:** Clients need to push queued actions to the server, and the server needs to push state snapshots to clients. WebSocket provides persistent low-latency bidirectional channels. Simple message protocol:

```
Client → Server:  { type: "queue-actions", actions: [...] }
Server → Client:  { type: "tick-result", state: {...}, tick: N }
Server → Client:  { type: "tick-countdown", secondsRemaining: N }
```

For correspondence mode, the same protocol works — clients reconnect, get current state, queue actions, disconnect.

### 6. State snapshot architecture

**Choice:** Server sends full game state each tick (not deltas).

**Rationale:** Game state for a 2-player match on a flat map is small (dozens of nodes, edges, and resources). Full snapshots avoid delta accumulation bugs, simplify client code (no state merging), and make reconnection trivial (request current snapshot). Can optimize to deltas later if needed.

## Risks / Trade-offs

- **[Canvas performance ceiling]** → PixiJS with WebGL should handle hundreds of nodes easily. Unlikely to be a real issue at v1 scale.
- **[Tick granularity for real-time]** → At 100ms ticks, 10 updates/sec may feel slightly choppy. Mitigation: client-side interpolation between ticks for smooth animations (projectiles, health bars). Game logic stays tick-locked, rendering interpolates.
- **[WebSocket persistence for correspondence]** → Players disconnect for hours. Mitigation: server persists game state to disk, client reconnects and receives current snapshot. No need for persistent connections.
- **[Shared package coupling]** → Changes to game logic could break both server and client. Mitigation: `packages/game/` is pure functions with explicit input/output types. Test it in isolation.
- **[Scope creep]** → Feature list is already large for a first iteration. Mitigation: ship a minimal playable prototype (generators, turrets, basic combat, win condition) before adding shields, correspondence persistence, etc.
