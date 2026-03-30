## Why

The client currently jumps directly into a multiplayer game with hardcoded WebSocket URL, player ID, and match ID (from URL params). There is no way to play solo against pre-built scenarios or to choose which server to connect to. A main menu is needed so players can choose between single player (scenario-based) and multiplayer (server-based) game modes before entering the game.

## What Changes

- Add a main menu screen that appears on launch, replacing the current direct-to-game flow
- Single player mode: display a list of built-in scenarios for the player to select before starting a local game
- Multiplayer mode: provide a text input for the backend server URL, with player ID and match ID inputs, before connecting via WebSocket
- After mode selection and configuration, transition into the existing game view
- The game renderer and connection logic remain unchanged; the menu orchestrates which path to take

## Capabilities

### New Capabilities
- `main-menu`: The main menu screen with mode selection (single player vs multiplayer), scenario browser, and server URL input
- `single-player-mode`: Local game loop that runs a scenario without a backend server, using the game engine's `simulateTick` directly in the browser
- `multiplayer-mode`: Configurable WebSocket connection flow where the user enters server URL, player ID, and match ID before connecting

### Modified Capabilities

## Impact

- `src/main.ts`: Major refactor — extract game init into separate paths triggered by menu selection instead of auto-starting
- `src/connection.ts`: No changes needed (already accepts URL via constructor)
- `index.html`: Minor — may need a menu container element or dynamic DOM creation
- Dependencies: `@fungus/game` already exports `builtInScenarios`, `loadScenario`, `simulateTick`, and `processActions` — no new dependencies needed
- The existing DOM-based UI creation pattern (`createUI`, `updateHUD`) will be extended for menu screens
