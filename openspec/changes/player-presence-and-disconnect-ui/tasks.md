## 1. Connection State and Presence Model

- [ ] 1.1 Add a client-side presence model that distinguishes active play, reconnecting, opponent-disconnected, and abandoned states
- [ ] 1.2 Extend the connection retry flow to expose retry attempt counts and next-attempt timing to the UI
- [ ] 1.3 Add a terminal reconnect-failure signal that the UI can use to switch to the abandoned-match state

## 2. Multiplayer UI States

- [ ] 2.1 Update the HUD to show a visible presence indicator for both players during multiplayer matches
- [ ] 2.2 Show a reconnect countdown or retry indicator while the client is attempting to recover a lost connection
- [ ] 2.3 Show an opponent-left / waiting-for-return state when the remote player disconnects mid-match
- [ ] 2.4 Show an abandoned-match state with a clear return-to-menu action when reconnect attempts are exhausted

## 3. Timing and Recovery Behavior

- [ ] 3.1 Define and wire the client retry window that separates temporary reconnecting from abandoned-match state
- [ ] 3.2 Ensure a successful reconnect clears any presence warning and returns the UI to the connected state
- [ ] 3.3 Ensure single-player mode bypasses all presence/reconnect UI paths

## 4. Tests

- [ ] 4.1 Add tests for the presence state transitions: active -> reconnecting -> active
- [ ] 4.2 Add tests for opponent disconnect and abandoned-match transitions
- [ ] 4.3 Add tests for retry countdown updates and retry exhaustion
- [ ] 4.4 Add tests that single-player mode does not show reconnect or opponent-left UI
