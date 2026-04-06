## 1. Server: HTTP Endpoints & Game Codes

- [ ] 1.1 Add `generateGameCode()` utility function that produces a random 6-character uppercase alphanumeric string
- [ ] 1.2 Add game code → matchId mapping storage to `MatchManager` with `createMatchWithCode()` and `lookupCode()` methods
- [ ] 1.3 Refactor `createServer()` to create an HTTP server and attach the WebSocket server to it (upgrade from HTTP)
- [ ] 1.4 Implement `POST /host` endpoint that creates a match, generates a game code, and returns `{ code, matchId, playerId }`
- [ ] 1.5 Implement `GET /join?code=XXX` endpoint that validates the code and returns `{ valid, matchId, playerId }` or `{ valid: false }`
- [ ] 1.6 Add `playerName` query param handling on WebSocket connections, storing it with the player in the match
- [ ] 1.7 Remove game code mapping when a match is destroyed (cleanup on all-player disconnect)
- [ ] 1.8 Add timeout cleanup for hosted matches that never receive their first WebSocket connection

## 2. Server: Protocol Updates

- [ ] 2.1 Add `playerName` field to `ClientConnection` interface in `protocol.ts`
- [ ] 2.2 Update `parseQueryParams()` to extract `playerName` from the WebSocket connection URL
- [ ] 2.3 Update server connection handler to pass `playerName` through to `MatchManager.handleConnect()`
- [ ] 2.4 Add shared `Player.name` field in `@fungus/game` and propagate it through initial state and server updates

## 3. Client: Screen Navigation & Menu UI

- [ ] 3.1 Create a `ScreenManager` module with state machine: `menu` → `multiplayer-select` → `hosting` → `joining` → `playing`
- [ ] 3.2 Build the main menu screen HTML/CSS: game title, player name input (pre-filled from localStorage), "Single Player" button, "Multiplayer" button
- [ ] 3.3 Add player name validation (non-empty required) with visual feedback
- [ ] 3.4 Save player name to localStorage on any navigation action
- [ ] 3.5 Build the multiplayer sub-menu screen: "Host Game" button, "Join Game" button, "Back" button
- [ ] 3.6 Build the hosting/waiting screen: display game code, "Waiting for opponent..." message
- [ ] 3.7 Build the join screen: game code input field, "Connect" button, error display for invalid codes

## 4. Client: Single-Player Game Loop

- [ ] 4.1 Create a `LocalGameLoop` class that runs `simulateTick` from `@fungus/game` at the configured tick interval
- [ ] 4.2 Implement local action queuing: actions are collected and passed to `simulateTick` each tick
- [ ] 4.3 Integrate `LocalGameLoop` with the existing renderer and HUD, producing `GameState` updates identical to server ticks

## 5. Client: Multiplayer Connection Flow

- [ ] 5.1 Implement "Host Game" flow: call `POST /host`, write returned `matchId` and `playerId` into the URL, display returned game code, and connect WebSocket using the URL params
- [ ] 5.2 Implement "Join Game" flow: call `GET /join?code=XXX`, on success write returned `matchId` and `playerId` into the URL, and connect WebSocket using the URL params
- [ ] 5.3 Pass `playerName` on WebSocket connection alongside the `matchId` and `playerId` stored in the URL
- [ ] 5.4 Handle join errors: display "Invalid game code" message when server returns `{ valid: false }`

## 6. Client: Refactor Entry Point

- [ ] 6.1 Refactor `main.ts` to show the menu on load instead of immediately connecting to a WebSocket
- [ ] 6.2 Remove hardcoded fallback `PLAYER_ID` / `MATCH_ID`; preserve URL query params as the canonical source once menu flow establishes them
- [ ] 6.3 Wire the "New Match" button on the match-end screen to return to the main menu instead of reloading the page
- [ ] 6.4 Display the player name in the HUD during gameplay

## 7. Tests

- [ ] 7.1 Add server tests for `POST /host` endpoint (creates match, returns valid code format)
- [ ] 7.2 Add server tests for `GET /join` endpoint (valid code returns matchId, invalid code returns false)
- [ ] 7.3 Add server tests for game code uniqueness across multiple matches
- [ ] 7.4 Add server tests for game code cleanup on match destruction
- [ ] 7.5 Add server tests for `playerName` handling on WebSocket connection
- [ ] 7.6 Add server tests that `/host` and `/join` assign deterministic `playerId` values (`player-1` for host, `player-2` for joiner)
- [ ] 7.7 Add server tests for cleanup of hosted matches that never receive an initial WebSocket connection
- [ ] 7.8 Add shared-state tests for player name propagation into `GameState.players`
- [ ] 7.9 Add client tests for `ScreenManager` state transitions
- [ ] 7.10 Add client tests for `LocalGameLoop` tick execution and action queuing
- [ ] 7.11 Add client tests for player name persistence in localStorage
