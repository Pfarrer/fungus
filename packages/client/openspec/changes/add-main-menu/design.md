## Context

The client is a browser-based game built with PixiJS and Vite. Currently, `src/main.ts` auto-initializes the renderer, establishes a WebSocket connection to a hardcoded URL (`ws://localhost:3001`), and immediately enters multiplayer gameplay. The `@fungus/game` package already exports `builtInScenarios`, `loadScenario`, `simulateTick`, and `processActions` — all the building blocks needed for a local single-player mode. The existing codebase uses vanilla DOM manipulation for UI (HUD, palette, controls) rather than a framework.

## Goals / Non-Goals

**Goals:**
- Add a main menu screen shown on launch before any game starts
- Let users choose single player (scenario selection) or multiplayer (server URL input)
- Single player runs the game loop locally using `simulateTick` with no WebSocket
- Multiplayer connects to a user-specified backend server URL
- Reuse existing `GameRenderer` and DOM-based UI patterns

**Non-Goals:**
- Account system, authentication, or user profiles
- Lobby system or matchmaking
- Custom scenario editor
- Saving/loading game state
- Animated transitions between menu and game screens

## Decisions

### 1. DOM-based menu (no framework)

Use the existing pattern of creating DOM elements via TypeScript, matching the style of `createUI()` and `updateHUD()`.

**Rationale**: The codebase already uses vanilla DOM for all UI. Adding a framework would be a large dependency for a single screen. Consistency with existing patterns keeps the codebase simple.

**Alternative considered**: A dedicated UI library (React, Vue) — rejected due to bundle size and codebase inconsistency.

### 2. Single player uses `setInterval` tick loop

Run `simulateTick` on a fixed interval in the browser, driven by `GameConfig.tickDurationMs`.

**Rationale**: The game engine's `simulateTick` is synchronous and pure — it takes a `GameState` and returns a new one. No server is needed. `setInterval` keeps it simple.

**Alternative considered**: `requestAnimationFrame` with delta-time accumulation — more precise but unnecessary for a turn-tick game.

### 3. Menu as a separate screen with full teardown on transition

When the user starts a game, destroy the menu DOM completely and initialize the game view. A "Back to Menu" option resets state and shows the menu again.

**Rationale**: Avoids complexity of showing/hiding game state. Clean separation between menu and game lifecycle.

### 4. Multiplayer URL input with sensible default

Pre-fill the server URL field with `ws://localhost:3001` and player/match IDs with generated defaults, matching current behavior.

**Rationale**: Reduces friction for local development while allowing production server URLs.

### 5. New file: `src/menu.ts` for menu logic

Extract all menu creation and event handling into a dedicated module, keeping `main.ts` as the orchestrator that switches between menu and game modes.

**Rationale**: Separation of concerns. `main.ts` already has 420 lines — extracting menu logic keeps it manageable.

### 6. New file: `src/local-game.ts` for single-player tick loop

Encapsulate the local tick simulation loop so `main.ts` can start either a local or multiplayer game cleanly.

**Rationale**: The local game loop needs its own state management (interval handle, action queue, tick timing) separate from the WebSocket-based multiplayer flow.

## Risks / Trade-offs

- **[Tick timing drift]** `setInterval` may drift under heavy load → Acceptable for a single-player game; tick rate is 1 second which is very forgiving
- **[No pause/resume in single player]** Initial version won't support pausing → Can be added later with minimal changes to the tick loop
- **[Menu DOM styling]** Hand-rolled CSS for the menu may look rough → Use the same dark theme colors already defined in the codebase (`#1a1a2e`, `#16213e`, `#e94560`, etc.) for visual consistency
