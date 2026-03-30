## 1. Menu Module

- [ ] 1.1 Create `src/menu.ts` with a `GameMenu` class that creates and manages the main menu DOM
- [ ] 1.2 Implement main menu screen with game title and Single Player / Multiplayer mode buttons
- [ ] 1.3 Implement scenario selection sub-screen that reads from `builtInScenarios` and displays name + description for each
- [ ] 1.4 Implement multiplayer configuration sub-screen with input fields for server URL (default `ws://localhost:3001`), player ID (default `player-1`), and match ID (default `match-1`)
- [ ] 1.5 Add back navigation buttons on both sub-screens to return to mode selection
- [ ] 1.6 Style the menu using the existing dark theme colors (`#1a1a2e`, `#16213e`, `#e94560`, `#4a4e69`, `#e0e0e0`)
- [ ] 1.7 Expose callback-based API: `onStartSinglePlayer(scenario)`, `onStartMultiplayer(config)` so `main.ts` can react to menu selections

## 2. Local Game Module

- [ ] 2.1 Create `src/local-game.ts` with a `LocalGame` class that manages a single-player game loop
- [ ] 2.2 Implement `start(scenario)` that calls `loadScenario(defaultGameConfig, scenario)` to create initial state
- [ ] 2.3 Implement tick loop using `setInterval` at `tickDurationMs` that calls `simulateTick` with queued actions and updates game state
- [ ] 2.4 Expose `queueActions(actions)` method matching the multiplayer action queue pattern
- [ ] 2.5 Render game state after each tick using `GameRenderer.render`
- [ ] 2.6 Detect win/loss condition from `gameState.winner` after each tick and display result
- [ ] 2.7 Implement `destroy()` to clear the interval and clean up

## 3. Refactor main.ts

- [ ] 3.1 Extract multiplayer game initialization into a `startMultiplayerGame(serverUrl, playerId, matchId)` function
- [ ] 3.2 Extract renderer initialization into a shared `initGameView()` function used by both modes
- [ ] 3.3 Change `init()` to show the menu on launch instead of auto-starting a multiplayer game
- [ ] 3.4 Wire menu's `onStartSinglePlayer` callback to initialize `LocalGame` with the selected scenario
- [ ] 3.5 Wire menu's `onStartMultiplayer` callback to initialize `GameConnection` with the provided URL/IDs
- [ ] 3.6 Add "Back to Menu" button to the in-game HUD that tears down the current game and shows the menu again

## 4. Verification

- [ ] 4.1 Verify main menu appears on launch with mode selection
- [ ] 4.2 Verify single player scenario selection lists all built-in scenarios
- [ ] 4.3 Verify single player game runs locally with tick-based simulation
- [ ] 4.4 Verify multiplayer mode connects to user-specified server URL
- [ ] 4.5 Verify back navigation works on all screens
- [ ] 4.6 Verify "Back to Menu" from in-game works for both modes
- [ ] 4.7 Run `npm run build` to verify no type or compilation errors
