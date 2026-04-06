## Why

The server already supports reconnecting matches, but the client only exposes a generic disconnected state. Players need clearer feedback when an opponent drops, how long the game will keep trying to reconnect, and whether a match is still resumable or effectively over.

## What Changes

- Add explicit presence UI for connected, reconnecting, disconnected, and returned states
- Show a reconnect timer/countdown while the client retries a lost connection
- Show an opponent-left state when the other player disconnects mid-match
- Define the timeout path when a disconnected player does not return
- Keep the current match alive during the reconnect window, then surface a clear end or abandon state if recovery fails

## Capabilities

### New Capabilities
- `player-presence-ui`: UI and state rules for player presence indicators, reconnect timers, opponent-left messaging, and abandonment handling

### Modified Capabilities
- `sandbox-client`: Update gameplay UI requirements so disconnect/reconnect states are visible and actionable during multiplayer sessions

## Impact

- Client HUD and overlay flow
- Connection-status messaging and retry behavior
- Match-end / opponent-left presentation
- Client-side tests around disconnect and reconnect UX
