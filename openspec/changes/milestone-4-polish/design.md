## Context

The game is a two-player competitive network-building game. After milestone 3, it works over WebSocket with an authoritative server, tick-based state sync, and basic PixiJS rendering. The client (`packages/client/`) uses PixiJS for canvas rendering, raw HTML/CSS for HUD, and communicates via a `GameConnection` WebSocket class. The game engine (`packages/game/`) provides pure deterministic functions (`simulateTick`, `processActions`, `resolveCombat`, etc.).

Current state:
- Client renders nodes as colored circles with health bars, edges as lines
- HUD shows connection status, tick number, resources, countdown, queued actions, winner
- No interpolation — state jumps on each tick-result
- No visual feedback for combat events (damage, death, edge breaks)
- No match end screen beyond inline "VICTORY/DEFEAT" text in HUD
- Shield node type exists in config but visual feedback for shields is minimal
- Balance values are initial guesses, untested with real play

## Goals / Non-Goals

**Goals:**
- Client-side interpolation for smooth health bar, damage, and node movement between ticks
- Full HUD: resource display, tick countdown timer, queued actions list, enemy network overview
- Match end screen overlay with game results and replay option
- Visual feedback: damage flash on nodes, node death animation, edge break effect
- Shield node visual: pulsing protective aura around shielded nodes
- Game balance tuning based on node costs, health, damage, ranges, resource rates
- Correspondence mode polish: "your turn" indicator, action history

**Non-Goals:**
- Particle system or complex shader effects
- Sound effects or music
- Matchmaking, lobby, or ranking system
- Spectator mode or replay viewer
- Persistence beyond server restart
- Authentication or accounts

## Decisions

### Decision: PixiJS ticker-based interpolation instead of CSS animations
Use PixiJS's built-in `app.ticker` (runs at 60fps) to interpolate visual properties (health bars, position, alpha) between game ticks. This keeps all rendering in the PixiJS pipeline rather than mixing CSS and canvas animations.

### Decision: Event queue for visual effects
When a tick-result arrives, compute diffs (which nodes took damage, which died, which edges broke) and push short-lived visual events (damage flash 200ms, death animation 400ms, edge break 300ms) onto an event queue. The render loop processes active events each frame and removes them when complete.

### Decision: HTML overlay for HUD and match end screen
Continue using HTML overlays for HUD and match end screen (as currently done). This is simpler than rendering text in PixiJS and allows standard CSS styling. The HUD already uses this pattern.

### Decision: Balance tuning via config only
All balance changes are in `defaultGameConfig` in `packages/game/src/config.ts`. No new node types or mechanics — just adjusting cost, health, damage, range, production, and consumption values.

## Risks / Trade-offs

**[Interpolation complexity]** Interpolating between discrete tick states adds render complexity → Keep interpolation simple: lerp health bars, fade alpha on death. No positional interpolation (nodes don't move).

**[Balance iteration]** Balance requires playtesting, not just theory → Ship reasonable defaults based on game math, plan iterative tuning.

**[Event queue memory]** Visual events accumulate if ticks arrive faster than animations complete → Cap event queue size; discard oldest events if queue exceeds limit.
