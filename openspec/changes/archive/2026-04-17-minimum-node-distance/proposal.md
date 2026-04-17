## Why

Nodes can currently be placed arbitrarily close together (even at the same position, modulo the "occupied" check). This allows degenerate strategies where players stack nodes in a tiny cluster, making the network visually cluttered and tactically one-dimensional. A minimum distance rule enforces spatial diversity and creates more interesting strategic decisions.

## What Changes

- Add a minimum distance constraint between all nodes (friendly and enemy). Placement is rejected if the new node would be closer than the minimum distance to any existing node.
- Add `minNodeDistance` to the map configuration object with a default value.
- Placement validation in the node-network system gains an additional check: distance to every existing node must be >= `minNodeDistance`.

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `node-network`: Placement validation requirements gain a minimum distance rule
- `map-config`: Map configuration gains a `minNodeDistance` parameter with a default value

## Impact

- **node-network spec**: New validation scenario for minimum distance enforcement
- **map-config spec**: New configuration parameter with default value
- **game server**: Placement validation logic updated to check distances to all nodes
- **client**: Visual feedback when placement is too close to another node
