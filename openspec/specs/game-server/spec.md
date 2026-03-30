# game-server Specification

## Purpose
Authoritative multiplayer server that manages matches, drives the tick loop, and broadcasts game state to connected clients via WebSocket.

## Requirements
### Requirement: WebSocket server
The server SHALL accept WebSocket connections and route them to matches based on match ID parsed from connection query params.

#### Scenario: Player connects with valid params
- **WHEN** a WebSocket connection is opened with `?matchId=abc&playerId=player-1`
- **THEN** the server associates the connection with player-1 in match abc

#### Scenario: Player connects with missing params
- **WHEN** a WebSocket connection is opened without matchId or playerId
- **THEN** the server sends an error message and closes the connection

### Requirement: Match lifecycle management
The server SHALL manage matches from creation through completion. A match is created when the first player connects. The tick loop starts when the second player joins. The match ends when a winner is determined.

#### Scenario: First player joins
- **WHEN** the first player connects to a new match
- **THEN** the server creates the match, sends the initial game state, and sends a waiting notification

#### Scenario: Second player joins
- **WHEN** the second player connects to the existing match
- **THEN** the server starts the tick loop and both players begin receiving tick results

#### Scenario: Match ends
- **WHEN** a tick resolves and the game state has a winner
- **THEN** the server stops the tick loop and broadcasts the final state

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
