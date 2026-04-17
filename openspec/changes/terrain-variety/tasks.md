## 1. Types & Data Model

- [ ] 1.1 Add `TerrainType` union type (`"ground" | "rock" | "water" | "minerals"`) to `types.ts`
- [ ] 1.2 Add `TerrainTypeConfig` interface (`buildable: boolean`, `allowedNodeTypes: string[] | null`) to `types.ts`
- [ ] 1.3 Add `terrainGrid: string[][]`, `cellSize: number`, and `terrainTypes: Record<string, TerrainTypeConfig>` fields to `MapConfig` in `types.ts`
- [ ] 1.4 Add a `positionToCell(position, cellSize)` utility function that returns `{ col, row }`

## 2. Default Configuration

- [ ] 2.1 Define default terrain type configs in `config.ts` (ground, rock, water, minerals with their buildable/allowedNodeTypes properties)
- [ ] 2.2 Create a default terrain grid for the 800x600 map in `config.ts` with strategic placement of rock, water, and minerals cells

## 3. Terrain Validation

- [ ] 3.1 Add a `getTerrainAtPosition(config, position)` helper that resolves a pixel position to its terrain cell and returns the `TerrainTypeConfig`
- [ ] 3.2 Add terrain validation to `validatePlaceNode`: check if cell is buildable, check if node type is in `allowedNodeTypes` (if defined)
- [ ] 3.3 Handle missing terrain grid gracefully — treat all positions as ground when no grid is present
- [ ] 3.4 Write unit tests for terrain validation: obstacle blocking, type restrictions, ground allowing all, missing grid fallback

## 4. Rendering

- [ ] 4.1 Add terrain color constants to `renderer.ts` (distinct color per terrain type)
- [ ] 4.2 Add a `renderTerrain` method to `GameRenderer` that draws filled rectangles for each terrain cell
- [ ] 4.3 Call `renderTerrain` in the `render` method before other map elements

## 5. Integration & Polish

- [ ] 5.1 Update existing node-placement tests to account for terrain grid in test configs
- [ ] 5.2 Verify renderer displays terrain correctly on the default map
- [ ] 5.3 Run full test suite and fix any regressions
