## MODIFIED Requirements

### Requirement: State broadcast protocol
The server SHALL broadcast the full game state to all connected clients after each tick resolves. The message format SHALL be `{ type: "tick-result", gameState: GameState }`.

#### Scenario: Tick result broadcast
- **WHEN** a tick completes simulation
- **THEN** the server sends `{ type: "tick-result", gameState: <new state> }` to all connected clients
