## Why

Milestone 1 establishes the building loop. Milestone 2 adds the destruction loop: turrets fire, edges and nodes take damage, disconnected branches die, and the game can end. Combat is tested via pre-built scenarios — JSON files that define enemy node layouts the player fights against, no AI needed.

## What Changes

- Add turret and shield node types with attack range, damage, and shield reduction stats
- Implement combat resolution: turrets target nearest enemy, shields reduce damage, damage applied per tick
- Implement the death mechanic: disconnected subtree detection, gradual health drain, cascading death, root destruction = game over
- Add pre-built scenario system: JSON files defining enemy node layouts, loadable from the sandbox UI
- Add node and edge health bars to the client rendering
- Add debug overlay showing connection status (connected/disconnected) and health values

## Capabilities

### New Capabilities

- `combat-system`: Turret targeting, damage application, shield reduction, combat resolution order
- `death-mechanic`: Disconnected subtree detection, gradual health drain, cascading disconnection, win condition
- `scenarios`: Pre-built JSON scenario files defining enemy structures for combat testing

### Modified Capabilities

- `game-types`: Add health, attack range, damage, shield stats to node type configs
- `game-loop`: Add combat resolution and death steps to tick simulation
- `sandbox-client`: Add health bars, combat debug overlay, scenario loader UI

## Impact

- Extends `packages/game/` with combat and death logic
- Extends `packages/client/` with health visualization and scenario UI
- No server changes yet
- Combat must be deterministic (same inputs = same outputs) for future multiplayer correctness
