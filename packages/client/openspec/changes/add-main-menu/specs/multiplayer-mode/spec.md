## ADDED Requirements

### Requirement: Configurable server URL
The multiplayer mode SHALL allow the player to specify the backend server URL before connecting.

#### Scenario: Custom server URL
- **WHEN** the user enters a server URL in the multiplayer configuration and starts the game
- **THEN** a `GameConnection` SHALL be created with the specified URL and `connect()` SHALL be called

#### Scenario: Default server URL
- **WHEN** the user does not modify the server URL field
- **THEN** the default value `ws://localhost:3001` SHALL be used

### Requirement: Configurable player and match IDs
The multiplayer mode SHALL allow the player to specify their player ID and match ID.

#### Scenario: Custom player and match IDs
- **WHEN** the user enters player ID and match ID values
- **THEN** those values SHALL be used when establishing the connection and throughout the game session

#### Scenario: Default player and match IDs
- **WHEN** the user does not modify the player ID and match ID fields
- **THEN** default values SHALL be used (`player-1` and `match-1`)

### Requirement: Connection status feedback
The multiplayer mode SHALL display connection status to the player as it does currently.

#### Scenario: Connection status shown
- **WHEN** the multiplayer game is connecting or connected
- **THEN** the HUD SHALL display the current connection status (connected, reconnecting, disconnected)
