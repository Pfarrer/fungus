## Why

The add-main-menu change introduces menu flow where host/join responses provide `matchId` and `playerId` that the client writes into the URL before connecting. However, the exact lifecycle of those URL params is underspecified: when they're written, when they're cleared, and how a page refresh or WebSocket reconnect reuses them. Without precise rules, a refresh could either show a stale menu or fail to reconnect to an in-progress match.

## What Changes

- Define exactly when `matchId` and `playerId` are written to the URL query string (after host/join HTTP response, before WebSocket connect)
- Define when URL params are cleared (returning to menu, not on disconnect)
- Define how the client detects and reuses existing URL params on page refresh to reconnect to the active match
- Define how the client handles stale URL params (match no longer exists) by clearing them and showing the menu
- Define URL param behavior for single-player mode (no `matchId`/`playerId` in URL for local games)
- Define reconnection behavior when WebSocket drops mid-match: auto-reconnect using URL params without returning to menu

## Capabilities

### New Capabilities
- `url-state-management`: Rules for writing, reading, and clearing `matchId` and `playerId` URL query params across menu navigation, game start, refresh, and reconnect scenarios

### Modified Capabilities
- `sandbox-client`: Client entry point gains URL-param detection logic to decide between menu and reconnect on load; reconnection on WebSocket drop uses URL params
- `game-server`: Server reconnection handling is clarified — same `matchId`+`playerId` reconnects to an existing match; match cleanup timing interacts with reconnection windows

## Impact

- Client `main.ts` entry point: URL param parsing and conditional menu-vs-reconnect flow
- Client `GameConnection`: auto-reconnect logic on WebSocket close when URL params are present
- Client menu navigation: URL clearing when returning to menu from game
- Server: no new endpoints, but reconnection protocol timing must be consistent with client retry behavior
- URL bar visible state becomes meaningful to the user (refreshable game sessions)
