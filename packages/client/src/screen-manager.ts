export type ScreenState = "menu" | "multiplayer-select" | "hosting" | "joining" | "playing";

const VALID_TRANSITIONS: Record<ScreenState, ScreenState[]> = {
  menu: ["multiplayer-select", "playing"],
  "multiplayer-select": ["menu", "hosting", "joining"],
  hosting: ["playing", "menu"],
  joining: ["playing", "menu"],
  playing: ["menu"],
};

export class ScreenManager {
  private _state: ScreenState = "menu";
  private handlers: Set<(state: ScreenState) => void> = new Set();

  get state(): ScreenState {
    return this._state;
  }

  transition(next: ScreenState): void {
    const allowed = VALID_TRANSITIONS[this._state];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid transition: ${this._state} → ${next}`);
    }
    this._state = next;
    for (const handler of this.handlers) {
      handler(next);
    }
  }

  onChange(handler: (state: ScreenState) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
