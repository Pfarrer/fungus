## Context

Fungus is a 2D competitive strategy game being built from scratch. This is the first milestone: a local sandbox where a single player can build node networks and see resources flow. No server, no combat, no multiplayer. The goal is to validate the core game logic architecture and provide a visual prototype.

The full game design (from archived `core-game` change) specifies: tree-structured node networks, distance-limited connections, resource economy, tick-based simulation, TypeScript full-stack, PixiJS client. This milestone implements the subset needed for the building loop.

## Goals / Non-Goals

**Goals:**
- Working monorepo with TypeScript, shared game logic, PixiJS client
- Player can place root, generator nodes on a flat map
- Nodes auto-connect to nearest friendly node (tree structure)
- Distance-limited connections enforced
- Generators produce resources per tick, displayed in HUD
- Node build costs deducted from player resources
- Local game loop runs ticks in the browser
- Clean visual: map, nodes, edges, health bars, placement UI

**Non-Goals:**
- Combat (turrets, shields, damage) — milestone 2
- Multiplayer/networking — milestone 3
- AI opponent — milestone 4
- Server infrastructure
- Persistence/save/load
- Terrain or map obstacles

## Decisions

### 1. Local-only game loop for milestone 1

The game loop runs entirely in the browser via `setInterval` or `requestAnimationFrame` gated by tick duration. `packages/game/` exposes `simulateTick(state, actions, config)` as a pure function. The client calls it directly — no server in the loop.

This means the same `simulateTick` function will later be called by the server (milestone 3) without modification. The client just swaps its caller.

### 2. Single-player sandbox with manual tick control

For development and testing, the sandbox supports two tick modes:
- **Auto**: ticks run at a configurable interval (default 1 second)
- **Manual**: player clicks "next tick" to advance (useful for debugging)

### 3. PixiJS for rendering

As decided in the archived design. Lightweight 2D canvas rendering with WebGL acceleration. The visual complexity of milestone 1 is low (nodes, edges, text) — PixiJS handles this comfortably.

### 4. Node types for milestone 1

Only root and generator nodes. Turret and shield are deferred to milestone 2.

| Node Type | Cost | Health | Production | Consumption |
|-----------|------|--------|------------|-------------|
| Root      | 0    | 100    | 1/tick     | 0           |
| Generator | 15   | 30     | 3/tick     | 0           |

### 5. Coordinate system

Pixel-based coordinates matching the PixiJS stage. Map is 800x600 by default. Node positions are `{ x: number, y: number }` in pixel space. Distance between nodes is Euclidean distance.

## Risks / Trade-offs

- **[Tick timing accuracy in browser]** → `setInterval` is not perfectly accurate. For sandbox mode this is fine. For multiplayer, the server will own timing (milestone 3).
- **[Scope creep into combat]** → Strictly no combat in this milestone. If the building loop isn't fun standalone, adding combat won't fix it.
- **[PixiJS bundle size]** → PixiJS is ~200KB gzipped. Acceptable for a game. Tree-shaking unused modules can reduce this.
