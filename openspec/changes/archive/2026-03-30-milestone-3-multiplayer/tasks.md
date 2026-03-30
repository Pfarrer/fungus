## 1. Server Foundation

- [x] 1.1 Install `ws` and `@types/ws` in `packages/server/`
- [x] 1.2 Create `packages/server/src/server.ts` — bare WebSocket server that listens on a port, accepts connections
- [x] 1.3 Add `dev` script to `packages/server/package.json` (e.g., `tsx watch src/server.ts`)

## 2. Protocol Types

- [x] 2.1 Define WebSocket message types in `packages/server/src/protocol.ts`: client-to-server (`queue-actions`, `join-match`) and server-to-client (`tick-result`, `tick-countdown`, `match-state`, `waiting`, `error`)
- [x] 2.2 Parse match ID and player ID from connection query params

## 3. Match Management

- [x] 3.1 Create `packages/server/src/match.ts` — a `Match` class that holds `GameState`, `GameConfig`, player connections, per-player action queues, and tick timer
- [x] 3.2 Implement match lifecycle: create match → wait for 2 players → send `waiting` status to first player → start tick loop on second player join → run until winner → end
- [x] 3.3 Accept `tickDurationMs` in match configuration (real-time 100ms vs correspondence hours)

## 4. Server Tick Loop

- [x] 4.1 Implement authoritative tick loop: on tick interval, collect queued actions, call `simulateTick`, broadcast `tick-result` to all connected players
- [x] 4.2 Implement tick countdown: emit `tick-countdown` messages at regular intervals between ticks
- [x] 4.3 Validate incoming actions: queue per-player, passed to `simulateTick` which already validates internally

## 5. Reconnection & Resilience

- [x] 5.1 Handle disconnection: keep match alive, disconnected player's actions queue stays empty, tick loop continues
- [x] 5.2 Handle reconnection: player reconnects with matching match/player ID, send current full game state, resume accepting actions

## 6. Client WebSocket Layer

- [x] 6.1 Create `packages/client/src/connection.ts` — WebSocket client class: connection management, auto-reconnect, message serialization
- [x] 6.2 Implement `queueActions(actions)` — sends `{ type: "queue-actions", actions }` to server
- [x] 6.3 Implement message handlers: listen for `tick-result`, `tick-countdown`, `match-state`, `waiting` and invoke callbacks

## 7. Client Refactoring — Strip Local Loop

- [x] 7.1 Replace local `simulateTick` with server-driven state: on `tick-result`, set `gameState` from server and re-render
- [x] 7.2 Remove auto-tick / manual-tick / next-tick controls from UI
- [x] 7.3 Change "Execute Actions" to send queued actions to server instead of calling `advanceTick`
- [x] 7.4 Remove all local `gameState` mutations — client only reads server state

## 8. Client — Multiplayer UX

- [x] 8.1 Add connection status indicator to HUD (connected / reconnecting / disconnected)
- [x] 8.2 Add tick countdown display in HUD (`secondsRemaining` from server)
- [x] 8.3 Parse match ID and player ID from URL query params on load, connect to server
- [x] 8.4 Handle winner state from server: display victory/defeat for the current player
- [x] 8.5 Add "waiting for opponent" indicator when first player joins a match
- [x] 8.6 Show "opponent's turn" / "your actions queued" status to clarify the tick-based rhythm for slow modes

## 9. Tests

- [x] 9.1 Server tests: match creation, player joining, tick loop with mock connections
- [x] 9.2 Server tests: action queueing, tick resolution, state broadcast
- [x] 9.3 Server tests: disconnection and reconnection handling
- [x] 9.4 Protocol tests: message serialization roundtrips

## 10. Integration & Wiring

- [x] 10.1 Wire client to server: on load, connect WebSocket, receive initial state, render
- [x] 10.2 End-to-end smoke test: server → two clients → place nodes → ticks → combat → game ends
- [x] 10.3 Add `concurrently` to root `package.json` to run server + client dev together
