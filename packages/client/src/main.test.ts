import { beforeEach, describe, expect, it, vi } from "vitest";

const showMenuSpy = vi.fn();
const renderHostingScreenSpy = vi.fn();
const hideMenuSpy = vi.fn();
const showJoinErrorSpy = vi.fn();
const writeSessionToUrlSpy = vi.fn();
const readSessionFromUrlSpy = vi.fn(() => ({ matchId: null, playerId: null }));
const clearSessionFromUrlSpy = vi.fn();
const fetchSpy = vi.fn();

type ConnectionHandler = (data: any) => void;

const connectionInstances: MockGameConnection[] = [];

class MockGameConnection {
  public handlers = new Map<string, ConnectionHandler[]>();
  public statusHandlers: Array<(status: "connected" | "reconnecting" | "disconnected") => void> = [];
  public reconnectStateHandlers: Array<(state: any) => void> = [];
  public reconnectFailedHandlers: Array<() => void> = [];

  constructor(public readonly url: string) {
    connectionInstances.push(this);
  }

  on(type: string, handler: ConnectionHandler): void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  onStatusChange(handler: (status: "connected" | "reconnecting" | "disconnected") => void): void {
    this.statusHandlers.push(handler);
  }

  onReconnectStateChange(handler: (state: any) => void): void {
    this.reconnectStateHandlers.push(handler);
  }

  onReconnectFailed(handler: () => void): void {
    this.reconnectFailedHandlers.push(handler);
  }

  connect(): void {}

  disconnect(): void {}

  queueActions(): void {}

  markGameEnded(): void {}

  emit(type: string, data: any): void {
    for (const handler of this.handlers.get(type) ?? []) {
      handler(data);
    }
  }
}

vi.mock("pixi.js", () => ({
  Container: class {
    addChild(): void {}
    removeChildren(): void {}
  },
  Graphics: class {
    circle(): this { return this; }
    fill(): this { return this; }
    stroke(): this { return this; }
  },
}));

vi.mock("./renderer.js", () => ({
  GameRenderer: class {
    app = {
      canvas: {
        addEventListener: vi.fn(),
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      },
    };

    init = vi.fn(async () => {});
    render = vi.fn();
    renderGhostNodes = vi.fn();
    addEffect = vi.fn();
    updateHealthTargets = vi.fn();
    screenToWorld = vi.fn((x: number, y: number) => ({ x, y }));
  },
}));

vi.mock("./connection.js", () => ({
  GameConnection: MockGameConnection,
}));

vi.mock("./menu.js", () => ({
  showMenu: showMenuSpy,
  renderHostingScreen: renderHostingScreenSpy,
  hideMenu: hideMenuSpy,
  showJoinError: showJoinErrorSpy,
}));

vi.mock("./urlState.js", () => ({
  writeSessionToUrl: writeSessionToUrlSpy,
  clearSessionFromUrl: clearSessionFromUrlSpy,
  readSessionFromUrl: readSessionFromUrlSpy,
}));

vi.mock("./presence.js", () => ({
  computePresenceSnapshot: vi.fn(() => ({ state: "waiting", message: "Waiting for opponent..." })),
}));

vi.mock("./state-diff.js", () => ({
  computeStateDiffs: vi.fn(() => []),
}));

vi.mock("./player-palette.js", () => ({
  getPalette: vi.fn(() => ({
    root: 0,
    generator: 0,
    turret: 0,
    shield: 0,
  })),
}));

vi.mock("./local-game-loop.js", () => ({
  LocalGameLoop: class {},
}));

vi.mock("@fungus/game", () => ({
  defaultGameConfig: {
    map: {
      maxConnectionDistance: 100,
      nodeTypeConfigs: {
        generator: { cost: 1 },
        turret: { cost: 2 },
        shield: { cost: 3 },
        root: { cost: 0 },
      },
    },
  },
  createInitialState: vi.fn(),
  validatePlaceNode: vi.fn(() => ({ valid: false })),
}));

const mockGameState = {
  nodes: [],
  edges: [],
  players: [
    { id: "player-1", name: "Alice", resources: 0, spawnPoint: { x: 0, y: 0 } },
    { id: "player-2", name: "Bob", resources: 0, spawnPoint: { x: 10, y: 10 } },
  ],
  tick: 0,
  winner: null,
};

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

class FakeElement {
  public id = "";
  public textContent = "";
  public innerHTML = "";
  public style = { cssText: "", display: "" };
  public dataset: Record<string, string> = {};
  public children: FakeElement[] = [];
  public parent: FakeElement | null = null;

  constructor(
    public readonly ownerDocument: FakeDocument,
    public readonly tagName: string,
  ) {}

  appendChild(child: FakeElement): FakeElement {
    child.parent = this;
    this.children.push(child);
    this.ownerDocument.registerTree(child);
    return child;
  }

  remove(): void {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.ownerDocument.unregisterTree(this);
    this.parent = null;
  }

  addEventListener(): void {}
}

class FakeDocument {
  public readonly body = new FakeElement(this, "body");
  private readonly elementsById = new Map<string, FakeElement>();

  createElement(tagName: string): FakeElement {
    return new FakeElement(this, tagName);
  }

  getElementById(id: string): FakeElement | null {
    return this.elementsById.get(id) ?? null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    if (selector === "#palette button") {
      const palette = this.getElementById("palette");
      return palette?.children.filter((child) => child.tagName === "button") ?? [];
    }
    return [];
  }

  registerTree(element: FakeElement): void {
    if (element.id) {
      this.elementsById.set(element.id, element);
    }
    for (const child of element.children) {
      this.registerTree(child);
    }
  }

  unregisterTree(element: FakeElement): void {
    if (element.id) {
      this.elementsById.delete(element.id);
    }
    for (const child of element.children) {
      this.unregisterTree(child);
    }
  }
}

describe("main host flow", () => {
  beforeEach(() => {
    vi.resetModules();
    connectionInstances.length = 0;
    showMenuSpy.mockReset();
    renderHostingScreenSpy.mockReset();
    hideMenuSpy.mockReset();
    showJoinErrorSpy.mockReset();
    writeSessionToUrlSpy.mockReset();
    clearSessionFromUrlSpy.mockReset();
    readSessionFromUrlSpy.mockReset();
    readSessionFromUrlSpy.mockReturnValue({ matchId: null, playerId: null });
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue({
      json: async () => ({
        code: "ABC123",
        matchId: "match-1",
        playerId: "player-1",
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const document = new FakeDocument();
    const app = document.createElement("div");
    app.id = "app";
    document.body.appendChild(app);
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
    });
  });

  it("hides the hosting overlay when a match-state arrives before opponent presence", async () => {
    await import("./main.js");
    await flush();

    const menuCallbacks = showMenuSpy.mock.calls[0]?.[0];
    expect(menuCallbacks).toBeTruthy();

    await menuCallbacks.onHostGame("Alice");
    await flush();

    expect(renderHostingScreenSpy).toHaveBeenCalledWith("ABC123", expect.any(Function));
    expect(connectionInstances).toHaveLength(1);

    const connection = connectionInstances[0];
    connection.emit("match-state", { gameState: mockGameState });
    connection.emit("presence", { playerId: "player-2", connected: true });

    expect(hideMenuSpy).toHaveBeenCalledTimes(1);
  });
});
