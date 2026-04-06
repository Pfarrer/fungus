## MODIFIED Requirements

### Requirement: WebSocket server
The server SHALL accept WebSocket connections and route them to matches based on match ID parsed from connection query params. The server SHALL also expose HTTP endpoints for match creation (`POST /host`) and match lookup (`GET /join?code=<code>`).

#### Scenario: Player connects with valid params
- **WHEN** a WebSocket connection is opened with `?matchId=abc&playerId=player-1`
- **THEN** the server associates the connection with player-1 in match abc

#### Scenario: Player connects with missing params
- **WHEN** a WebSocket connection is opened without matchId or playerId
- **THEN** the server sends an error message and closes the connection

#### Scenario: HTTP host endpoint creates match
- **WHEN** a client sends `POST /host` with body `{ playerName: "Alice" }`
- **THEN** the server creates a new hosted match reservation, generates a 6-character uppercase alphanumeric game code, stores the mapping, and responds with `{ code: "A3F7K2", matchId: "<uuid>", playerId: "player-1" }`

#### Scenario: HTTP join endpoint validates code
- **WHEN** a client sends `GET /join?code=A3F7K2`
- **THEN** the server responds with `{ valid: true, matchId: "<uuid>", playerId: "player-2" }` if the code maps to an active match
- **AND** the server responds with `{ valid: false }` if no match exists for that code

#### Scenario: HTTP join with missing code
- **WHEN** a client sends `GET /join` without a code parameter
- **THEN** the server responds with HTTP 400

### Requirement: Match lifecycle management
The server SHALL manage matches from creation through completion. A match is created when the first player connects via WebSocket or when a host creates a match via the HTTP endpoint. The host created by `POST /host` SHALL be assigned `player-1`, and the joiner validated by `GET /join` SHALL be assigned `player-2`. The tick loop starts when the second player joins. The match ends when a winner is determined.

#### Scenario: First player joins
- **WHEN** the first player connects to a new match
- **THEN** the server creates the match, sends the initial game state, and sends a waiting notification

#### Scenario: Second player joins
- **WHEN** the second player connects to the existing match
- **THEN** the server starts the tick loop and both players begin receiving tick results

#### Scenario: Match ends
- **WHEN** a tick resolves and the game state has a winner
- **THEN** the server stops the tick loop and broadcasts the final state

#### Scenario: Host creates match via HTTP
- **WHEN** a player calls `POST /host`
- **THEN** a match is created with the generated game code and remains in a waiting state until the assigned host (`player-1`) connects via WebSocket

#### Scenario: Unused host reservation expires
- **WHEN** a match is created via `POST /host` and no WebSocket client connects within the configured host reservation timeout
- **THEN** the server destroys the match and removes the game code mapping

### Requirement: Authoritative tick loop
The server SHALL execute ticks at a configurable interval (`tickDurationMs` from `GameConfig`). On each tick, the server SHALL collect all queued player actions, call `simulateTick`, and broadcast the resulting state to all connected players.

#### Scenario: Tick with actions
- **WHEN** a tick fires and player-1 has queued a PlaceNode action
- **THEN** the server passes the action to simulateTick and broadcasts the new game state to all players

#### Scenario: Tick with no actions
- **WHEN** a tick fires and no player has queued actions
- **THEN** the server still calls simulateTick (empty actions) and broadcasts the resulting state (resources generate, combat resolves, death timers advance)

### Requirement: Disconnection and reconnection
The server SHALL keep matches alive when players disconnect. Disconnected players' action queues SHALL remain empty. On reconnection, the server SHALL send the current full game state and resume accepting actions.

#### Scenario: Player disconnects mid-match
- **WHEN** player-1 disconnects during an active match
- **THEN** the match continues, player-1's queue stays empty, and player-2 continues receiving tick results

#### Scenario: Player reconnects
- **WHEN** player-1 reconnects with the same matchId and playerId
- **THEN** the server sends the current game state and resumes queueing player-1's actions

#### Scenario: Match cleanup
- **WHEN** all players disconnect from a match
- **THEN** the match is destroyed and removed from memory
- **AND** the game code mapping is removed

## ADDED Requirements

### Requirement: Game code generation
The server SHALL generate a unique 6-character uppercase alphanumeric game code for each match created via the `POST /host` endpoint. The code SHALL map to the match's internal `matchId`.

#### Scenario: Code format
- **WHEN** a new match is created via the host endpoint
- **THEN** the generated code is exactly 6 characters long, containing only uppercase letters (A-Z) and digits (0-9)

#### Scenario: Code uniqueness
- **WHEN** multiple matches are created
- **THEN** each match receives a distinct game code

#### Scenario: Code lookup
- **WHEN** a player queries the join endpoint with a valid game code
- **THEN** the server returns the corresponding matchId

### Requirement: Player name association
The server SHALL accept and store a `playerName` query parameter on WebSocket connections. The player name SHALL be associated with the player in the match and persisted in shared game state.

#### Scenario: Connect with player name
- **WHEN** a WebSocket connection is opened with `?matchId=abc&playerId=player-1&playerName=Alice`
- **THEN** the server associates the name "Alice" with player-1 in the match
- **AND** the `GameState.players` entry for `player-1` is updated to include `name: "Alice"`

#### Scenario: Connect without player name
- **WHEN** a WebSocket connection is opened without a playerName parameter
- **THEN** the server uses the playerId as the display name
- **AND** the `GameState.players` entry uses that fallback name
