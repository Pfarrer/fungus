import type { GameConfig } from "./types.js";

export const defaultGameConfig: GameConfig = {
  map: {
    width: 800,
    height: 600,
    maxConnectionDistance: 100,
    minNodeDistance: 20,
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
      turret: {
        cost: 25,
        health: 20,
        productionPerTick: 0,
        consumptionPerTick: 2,
        damagePerTick: 5,
        attackRange: 120,
      },
      shield: {
        cost: 20,
        health: 25,
        productionPerTick: 0,
        consumptionPerTick: 1,
        shieldReductionPercent: 20,
      },
    },
    edgeHealth: 20,
  },
  tickDurationMs: 1000,
  resourceCap: 500,
  deathRatePerTick: 5,
  maxShieldReductionPercent: 90,
};
