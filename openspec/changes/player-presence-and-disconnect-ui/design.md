## Context

The client already tracks connection status in `packages/client/src/connection.ts` and renders a HUD/match-end overlay in `packages/client/src/main.ts`. The current experience treats disconnects as a transport detail: the socket reconnects in the background, but the player gets little direct feedback about what is happening or whether the opponent is still expected to return.

The server already keeps matches alive after disconnects and resumes play on reconnect. This change is about making that lifecycle visible and understandable in the client without changing the multiplayer protocol.

## Goals / Non-Goals

**Goals:**
- Expose clear client-side presence states during multiplayer play
- Show a reconnect countdown/timer while retries are in progress
- Distinguish between temporary disconnect, opponent-left, and abandoned match states
- Make the player experience explicit when the opponent never returns
- Keep the implementation compatible with the current server reconnect behavior

**Non-Goals:**
- New server endpoints or protocol changes
- Matchmaking or lobby features
- Authenticated identity or persistent player accounts
- Reworking the gameplay simulation or tick loop

## Decisions

### 1. Model presence separately from transport status

**Decision**: Keep `ConnectionStatus` for socket-level state, but add a higher-level presence state for gameplay UX, such as `active`, `self-reconnecting`, `opponent-disconnected`, `opponent-returned`, and `abandoned`.

**Rationale**: A WebSocket can be reconnecting even when the match is still fully recoverable. The UI needs to distinguish between "the socket is retrying" and "the opponent is gone".

**Alternatives considered**:
- *Reuse connection status only*: Too coarse; it cannot describe opponent-specific states.
- *Store everything in one enum*: Simpler at first, but conflates network state with gameplay state.

### 2. Use the client as the source of the presence timer

**Decision**: The reconnect countdown and abandonment timer live on the client. The server continues to manage authoritative match state, but it does not need to emit a special timer protocol.

**Rationale**: The timeouts are UX concerns. The client already knows when a disconnect happened and can present a stable countdown without extra server coordination.

**Alternatives considered**:
- *Server-driven timer events*: Adds protocol surface area for little benefit.
- *No timer*: Leaves players guessing how long recovery will take.

### 3. Treat opponent disconnect as a visible in-game state

**Decision**: When the remote player disconnects during a live match, the UI should switch to an opponent-left state instead of only showing a generic reconnecting banner.

**Rationale**: Players need to know the match is still alive but paused or waiting on the other side. This is especially important in one-vs-one games where a disconnect has immediate competitive implications.

**Alternatives considered**:
- *Generic reconnecting text*: Doesn't explain who disconnected or what the match is waiting on.
- *Immediate match end*: Too aggressive given the server already supports reconnects.

### 4. Escalate to abandonment only after a client timeout

**Decision**: If the disconnected player does not return within a defined retry window, the client transitions to an abandoned/failed-recovery state and offers a clear exit back to menu.

**Rationale**: The server can keep the match alive, but the UX should not imply indefinite recovery. A bounded retry window prevents endless loading states.

**Alternatives considered**:
- *Infinite retries*: Bad UX and can leave the player stuck forever.
- *Immediate forfeit*: Harsh and inconsistent with reconnect semantics.

### 5. Keep multiplayer and single-player UI paths separate

**Decision**: Presence and reconnect states apply only to multiplayer sessions. Single-player mode should not show reconnect timers or opponent-left messaging.

**Rationale**: Single-player has no remote peer, so the presence model would be misleading.

**Alternatives considered**:
- *Unified state machine for all modes*: Overly broad and harder to reason about.

## Risks / Trade-offs

- **[Timer drift across tabs]** → Mitigation: The timer is only a display aid; the reconnect attempt schedule remains based on client timers and the actual socket state.
- **[False sense of permanence]** → Mitigation: Label the abandoned state clearly as a recovery failure, not a server-side match deletion.
- **[UI complexity]** → Mitigation: Keep the state machine small and derive all presence states from connection events plus a single retry timer.
- **[Unexpected server disconnects]** → Mitigation: If the server closes the match, fall back to the existing error/end path and return to menu.

## Migration Plan

1. Introduce presence state and timer handling behind the existing connection flow.
2. Update the HUD/overlay to render the new states without changing multiplayer behavior.
3. Add tests for disconnect, reconnect, timeout, and abandoned-match transitions.
4. Rollback is straightforward: remove the new UI states and revert to the current generic reconnect messaging.

## Open Questions

- What exact timeout should separate "reconnecting" from "abandoned"?
- Should the opponent-left state pause input entirely, or still allow local queueing?
- When recovery fails, should the client return to menu automatically or require an explicit click?
