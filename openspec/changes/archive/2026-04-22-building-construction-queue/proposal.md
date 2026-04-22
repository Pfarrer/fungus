## Why

Resources accumulate indefinitely (up to the cap) and buildings are placed instantly. This allows players to hoard resources and place buildings as soon as they can afford them. The game needs a more strategic flow: resources must be spent immediately or lost, buildings take time to construct based on resource generation rate, and multiple concurrent constructions share the surplus equally. This creates meaningful decisions about expansion timing and prioritization.

## What Changes

- **Surplus resources are lost each tick**: After consumption costs are paid, any remaining resources above 0 are discarded (unless routed to construction). Players cannot stockpile.
- **Buildings are placed into a construction queue**: Instead of deducting cost instantly, placing a building adds it to a per-player construction queue. The building does not appear on the map until fully funded.
- **Construction is funded by surplus generation**: Each tick, the net resource surplus (production minus consumption) is distributed to queued constructions. Buildings complete when their total cost is met.
- **Multiple constructions share surplus equally**: When multiple buildings are under construction, the tick's surplus is split evenly (fractional progress is tracked).
- **Resource cap replaced by per-tick surplus model**: The static resource cap is removed. Resources exist only ephemerally within a tick: income arrives, consumption is deducted, and the remainder flows to construction or is lost.

## Capabilities

### New Capabilities
- `building-construction`: Defines the construction queue system - how buildings are queued, funded over multiple ticks, progress tracking, equal surplus sharing, and completion/activation rules.

### Modified Capabilities
- `resource-economy`: Surplus is now discarded if not routed to construction. Remove the static resource cap. Resource generation still produces income per tick, but unspent surplus is lost.
- `node-network`: Placement no longer creates the node immediately. Instead, a "ghost" placement is validated and added to the construction queue. The node appears on the map only when construction completes.
- `action-queue`: PlaceNode action now queues a construction request rather than an instant build. Validation checks remain the same (distance, position, etc.) but resource sufficiency is not required upfront.
- `game-loop`: Tick order changes to account for construction progress: actions → construction funding → resource generation → consumption → combat → death. Construction completion triggers node activation.

## Impact

- **Core game logic** (`packages/game`): New construction queue module, modifications to resource-economy, node-placement, and game-loop
- **Player state**: New fields for construction queue (list of queued buildings with progress)
- **Client**: Needs UI to show construction progress, ghost nodes for in-progress buildings
- **Server**: Tick result messages need to include construction progress updates
- **Bot opponent**: Must account for construction delays in strategy decisions
- **Tests**: Extensive test coverage needed for surplus sharing, fractional progress, completion edge cases
