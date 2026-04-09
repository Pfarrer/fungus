# player-presence-ui Specification

## Purpose
Defines the client UI requirements for multiplayer player presence, reconnect progress, opponent disconnect state, and abandoned-match recovery behavior.

## Requirements

### Requirement: Player presence indicator
The client SHALL display the current multiplayer presence state for each player during an active match.

#### Scenario: Both players connected
- **WHEN** both players are connected to the match
- **THEN** the UI shows both players as connected/active

#### Scenario: Remote player disconnects
- **WHEN** the remote player disconnects during a live match
- **THEN** the UI marks that player as disconnected
- **AND** the match remains in a resumable state

### Requirement: Reconnect countdown
When a multiplayer connection drops unexpectedly, the client SHALL show a reconnect countdown or retry indicator while automatic reconnect attempts are in progress.

#### Scenario: Reconnect retries in progress
- **WHEN** the client is retrying a lost multiplayer connection
- **THEN** the UI shows that reconnection is in progress
- **AND** the UI shows a retry countdown or next-attempt timer

#### Scenario: Retry timer updates
- **WHEN** the reconnect timer advances
- **THEN** the countdown display updates without requiring user input

### Requirement: Opponent-left state
The client SHALL display an opponent-left state when the remote player disconnects and the match is still recoverable.

#### Scenario: Opponent disconnects mid-match
- **WHEN** the opponent drops during an active multiplayer match
- **THEN** the UI shows an opponent-left or waiting-for-return state
- **AND** local gameplay remains paused or clearly marked as waiting on recovery

### Requirement: Abandoned match state
If the remote player does not return within the configured retry window, the client SHALL transition to an abandoned-match state and offer an explicit path back to the menu.

#### Scenario: Retry window expires
- **WHEN** the reconnect attempts fail until the retry window is exhausted
- **THEN** the UI shows that the match could not be recovered
- **AND** the player is offered a clear way to return to the menu

#### Scenario: Player returns before timeout
- **WHEN** the remote player reconnects before the retry window expires
- **THEN** the abandoned-match state is not shown
- **AND** the match resumes normally
