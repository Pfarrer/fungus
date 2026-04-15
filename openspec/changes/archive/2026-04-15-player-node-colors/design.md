## Context

The renderer currently colors nodes purely by type (root=red, generator=green, turret=orange, shield=blue). There is no player-aware coloring. In a two-player match, both players' generator nodes are identical green circles. This affects the renderer, state-diff effects, placement preview, and ghost nodes — any code that picks a color for a node.

The game supports at most 2 players per match (two spawn points in the default config). The active player is always known at render time (`currentPlayerId` in main.ts).

## Goals / Non-Goals

**Goals:**
- Active player's nodes always use a fixed, familiar palette.
- Opponent's nodes use a clearly different palette.
- Node type remains visually distinguishable within each palette (via shade/tint variation).
- All rendering paths (nodes, edges, effects, ghost nodes, placement preview) use player-aware colors.

**Non-Goals:**
- Supporting more than a small number of fixed palettes (2 is sufficient for now).
- Letting players choose custom colors.
- Changing node shapes or sizes.
- Server-side color logic (colors are purely a client rendering concern).

## Decisions

1. Use a fixed palette lookup keyed by a "self vs other" relationship rather than raw player index.
   - Rationale: The active player should always see their own nodes in the same colors regardless of whether they are player-1 or player-2. A self/other mapping is simpler than per-player-index palettes and guarantees consistency.
   - Alternatives: Assign palette by player index. Rejected because the active player's colors would flip depending on slot assignment.

2. Define a `PlayerPalette` type containing colors for each node type, edges, and effects. Provide two hardcoded palettes (self, opponent).
   - Rationale: Grouping all colors per player into one object avoids scattering player-index checks throughout the renderer. Each render call looks up the palette once.
   - Alternatives: Compute colors inline with a helper function. Rejected because it spreads the palette definition across files.

3. Pass `currentPlayerId` into the renderer so it can resolve self vs other per node.
   - Rationale: The renderer already receives the full `GameState` which includes `playerId` on each node. Adding `currentPlayerId` gives it everything needed without touching the game package.
   - Alternatives: Return color from a shared utility that takes playerId. Viable but adds coupling; keeping palette resolution in the renderer is simpler.

4. Edges inherit the color of the child node's player (the node being connected to the parent).
   - Rationale: An edge belongs to a single player and should match that player's palette for visual consistency.

5. Node type distinction within a palette uses brightness/saturation shifts rather than entirely different hues.
   - Rationale: The self palette keeps warm tones (familiar red root, green generator, etc.) and the opponent palette shifts to cool tones. Within each palette, node types differ by shade.

## Risks / Trade-offs

- [Colorblind accessibility] → Current palette uses red vs blue-ish which is generally distinguishable for common color vision deficiencies. Can be tuned later without structural changes.
- [Hardcoded palettes limit future player count] → Acceptable since matches are 2-player. If multi-player is added later, the palette map can be extended to N entries keyed by player index offset from self.
- [Edge ownership ambiguity] → Edges are always between same-player nodes, so using either endpoint's player works. Using the child (to-node) is conventional.
