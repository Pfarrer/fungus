## ADDED Requirements

### Requirement: URL param write on game start
The client SHALL write `matchId` and `playerId` to the browser URL query string using `history.replaceState` immediately after receiving a successful host or join response from the server. The URL SHALL be updated before the WebSocket connection is opened.

#### Scenario: Host writes URL params
- **WHEN** the client receives a successful response from `POST /host` containing `matchId` and `playerId`
- **THEN** the client writes both values to the URL query string via `history.replaceState`
- **AND** no new browser history entry is created
- **AND** the WebSocket connection is opened using the URL params

#### Scenario: Join writes URL params
- **WHEN** the client receives a successful response from `GET /join?code=XXX` containing `matchId` and `playerId`
- **THEN** the client writes both values to the URL query string via `history.replaceState`
- **AND** no new browser history entry is created
- **AND** the WebSocket connection is opened using the URL params

#### Scenario: Single-player does not write URL params
- **WHEN** the player starts a single-player game
- **THEN** no `matchId` or `playerId` is written to the URL
- **AND** the URL remains at the root path with no query params

### Requirement: URL param clear on return to menu
The client SHALL clear `matchId` and `playerId` from the URL query string using `history.replaceState` whenever the player returns to the main menu.

#### Scenario: Return to menu after match ends
- **WHEN** a match ends and the player clicks "New Match"
- **THEN** `matchId` and `playerId` are removed from the URL
- **AND** the main menu is displayed

#### Scenario: Return to menu after connection failure
- **WHEN** the client fails to connect or reconnect and shows a "Return to Menu" option
- **THEN** clicking "Return to Menu" clears `matchId` and `playerId` from the URL
- **AND** the main menu is displayed

#### Scenario: Return to menu during hosting
- **WHEN** the player cancels out of the hosting/waiting screen
- **THEN** any previously written `matchId` and `playerId` are cleared from the URL
- **AND** the main menu is displayed

### Requirement: URL param detection on load
On application load, the client SHALL read `matchId` and `playerId` from the URL query string. If both are present and non-empty, the client SHALL skip the menu and attempt to reconnect to the match. If either is absent or empty, the client SHALL show the main menu.

#### Scenario: Load with valid URL params
- **WHEN** the application loads and both `matchId` and `playerId` are present in the URL
- **THEN** the client skips the main menu and immediately opens a WebSocket connection to the match using those params

#### Scenario: Load without URL params
- **WHEN** the application loads and `matchId` or `playerId` is absent from the URL
- **THEN** the main menu is displayed

#### Scenario: Load with partial URL params
- **WHEN** the application loads and only one of `matchId` or `playerId` is present
- **THEN** the main menu is displayed and the incomplete param is ignored

### Requirement: Stale URL param fallback
When the client loads with URL params but the server rejects the connection (match not found, match ended, or server unreachable), the client SHALL clear the URL params and show the main menu.

#### Scenario: Match no longer exists on server
- **WHEN** the client loads with `matchId` and `playerId` in the URL
- **AND** the server responds that the match does not exist or has ended
- **THEN** the client clears `matchId` and `playerId` from the URL
- **AND** the main menu is displayed

#### Scenario: Server unreachable on load
- **WHEN** the client loads with URL params and the WebSocket connection cannot be established
- **THEN** the client shows a connection error with an option to return to the menu
- **AND** returning to the menu clears the URL params

### Requirement: Auto-reconnect on WebSocket disconnect
When the WebSocket connection closes unexpectedly during an active multiplayer game and URL params are present, the client SHALL automatically attempt to reconnect. Reconnect attempts SHALL use exponential backoff starting at 1 second, capped at 30 seconds, with a maximum of 5 attempts.

#### Scenario: Transient disconnect with successful reconnect
- **WHEN** the WebSocket closes unexpectedly during a multiplayer game
- **THEN** the client automatically attempts to reconnect after 1 second
- **AND** subsequent retries double the delay (2s, 4s, 8s...) up to a 30-second cap
- **AND** on successful reconnect, the server sends the current game state and play resumes

#### Scenario: Reconnect exhaustion
- **WHEN** the client has attempted 5 reconnects without success
- **THEN** the client stops retrying and displays an error overlay with a "Return to Menu" button
- **AND** clicking "Return to Menu" clears the URL params and shows the main menu

#### Scenario: No auto-reconnect after match end
- **WHEN** the WebSocket closes after a match has ended (winner determined)
- **THEN** the client does not attempt auto-reconnect
- **AND** the match end screen is displayed normally

#### Scenario: No auto-reconnect in single-player
- **WHEN** the game is running in single-player mode
- **THEN** auto-reconnect is not applicable (no WebSocket connection)

### Requirement: URL is the single source of truth
The URL query string SHALL be the sole mechanism for persisting active session identity between page loads. No additional client-side storage (localStorage, sessionStorage, IndexedDB) SHALL be used for `matchId` or `playerId`.

#### Scenario: Refresh preserves multiplayer session
- **WHEN** the player refreshes the browser during an active multiplayer game
- **THEN** the URL params are preserved by the browser
- **AND** the client reads them on load and reconnects to the match

#### Scenario: New tab opens menu
- **WHEN** the player opens the app in a new browser tab
- **THEN** no URL params are present and the main menu is displayed
