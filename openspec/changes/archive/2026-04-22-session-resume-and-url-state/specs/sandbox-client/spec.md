## MODIFIED Requirements

### Requirement: Menu-first startup
The client SHALL display the main menu on startup instead of immediately connecting to a game server. The existing direct-connect behavior via URL query params (`matchId`, `playerId`) SHALL only activate when the user initiates a game from the menu OR when the client detects both params on load (session resume).

#### Scenario: Fresh load without query params
- **WHEN** the client loads without `matchId` or `playerId` in the URL
- **THEN** the main menu is displayed and no WebSocket connection is established

#### Scenario: Refresh with established multiplayer URL params
- **WHEN** the client loads with `matchId` and `playerId` already present in the URL
- **THEN** the client skips the menu and immediately opens a WebSocket connection to the match using those URL params
- **AND** on successful connection, the current game state is received and play resumes

#### Scenario: Load with stale URL params
- **WHEN** the client loads with `matchId` and `playerId` in the URL but the server indicates the match no longer exists
- **THEN** the client clears the URL params and displays the main menu

#### Scenario: Partial URL params on load
- **WHEN** the client loads with only one of `matchId` or `playerId` in the URL
- **THEN** the main menu is displayed and the incomplete param is ignored

#### Scenario: Player name display in HUD
- **WHEN** the game is running and a player name has been entered
- **THEN** the HUD displays the player's name from the active player entry in `GameState.players`

### Requirement: Match end screen
When a winner is determined, a full-screen overlay SHALL appear displaying the match result, the winner, and a button to start a new match.

#### Scenario: Victory screen
- **WHEN** the current player wins the match
- **THEN** a full-screen overlay appears with "Victory!" text, the winning player's name, and a "New Match" button

#### Scenario: Defeat screen
- **WHEN** the current player loses the match
- **THEN** a full-screen overlay appears with "Defeat!" text and a "New Match" button

#### Scenario: New match button returns to menu
- **WHEN** the player clicks "New Match" on the match end screen
- **THEN** `matchId` and `playerId` are cleared from the URL using `history.replaceState`
- **AND** the main menu screen is displayed (no page reload)

## ADDED Requirements

### Requirement: Auto-reconnect on disconnect
When the WebSocket connection closes unexpectedly during an active multiplayer game, the client SHALL automatically attempt to reconnect using the `matchId` and `playerId` from the URL. Reconnect attempts SHALL use exponential backoff starting at 1 second, capped at 30 seconds, with a maximum of 5 attempts.

#### Scenario: Successful auto-reconnect
- **WHEN** the WebSocket closes unexpectedly during an active multiplayer game
- **AND** `matchId` and `playerId` are present in the URL
- **THEN** the client automatically reconnects after an exponential backoff delay
- **AND** on success, the server sends the current game state and play resumes without user intervention

#### Scenario: Auto-reconnect exhaustion
- **WHEN** the client has failed 5 consecutive reconnect attempts
- **THEN** an error overlay is displayed with a "Return to Menu" button
- **AND** clicking "Return to Menu" clears URL params and shows the main menu

#### Scenario: No auto-reconnect after match end
- **WHEN** the WebSocket closes after a winner has been determined
- **THEN** the client does not attempt auto-reconnect
- **AND** the match end screen is displayed
