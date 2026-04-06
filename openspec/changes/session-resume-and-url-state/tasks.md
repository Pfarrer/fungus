## 1. Client: URL State Helpers

- [ ] 1.1 Create a `urlState.ts` module with helper functions: `writeSessionToUrl(matchId, playerId)` using `history.replaceState`, `clearSessionFromUrl()` using `history.replaceState`, and `readSessionFromUrl()` returning `{ matchId: string | null, playerId: string | null }`
- [ ] 1.2 Add unit tests for `writeSessionToUrl` — verifies URL query string contains both params, no history entry created
- [ ] 1.3 Add unit tests for `clearSessionFromUrl` — verifies params are removed from URL
- [ ] 1.4 Add unit tests for `readSessionFromUrl` — covers both params present, one missing, both missing

## 2. Client: Session Resume on Load

- [ ] 2.1 Refactor `main.ts` entry point to call `readSessionFromUrl()` on load; if both params present, skip menu and call `setupConnection()` directly with those params; otherwise show the main menu
- [ ] 2.2 Remove the module-scope hardcoded `PLAYER_ID` and `MATCH_ID` constants; derive them dynamically from URL params or menu flow
- [ ] 2.3 Add connection error handling in the session-resume path: if WebSocket fails during resume (match not found or server unreachable), clear URL params via `clearSessionFromUrl()` and fall back to the main menu
- [ ] 2.4 Add handling for partial URL params (only `matchId` or only `playerId`): ignore and show the menu

## 3. Client: URL Write on Game Start

- [ ] 3.1 In the "Host Game" flow, after receiving a successful `POST /host` response, call `writeSessionToUrl(matchId, playerId)` before opening the WebSocket connection
- [ ] 3.2 In the "Join Game" flow, after receiving a successful `GET /join?code=XXX` response, call `writeSessionToUrl(matchId, playerId)` before opening the WebSocket connection
- [ ] 3.3 Ensure single-player mode does not call `writeSessionToUrl` — verify URL remains clean during local games

## 4. Client: URL Clear on Return to Menu

- [ ] 4.1 Update the "New Match" button on the match-end screen to call `clearSessionFromUrl()` and navigate to the main menu (remove `window.location.reload()` call)
- [ ] 4.2 Add `clearSessionFromUrl()` call when the player cancels out of the hosting/waiting screen back to the menu
- [ ] 4.3 Add `clearSessionFromUrl()` call when returning to menu from the connection-failure error overlay

## 5. Client: Auto-Reconnect on Disconnect

- [ ] 5.1 Add reconnect state to `GameConnection`: track whether the game is active (not ended), count reconnect attempts, and store backoff timer
- [ ] 5.2 On WebSocket `close` event during an active game, trigger reconnect attempt: create a new WebSocket with the same URL params after exponential backoff delay (1s initial, doubling, 30s cap, max 5 attempts)
- [ ] 5.3 On successful reconnect, the existing `match-state` handler delivers the current state — verify no additional action needed beyond re-establishing the socket
- [ ] 5.4 On reconnect exhaustion (5 failed attempts), emit a `reconnect-failed` event that the UI layer uses to show an error overlay with "Return to Menu" button
- [ ] 5.5 Ensure auto-reconnect is suppressed when the match has ended (winner determined) — do not attempt reconnect after clean game-over disconnect
- [ ] 5.6 Add a visual indicator (e.g., "Reconnecting..." text in the HUD) during reconnect attempts so the player knows the connection was lost

## 6. Server: Reconnect Robustness

- [ ] 6.1 Verify/update server behavior: when a player reconnects with the same `matchId` and `playerId`, close the old stale WebSocket and associate the new connection with the player
- [ ] 6.2 Verify/update server behavior: when a client connects with a `matchId` that does not map to any active match, send an error message (e.g., `{ type: "error", message: "Match not found" }`) and close the WebSocket
- [ ] 6.3 Ensure match cleanup (all players disconnected) still removes game code mappings as defined in the existing spec

## 7. Tests

- [ ] 7.1 Add client tests for session resume on load with valid URL params — verifies WebSocket opens immediately without showing menu
- [ ] 7.2 Add client tests for session resume fallback — verifies URL params are cleared and menu shown when server rejects
- [ ] 7.3 Add client tests for partial URL params — verifies menu is shown when only one param is present
- [ ] 7.4 Add client tests for auto-reconnect exponential backoff timing
- [ ] 7.5 Add client tests for auto-reconnect exhaustion — verifies error overlay shown after 5 failures
- [ ] 7.6 Add client tests for no auto-reconnect after match end
- [ ] 7.7 Add client tests for URL clearing on "New Match" button click
- [ ] 7.8 Add server tests for reconnect replacing stale connection
- [ ] 7.9 Add server tests for error response on non-existent matchId
- [ ] 7.10 Add integration test: full cycle of host → write URL → refresh → resume → play continues
