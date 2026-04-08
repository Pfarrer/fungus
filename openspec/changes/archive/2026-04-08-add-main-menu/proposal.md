## Why

The game currently launches directly into a match with no way to choose a game mode or configure the player. A main menu is needed to let players enter their name, select between single-player and multiplayer modes, and handle multiplayer matchmaking (host or join) before entering gameplay.

## What Changes

- Add a main menu screen shown on application start, before any game begins
- Player name input field persisted across sessions
- Single-player mode option that launches directly into the sandbox/single-player game
- Multiplayer mode option with sub-choices: host a game or join an existing game
- Hosting generates a game code/ID that others can use to join
- Joining accepts a game code to connect to a hosted match
- Host/join responses provide the `matchId` and `playerId` that the client writes into the URL before connecting
- Player names are stored in shared game state so the HUD and result screens can display them
- Navigation flow: Main Menu → Mode Select → Game (with optional matchmaking step for multiplayer)

## Capabilities

### New Capabilities
- `main-menu`: The main menu UI including player name input, mode selection (single-player vs multiplayer), and multiplayer matchmaking flow (host/join with game codes)

### Modified Capabilities
- `sandbox-client`: Client startup will route through the main menu instead of launching directly into a game
- `game-server`: Server will accept match creation requests with a generated game code for the host/join flow

## Impact

- Client app entry point changes to show main menu instead of immediate game
- New UI components/screens for menu, mode select, and matchmaking
- Server needs a matchmaking/lobby endpoint to create matches with shareable codes
- Player identity must be established by the host/join flow and persisted in the URL for refresh/reconnect
- Player name must be passed to the server and stored in shared game state
- Navigation/routing system needed to transition between menu and game screens
- Hosted matches need cleanup if a code is created but no client ever connects
