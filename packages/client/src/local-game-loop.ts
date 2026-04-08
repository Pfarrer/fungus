import { simulateTick, createInitialState, defaultGameConfig } from "@fungus/game";
import type { GameAction, GameConfig, GameState } from "@fungus/game";

export class LocalGameLoop {
  private gameState: GameState;
  private config: GameConfig;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private actionQueue: GameAction[] = [];
  private onTick: (state: GameState) => void;

  constructor(
    onTick: (state: GameState) => void,
    config?: GameConfig,
    initialState?: GameState,
  ) {
    this.onTick = onTick;
    this.config = config ?? defaultGameConfig;
    this.gameState = initialState ?? createInitialState(this.config);
  }

  start(): void {
    this.onTick(this.gameState);
    this.tickTimer = setInterval(() => {
      this.executeTick();
    }, this.config.tickDurationMs);
  }

  stop(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  queueAction(action: GameAction): void {
    this.actionQueue.push(action);
  }

  getState(): GameState {
    return this.gameState;
  }

  private executeTick(): void {
    const playerActions = new Map<string, GameAction[]>();
    for (const player of this.gameState.players) {
      playerActions.set(player.id, []);
    }

    if (this.actionQueue.length > 0) {
      const currentPlayer = this.gameState.players[0];
      if (currentPlayer) {
        playerActions.set(currentPlayer.id, [...this.actionQueue]);
      }
      this.actionQueue.length = 0;
    }

    this.gameState = simulateTick(this.gameState, playerActions, this.config);
    this.onTick(this.gameState);
  }
}
