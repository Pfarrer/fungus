## Why

The game is playable online. Milestone 4 polishes the experience: smooth visuals, responsive UI, game balance, and quality-of-life features that make it feel finished.

## What Changes

- Client-side interpolation between ticks for smooth animations (health bars, damage, node placement)
- Full HUD: resource display, tick countdown timer, queued actions list, enemy network overview
- Shield node implementation (deferred from milestone 2 if not needed for combat testing)
- Game balance tuning: node costs, health, damage, ranges, resource rates
- Match end screen with results
- Better visual feedback: damage flash, node death animation, edge break effect
- Correspondence mode polish: notifications, "your turn" indicators, action history
- Basic AI opponent for single-player (random builder or simple heuristic)

## Capabilities

### New Capabilities

- `ai-opponent`: Basic AI that builds networks and fires turrets using simple heuristics

### Modified Capabilities

- `sandbox-client`: Interpolation, full HUD, match end screen, visual effects, correspondence UX
- `map-config`: Balance tuning of all node type stats
- `combat-system`: Shield node full implementation

## Impact

- Primarily client-side polish in `packages/client/`
- Minor game logic changes in `packages/game/` for AI and shields
- No server changes expected
- Balance changes may require iterative playtesting
