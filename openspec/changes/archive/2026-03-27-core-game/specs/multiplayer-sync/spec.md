## ADDED Requirements

### Requirement: WebSocket connection
The client SHALL connect to the server via WebSocket. The server SHALL accept WebSocket connections and associate each connection with a player in a match.

#### Scenario: Client connects
- **WHEN** a client opens a WebSocket connection to the server with a valid match/player identifier
- **THEN** the server accepts the connection and sends the current game state

#### Scenario: Reconnection
- **WHEN** a disconnected client reconnects to the server
- **THEN** the server sends the current game state so the client can resume

### Requirement: Action submission protocol
Clients SHALL send queued actions to the server via WebSocket messages. The message format SHALL be `{ type: "queue-actions", actions: Action[] }`.

#### Scenario: Queue actions message
- **WHEN** a client sends `{ type: "queue-actions", actions: [{ type: "PlaceNode", nodeType: "generator", position: { x: 5, y: 3 } }] }`
- **THEN** the server appends those actions to the player's queue for the current tick

### Requirement: State broadcast protocol
The server SHALL broadcast the full game state to all connected clients after each tick resolves. The message format SHALL be `{ type: "tick-result", state: GameState, tick: number }`.

#### Scenario: Tick result broadcast
- **WHEN** a tick completes simulation
- **THEN** the server sends `{ type: "tick-result", state: <new state>, tick: <tick number> }` to all connected clients

### Requirement: Tick countdown notification
The server SHALL send a countdown notification to clients indicating time remaining until the next tick. The message format SHALL be `{ type: "tick-countdown", secondsRemaining: number }`.

#### Scenario: Countdown before tick
- **WHEN** a tick is configured for 5 seconds and 2 seconds have elapsed
- **THEN** the server sends `{ type: "tick-countdown", secondsRemaining: 3 }` to all connected clients

### Requirement: Client statelessness
Clients SHALL NOT own game state. All game logic decisions SHALL be made by the server. Clients SHALL only render state received from the server and send action requests.

#### Scenario: Client restarts
- **WHEN** a client refreshes or reconnects
- **THEN** the client receives the full current game state and resumes rendering with no local state dependency
