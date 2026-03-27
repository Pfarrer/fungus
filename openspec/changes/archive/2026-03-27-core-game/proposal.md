## Why

Fungus is a 2D competitive strategy game where players build networks of interconnected nodes to generate resources, defend territory, and attack opponents. The core game loop — place nodes, manage resources, sever enemy connections — creates strategic depth through the tension between expansion (more territory/resources) and vulnerability (longer chains are easier to cut).

## What Changes

- Implement the core game: a 2D flat map where two players compete by building node networks
- Node types: generators (produce resources), turrets (offensive), shields (defensive)
- Nodes connect into tree structures rooted at each player's root node
- Connections have a maximum distance — nodes act as bridges for further expansion
- New nodes auto-connect to the closest existing friendly node
- When a node or edge is destroyed, the disconnected subtree slowly dies off
- Simultaneous-turn system with configurable tick duration (100ms real-time to 24hr correspondence)
- Players queue actions within each tick; actions are validated and resolved at tick deadline
- Resource economy: generators produce resources, offensive/defensive nodes consume them
- Map configuration includes fixed spawn points for each player
- No terrain in the first iteration

## Capabilities

### New Capabilities

- `game-loop`: The tick-based simulation engine — collects actions, validates, simulates, broadcasts state
- `node-network`: Node placement, tree connectivity, distance-limited edges, disconnection detection
- `resource-economy`: Resource generation from generators, consumption by combat/defense nodes, balance
- `combat-system`: Turret attacks, shield defense, edge/node destruction
- `death-mechanic`: Disconnected subtree detection, gradual health drain, node removal
- `action-queue`: Per-player action queuing within a tick, validation, ordering, conflict resolution
- `map-config`: Map definition, spawn points, boundary, tick duration settings
- `multiplayer-sync`: Client-server communication, state broadcast, tick synchronization

### Modified Capabilities

(none — new project)

## Impact

- This is a new project with no existing code
- Requires a game engine choice (likely a lightweight 2D framework)
- Requires a networking layer for client-server architecture
- Server must be authoritative — validates all actions and owns game state
- Client needs: map rendering, node/edge visualization, action queue UI
