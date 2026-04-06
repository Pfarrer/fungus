## MODIFIED Requirements

### Requirement: Full HUD display
The HUD SHALL display: connection status, current tick number, resources (current/cap), queued action count with expandable list, tick countdown timer, a mini enemy network overview showing enemy node count by type, and multiplayer presence feedback including reconnect progress and opponent state when applicable.

#### Scenario: Enemy network overview
- **WHEN** the game is running
- **THEN** the HUD displays enemy node counts by type (root, generator, turret, shield)

#### Scenario: Queued actions list
- **WHEN** the player has queued actions
- **THEN** the HUD shows a list of queued action descriptions (e.g., "Place generator at (x, y)")

#### Scenario: Tick countdown timer
- **WHEN** a tick-countdown message is received with secondsRemaining
- **THEN** the HUD displays a countdown timer that updates in real-time

#### Scenario: Presence feedback while reconnecting
- **WHEN** the multiplayer connection is retrying after a disconnect
- **THEN** the HUD shows reconnect progress or a retry timer

#### Scenario: Opponent disconnect indicator
- **WHEN** the remote player disconnects during an active match
- **THEN** the HUD shows that the opponent is disconnected or waiting to return

#### Scenario: Presence returns to normal
- **WHEN** the remote player reconnects successfully
- **THEN** the HUD returns to the normal connected state
