## Why

Nodes from different players are currently rendered with the same colors — color depends only on node type (root, generator, turret, shield). This makes it impossible to distinguish which player owns which node at a glance, especially during combat when nodes are intermixed. The active player's nodes should always use the same familiar palette so the player can quickly read the board.

## What Changes

- Assign a distinct color palette to each player. The active/current player always uses the same palette; all other players get different palettes.
- Node type (shape-based distinction: root, generator, turret, shield) remains visually differentiated within each player's palette.
- Edges are colored to match their owning player.
- Visual effects (node death, ghost nodes, placement preview) respect player colors.
- The active player's palette is fixed regardless of match order or player slot.

## Capabilities

### New Capabilities
- `player-color-palette`: per-player color assignment where the active player always gets the same palette and other players get distinct palettes, applied consistently to nodes, edges, effects, and UI previews.

### Modified Capabilities

## Impact

- Client renderer (`renderer.ts`): node, edge, and effect color selection.
- State diff effects (`state-diff.ts`): node death color must use player-aware palette.
- Main client (`main.ts`): placement preview colors.
- Renderer tests: color assertions must account for player palettes.
