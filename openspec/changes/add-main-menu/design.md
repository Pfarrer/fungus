## Context

The Fungus game is a multiplayer strategy game built with a client-server architecture. The client is a Vite + PixiJS single-page app (`@fungus/client`), the server is a Node.js WebSocket server (`@fungus/server`), and shared types live in `@fungus/game`. Currently, the client launches directly into a game by reading `playerId` and `matchId` from URL query params and connecting via WebSocket. There is no menu, mode selection, or player identity management.

The game already supports single-player (sandbox with scenarios) and 2-player multiplayer via WebSocket. The server's `MatchManager` creates matches on demand based on `matchId`. Player IDs are currently hardcoded or passed via URL.

## Goals / Non-Goals

**Goals:**
- Present a main menu when the client app loads, before any game connection is established
- Allow the player to enter a display name persisted in localStorage
- Offer single-player mode that starts a local/sandbox game immediately
- Offer multiplayer mode with "Host Game" and "Join Game" sub-options
- Host generates a short game code; Join accepts a game code
- Integrate the player name into the game session

**Non-Goals:**
- User accounts, authentication, or persistent profiles beyond localStorage
- Matchmaking queue or automatic pairing
- More than 2 players per match
- Chat or social features
- Long-lived lobby management, persistent code storage, or manual host administration
- Dedicated lobby browser with a list of open games

## Decisions

### 1. Client-side screen routing via DOM overlay

**Decision**: Implement menu screens as full-page HTML/CSS overlays on the same SPA, hiding the canvas until a game starts. No router library.

**Rationale**: The app is a simple game with only a few screens (menu, multiplayer-select, host lobby, join, game). Adding a routing library is unnecessary complexity. DOM overlays are already used for the HUD and match-end screen. A simple state machine (`"menu" | "multiplayer-select" | "hosting" | "joining" | "playing"`) controls which overlay is visible.

**Alternatives considered**:
- *Hash-based router*: Overkill for 3-4 screens; adds indirection.
- *Separate HTML pages*: Breaks the SPA model; would need to pass state via URL or storage.

### 2. Game codes as short 6-character alphanumeric strings

**Decision**: When hosting, the server generates a random 6-character uppercase alphanumeric code (e.g., `"A3F7K2"`). The host shares this code. The joiner enters it to connect to the match.

**Rationale**: Short codes are easy to share verbally or via text. 36^6 (~2 billion) combinations provide sufficient uniqueness for an in-memory game server. No persistence needed.

**Alternatives considered**:
- *UUIDs*: Too long to share manually.
- *Server-side match listing*: Adds complexity; not needed for direct friend-to-friend play.

### 3. Server exposes an HTTP endpoint for match creation alongside the existing WebSocket

**Decision**: Add a lightweight HTTP endpoint `POST /host` that creates a hosted match reservation and returns a game code plus the host connection parameters (`matchId`, `playerId = player-1`), and `GET /join?code=XXX` that validates the code and returns the joiner connection parameters (`matchId`, `playerId = player-2`). Before opening the WebSocket, the client writes `matchId` and `playerId` into the browser URL and then uses those URL params as the canonical connection details for connect and refresh.

**Rationale**: Match creation/lookup is a request-response operation better suited to HTTP. WebSocket is kept for real-time game communication. Keeping `matchId` and `playerId` in the URL preserves the existing refresh/reconnect behavior while still avoiding hardcoded local defaults.

**Alternatives considered**:
- *WebSocket-only match management*: Possible but awkward for one-off request/response operations like creating a match and getting a code.
- *Separate HTTP server*: Adds deployment complexity for no benefit at this scale.

### 4. Player name stored in localStorage and propagated into game state

**Decision**: The player name is stored in `localStorage` under `"fungus-player-name"`. When connecting to a game, the name is passed as a query param (`playerName`) alongside `matchId` and `playerId`. The server writes that value into the shared `GameState.players[*].name` field, defaulting to the `playerId` when no name is provided.

**Rationale**: Simple, requires no account system, and makes names available to all clients and UI surfaces through the same authoritative state that already drives rendering and match results.

**Alternatives considered**:
- *Server-side session*: Requires auth, overkill for a game name.
- *IndexedDB*: Unnecessary for a simple string value.

### 5. Single-player mode runs a local game loop without a server connection

**Decision**: Single-player mode instantiates a local game simulation directly in the client, using the existing `simulateTick` from `@fungus/game`. No server connection is needed.

**Rationale**: The game logic is already in the shared `@fungus/game` package. Running it locally avoids needing a server for solo play. The multiplayer sync spec already defines the client as stateless, but for single-player the client can own the state.

**Alternatives considered**:
- *Single-player via server with a bot*: Adds server complexity; not needed for sandbox mode.

### 6. Hosted match reservations expire if unused

**Decision**: A host reservation created by `POST /host` expires after a short timeout if no WebSocket client connects to that match. Once the host connects, the match follows the normal disconnect cleanup rules.

**Rationale**: The HTTP-first flow creates a pre-connection window where a match/code can exist with zero connected players. Without a timeout, abandoned host flows leak in-memory matches and codes indefinitely.

## Risks / Trade-offs

- **Game code collisions** → Mitigation: 36^6 space is large enough for in-memory usage. Server can regenerate on collision (extremely unlikely).
- **Unused hosted matches leaking memory** → Mitigation: expire host reservations that never receive an initial WebSocket connection within a short timeout.
- **Single-player state ownership differs from multiplayer** → Mitigation: The renderer and UI already accept `GameState` regardless of source. The only difference is where state comes from (local simulation vs server broadcast).
- **Player name spoofing** → Mitigation: Acceptable for a casual game. No competitive integrity requirements.
- **HTTP endpoint on the same port as WebSocket** → Mitigation: The `ws` library's `WebSocketServer` can be attached to an existing HTTP server. We'll create an HTTP server and upgrade WebSocket connections from it.
