## 1. Palette Definition

- [x] 1.1 Create a `PlayerPalette` type and a `player-palette.ts` module with `SELF` and `OPPONENT` palettes, each containing colors for root, generator, turret, shield, edge, and edge-damaged variants.
- [x] 1.2 Export a `getPalette(playerId, currentPlayerId)` function that returns `SELF` for the active player and `OPPONENT` for all others.

## 2. Renderer Integration

- [x] 2.1 Update `GameRenderer.render()` and `renderNodes()` to accept `currentPlayerId` and use `getPalette()` to select node fill colors per node.
- [x] 2.2 Update `renderEdges()` to use the owning player's palette edge color.
- [x] 2.3 Update `renderGhostNodes()` to use the active player's palette for ghost node colors.

## 3. Effects and Preview

- [x] 3.1 Update `computeStateDiffs()` in `state-diff.ts` to use the node owner's palette color for node death effects.
- [x] 3.2 Update the placement preview in `main.ts` (`showPlacementPreview`) to use the active player's palette colors.

## 4. Verification

- [x] 4.1 Update existing renderer tests to account for player-aware palette colors.
- [x] 4.2 Run the full test suite and fix any failures.
