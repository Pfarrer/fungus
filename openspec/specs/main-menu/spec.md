# main-menu Specification

## Purpose
Main menu interface that provides game mode selection, player name entry, and navigation between single-player, host, and join game flows.

## Requirements

### Requirement: Main menu screen
The client SHALL display a main menu screen on application start, before any game connection is established. The main menu SHALL present the game title, a player name input field, and buttons for "Single Player" and "Multiplayer" modes.

#### Scenario: Application starts
- **WHEN** the client application loads
- **THEN** the main menu screen is displayed with the game title, player name input, and mode selection buttons

#### Scenario: Player name persistence
- **WHEN** the player enters a name and navigates away from the main menu
- **THEN** the name is saved to localStorage under the key `fungus-player-name`
- **AND** on subsequent app loads, the name input is pre-filled with the saved name

#### Scenario: Player name required
- **WHEN** the player attempts to start any mode without entering a name
- **THEN** the name input is highlighted and the player cannot proceed

### Requirement: Single-player mode
The main menu SHALL offer a "Single Player" button that starts a local sandbox game. The game SHALL run a local tick simulation without requiring a server connection.

#### Scenario: Start single-player game
- **WHEN** the player clicks "Single Player" with a valid name entered
- **THEN** the main menu is hidden, the game canvas is shown, and a local game simulation begins with the player's name

#### Scenario: Local tick simulation
- **WHEN** the single-player game is running
- **THEN** game ticks are simulated locally using `simulateTick` from `@fungus/game` at the configured tick interval
- **AND** the player can place nodes and interact with the game as in multiplayer

### Requirement: Multiplayer mode selection
The main menu SHALL offer a "Multiplayer" button that shows sub-options for "Host Game" and "Join Game".

#### Scenario: Select multiplayer
- **WHEN** the player clicks "Multiplayer" with a valid name entered
- **THEN** the main menu shows "Host Game" and "Join Game" buttons, and a "Back" button to return to the main menu

#### Scenario: Back to main menu
- **WHEN** the player clicks "Back" from the multiplayer sub-menu
- **THEN** the main menu is displayed again

### Requirement: Host game
The multiplayer "Host Game" option SHALL create a new match on the server and display a game code that other players can use to join.

#### Scenario: Host creates match
- **WHEN** the player clicks "Host Game"
- **THEN** the client sends a request to the server to create a new match
- **AND** the server responds with a 6-character alphanumeric game code
- **AND** the server response includes the host `matchId` and `playerId`
- **AND** the client writes `matchId` and `playerId` into the URL before starting gameplay
- **AND** the client displays the game code on screen

#### Scenario: Host waiting for opponent
- **WHEN** the host's match is created and no opponent has joined
- **THEN** the client shows a waiting screen with the game code and a "Waiting for opponent..." message

#### Scenario: Opponent joins hosted game
- **WHEN** an opponent joins using the game code
- **THEN** the waiting screen is dismissed and the game begins

### Requirement: Join game
The multiplayer "Join Game" option SHALL allow a player to enter a game code and connect to an existing match.

#### Scenario: Join screen displayed
- **WHEN** the player clicks "Join Game"
- **THEN** the client shows a text input for the game code and a "Connect" button

#### Scenario: Join with valid code
- **WHEN** the player enters a valid game code and clicks "Connect"
- **THEN** the client receives the joiner `matchId` and `playerId` for that match
- **AND** the client writes `matchId` and `playerId` into the URL before starting gameplay
- **AND** the client connects to the server using the URL `matchId` and `playerId`
- **AND** the game begins

#### Scenario: Join with invalid code
- **WHEN** the player enters a game code that does not match any active match
- **THEN** the client displays an error message indicating the game code is invalid

#### Scenario: Join with empty code
- **WHEN** the player clicks "Connect" without entering a game code
- **THEN** the input is highlighted and the player cannot proceed

### Requirement: Screen navigation
The client SHALL manage screen navigation between menu states and the game using a state machine with states: `menu`, `multiplayer-select`, `hosting`, `joining`, `playing`.

#### Scenario: Navigate from menu to hosting
- **WHEN** the player selects Host Game
- **THEN** the screen state transitions from `menu` → `multiplayer-select` → `hosting`

#### Scenario: Navigate from menu to joining
- **WHEN** the player selects Join Game
- **THEN** the screen state transitions from `menu` → `multiplayer-select` → `joining`

#### Scenario: Navigate to playing
- **WHEN** a game session starts (single-player or multiplayer)
- **THEN** the screen state transitions to `playing` and the game canvas becomes visible

#### Scenario: Return to menu from game
- **WHEN** a multiplayer match ends and the player clicks "New Match" or equivalent
- **THEN** the player returns to the main menu screen
