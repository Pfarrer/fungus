## Context

The add-main-menu change establishes that host/join responses provide `matchId` and `playerId`, and the client writes them into the URL before connecting. The current client (`main.ts`) reads these params at module scope with hardcoded defaults (`"player-1"`, `"match-1"`), then immediately opens a WebSocket. The menu change replaces the hardcoded defaults with a menu flow, but leaves the URL lifecycle undefined: when params are written, cleared, and how refresh/reconnect reuses them.

The game already supports reconnection (server keeps matches alive on disconnect), but there is no client-side auto-reconnect or URL-based session resume. The "New Match" button currently calls `window.location.reload()`, which under the new menu flow should return to the menu, not reconnect.

## Goals / Non-Goals

**Goals:**
- Define the exact moments when `matchId` and `playerId` are written to or cleared from the URL
- Enable page refresh to reconnect to an in-progress multiplayer match by reading URL params
- Enable automatic WebSocket reconnection on unexpected disconnect when URL params are present
- Ensure returning to the menu clears URL params so a refresh starts fresh
- Handle stale URL params gracefully (match gone) by clearing them and showing the menu
- Keep single-player mode out of the URL (no `matchId`/`playerId` for local games)

**Non-Goals:**
- Offline play or service worker caching
- Multiple match tabs or session switching
- Server-side session tokens or authentication
- URL-based deep linking for spectating
- Persisting game state client-side across sessions

## Decisions

### 1. URL as the single source of truth for active session identity

**Decision**: `matchId` and `playerId` in the URL query string are the canonical indicator that a multiplayer session is active. On load, if both params are present, the client attempts to reconnect. If absent, the client shows the menu.

**Rationale**: The URL is already the mechanism the add-main-menu change uses to pass connection details. Making it the single source of truth avoids divergent state between URL and app memory. Refresh naturally re-reads the URL.

**Alternatives considered**:
- *localStorage session*: Adds a second source of truth that can diverge from the URL. Synchronizing them adds complexity.
- *Session storage only*: Lost on new tab; doesn't support bookmarkable game URLs.

### 2. Write params via `history.replaceState` after host/join response

**Decision**: After receiving a successful `POST /host` or `GET /join` response, the client writes `matchId` and `playerId` into the URL using `history.replaceState` (not `pushState`). This updates the URL without creating browser history entries.

**Rationale**: The user shouldn't be able to press "Back" to return to a pre-game URL state. `replaceState` keeps the URL bar accurate for refresh purposes without polluting history.

**Alternatives considered**:
- *`pushState`*: Creates a history entry; back button would show stale state.
- *`window.location.search = ...`*: Triggers a full page reload, defeating the SPA flow.

### 3. Clear params via `history.replaceState` when returning to menu

**Decision**: When the player navigates back to the main menu (via "New Match" button, match-end screen, or manual action), the client clears `matchId` and `playerId` from the URL using `history.replaceState` to set query params to empty or remove those keys.

**Rationale**: Returning to menu means the session is over or abandoned. Clearing the URL ensures a subsequent refresh shows the menu, not a reconnect attempt to a potentially dead match.

**Alternatives considered**:
- *Leave params in URL on menu return*: Could cause confusing auto-reconnect on refresh after the user intended to leave.
- *Use a sentinel value like `matchId=none`*: Unnecessary indirection; removing the params is clearer.

### 4. On load: detect params → reconnect or show menu

**Decision**: On application load, the client reads `matchId` and `playerId` from `URLSearchParams`. If both are present and non-empty, the client skips the menu and immediately attempts a WebSocket connection to that match. If the server rejects the connection (match doesn't exist or is finished), the client clears the URL params and falls back to the menu. If params are absent or incomplete, the menu is shown.

**Rationale**: This preserves the existing refresh/reconnect behavior in a menu-aware way. Players can refresh during a game and rejoin seamlessly. The fallback handles edge cases like bookmarked URLs for expired matches.

**Alternatives considered**:
- *Always show menu on load*: Defeats the purpose of URL-based resume; forces re-navigation even during active games.
- *Check server state before deciding*: Adds latency on every load; the WebSocket connection attempt itself acts as the validity check.

### 5. Auto-reconnect on WebSocket drop with exponential backoff

**Decision**: When the WebSocket closes unexpectedly during an active multiplayer game (i.e., URL params are present and the game hasn't ended), the client automatically attempts to reconnect using the URL params. Reconnect attempts use exponential backoff starting at 1 second, capped at 30 seconds, with a maximum of 5 attempts. On successful reconnect, the server sends the current game state and play resumes. On exhaustion, the client shows an error overlay with a "Return to Menu" button.

**Rationale**: Network interruptions are common. Auto-reconnect with backoff provides a good UX without hammering the server. The URL params guarantee the client knows which match to reconnect to. Server-side reconnection support already exists (matches stay alive on disconnect).

**Alternatives considered**:
- *No auto-reconnect, just show error*: Poor UX for transient network blips.
- *Infinite retry*: Could hang forever if the server is down; bad UX.
- *Reconnect via new WebSocket only*: This is essentially what happens, but needs clear rules about when to stop.

### 6. Single-player mode does not write URL params

**Decision**: When starting a single-player (local) game, the client does not write `matchId` or `playerId` to the URL. The URL remains clean (root path with no query params). Refreshing a single-player game starts a fresh session at the menu.

**Rationale**: Single-player games run entirely in the client with no server state to reconnect to. Writing params would imply a resumable server session that doesn't exist. A clean URL makes the distinction clear.

**Alternatives considered**:
- *Write single-player params like `mode=solo`*: Adds complexity for no functional benefit since there's no server to reconnect to.

## Risks / Trade-offs

- **Stale URL after server crash** → Mitigation: If the server is down or the match is gone, the WebSocket connection will fail. The client detects this, clears URL params, and shows the menu with an error.
- **Browser back button after replaceState** → Mitigation: `replaceState` avoids creating history entries, so the back button won't navigate to a pre-game URL. The user's back button behavior is consistent.
- **Race condition on rapid refresh** → Mitigation: Each load reads URL params fresh. The server handles multiple simultaneous connections for the same `playerId` by replacing the old one (reconnect semantics already defined in game-server spec).
- **Auto-reconnect during intentional server shutdown** → Mitigation: Max 5 attempts with backoff caps the retry window to ~30 seconds. The "Return to Menu" button provides an escape hatch.
- **User manually editing URL params** → Mitigation: Invalid params simply cause a failed connection attempt, triggering the fallback to menu. No security risk since there's no auth.
