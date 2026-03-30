## 1. Type & Config Updates

- [x] 1.1 Add combat stats (damagePerTick, attackRange, shieldReductionPercent) to NodeTypeConfig type
- [x] 1.2 Add edgeHealth to MapConfig type
- [x] 1.3 Add deathRatePerTick and maxShieldReductionPercent to GameConfig type
- [x] 1.4 Add ScenarioData type
- [x] 1.5 Add turret and shield node type configs to defaultGameConfig with combat stats
- [x] 1.6 Update edge creation in node-placement to use config.map.edgeHealth

## 2. Combat System

- [x] 2.1 Implement point-to-line-segment distance function in spatial.ts
- [x] 2.2 Implement findNearestEnemyNode function (nearest enemy node within attack range)
- [x] 2.3 Implement findNearestEnemyEdge function (nearest enemy edge within attack range)
- [x] 2.4 Implement getShieldReductionForNode function (sum shield values from adjacent tree nodes, cap at maxShieldReductionPercent)
- [x] 2.5 Implement resolveCombat(state, config) function: collect all turrets, target selection, shield calculation, damage application
- [x] 2.6 Integrate resolveCombat into simulateTick after generateResources

## 3. Death Mechanic

- [x] 3.1 Implement updateDisconnectedStatus(state) function to mark nodes disconnected from root
- [x] 3.2 Implement drainDisconnectedNodes(state, config) function to reduce health of disconnected nodes
- [x] 3.3 Implement removeDeadNodes(state) function to remove 0-health nodes and their edges, cascade disconnection
- [x] 3.4 Implement checkWinCondition(state) function to set winner when a root is destroyed
- [x] 3.5 Implement resolveDeath(state, config) combining the above steps
- [x] 3.6 Integrate resolveDeath into simulateTick after resolveCombat

## 4. Scenarios

- [x] 4.1 Create scenarios directory and at least one pre-built scenario JSON file
- [x] 4.2 Implement loadScenario function that reads a scenario and returns a merged GameState
- [x] 4.3 Export loadScenario from @fungus/game index

## 5. Client Updates

- [x] 5.1 Add turret and shield visual styles (colors, sizes) to the renderer
- [x] 5.2 Add edge health color indication (damaged edges change color)
- [x] 5.3 Add turret and shield to the node placement palette
- [x] 5.4 Implement debug overlay toggle (press 'D'): connection status, health values, turret range circles
- [x] 5.5 Implement scenario loader UI: list scenarios, load button, reset game state on load
- [x] 5.6 Show winner/game-over state in the HUD when game ends

## 6. Tests

- [x] 6.1 Add tests for combat resolution (turret targeting, damage application, shield reduction)
- [x] 6.2 Add tests for death mechanic (disconnection detection, health drain, cascading death, win condition)
- [x] 6.3 Add tests for scenario loading
