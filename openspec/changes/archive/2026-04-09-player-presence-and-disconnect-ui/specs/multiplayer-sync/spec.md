## MODIFIED Requirements

### Requirement: WebSocket connection
The client SHALL connect to the server via WebSocket. The server SHALL accept WebSocket connections and associate each connection with a player in a match.

#### Scenario: Remote player disconnect notification
- **WHEN** one player disconnects from an active multiplayer match while another player remains connected
- **THEN** the server sends a presence notification to the remaining connected player identifying the disconnected player
- **AND** the message indicates that the player is no longer connected

#### Scenario: Remote player reconnect notification
- **WHEN** a previously disconnected player reconnects to an active multiplayer match
- **THEN** the server sends a presence notification to the other connected player identifying the returning player
- **AND** the message indicates that the player is connected again
