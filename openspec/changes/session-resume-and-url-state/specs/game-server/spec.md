## MODIFIED Requirements

### Requirement: Disconnection and reconnection
The server SHALL keep matches alive when players disconnect. Disconnected players' action queues SHALL remain empty. On reconnection, the server SHALL send the current full game state and resume accepting actions. When a player reconnects with the same `matchId` and `playerId`, the server SHALL replace the old WebSocket connection with the new one and resume normal tick processing.

#### Scenario: Player disconnects mid-match
- **WHEN** player-1 disconnects during an active match
- **THEN** the match continues, player-1's queue stays empty, and player-2 continues receiving tick results

#### Scenario: Player reconnects
- **WHEN** player-1 reconnects with the same matchId and playerId
- **THEN** the server replaces the old connection with the new one
- **AND** the server sends the current game state and resumes queueing player-1's actions

#### Scenario: Reconnect replaces stale connection
- **WHEN** a player's previous WebSocket is still technically open but a new connection arrives with the same matchId and playerId
- **THEN** the server closes the old WebSocket and associates the new one with the player

#### Scenario: Match cleanup
- **WHEN** all players disconnect from a match
- **THEN** the match is destroyed and removed from memory
- **AND** the game code mapping is removed

#### Scenario: Reconnect to non-existent match
- **WHEN** a client connects with a matchId that does not exist
- **THEN** the server sends an error message indicating the match was not found and closes the connection
