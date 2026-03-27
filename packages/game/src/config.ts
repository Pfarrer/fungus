import type { GameConfig } from "./types.js";

export const defaultGameConfig: GameConfig = {
  map: {
    width: 800,
    height: 600,
    maxConnectionDistance: 100,
    spawnPoints: [
      { x: 50, y: 300 },
      { x: 750, y: 300 },
    ],
    nodeTypeConfigs: {
      root: {
        cost: 0,
        health: 100,
        productionPerTick: 1,
        consumptionPerTick: 0,
      },
      generator: {
        cost: 15,
        health: 30,
        productionPerTick: 3,
        consumptionPerTick: 0,
      },
    },
  },
  tickDurationMs: 1000,
  resourceCap: 500,
};
