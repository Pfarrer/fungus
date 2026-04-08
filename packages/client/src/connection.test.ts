import { describe, it, expect, afterEach } from "vitest";
import { WebSocketServer, WebSocket as WsWebSocket } from "ws";
import { GameConnection, decodeServerMessageData } from "./connection.js";
import { GameRenderer } from "./renderer.js";
import type { GameState } from "@fungus/game";

const mockGameState: GameState = {
  nodes: [
    {
      id: "1",
      playerId: "player-1",
      nodeType: "root",
      position: { x: 50, y: 300 },
      health: 100,
      maxHealth: 100,
      parentId: null,
      connected: true,
    },
    {
      id: "2",
      playerId: "player-2",
      nodeType: "root",
      position: { x: 750, y: 300 },
      health: 100,
      maxHealth: 100,
      parentId: null,
      connected: true,
    },
  ],
  edges: [],
  players: [
    { id: "player-1", resources: 0, spawnPoint: { x: 50, y: 300 } },
    { id: "player-2", resources: 0, spawnPoint: { x: 750, y: 300 } },
  ],
  tick: 0,
  winner: null,
};

function createMockServer(port: number): Promise<WebSocketServer> {
  return new Promise((resolve) => {
    const wss = new WebSocketServer({ port });
    wss.on("listening", () => resolve(wss));
  });
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("decodeServerMessageData", () => {
  it("decodes typed array websocket payloads as utf-8 text", async () => {
    const payload = new TextEncoder().encode(JSON.stringify({
      type: "tick-countdown",
      secondsRemaining: 1,
    }));

    await expect(decodeServerMessageData(payload)).resolves.toBe(
      '{"type":"tick-countdown","secondsRemaining":1}',
    );
  });

  it("returns null for unsupported websocket payloads", async () => {
    await expect(decodeServerMessageData({ nope: true })).resolves.toBeNull();
  });
});

describe("renderer runtime api", () => {
  it("exports the health animation hook used by tick-result handling", () => {
    expect(typeof GameRenderer.prototype.updateHealthTargets).toBe("function");
  });
});

describe("GameConnection integration", () => {
  let servers: WebSocketServer[] = [];
  let connections: GameConnection[] = [];

  afterEach(async () => {
    for (const conn of connections) {
      conn.disconnect();
    }
    connections = [];
    for (const server of servers) {
      const clients = [...(server as any)._ws?.clients ?? []];
      for (const c of clients) {
        if (c.readyState === WsWebSocket.OPEN) c.close();
      }
      server.close();
    }
    servers = [];
    await waitFor(100);
  });

  it("connects and receives match-state", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    wss.on("connection", (ws) => {
      ws.send(JSON.stringify({ type: "match-state", gameState: mockGameState }));
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const received: any[] = [];
    conn.on("match-state", (data) => {
      received.push(data);
    });

    conn.connect();
    await waitFor(200);

    expect(received.length).toBe(1);
    expect(received[0].gameState.nodes.length).toBe(2);
    expect(received[0].gameState.tick).toBe(0);
  });

  it("receives multiple tick-results in sequence without dropping any", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
      ws.send(JSON.stringify({ type: "match-state", gameState: mockGameState }));
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const tickResults: any[] = [];
    conn.on("tick-result", (data) => {
      tickResults.push(data);
    });

    conn.connect();
    await waitFor(100);

    const client = connectedClients[0];
    const numTicks = 10;
    for (let i = 1; i <= numTicks; i++) {
      const state: GameState = {
        ...mockGameState,
        tick: i,
        players: [
          { id: "player-1", resources: i, spawnPoint: { x: 50, y: 300 } },
          { id: "player-2", resources: i, spawnPoint: { x: 750, y: 300 } },
        ],
      };
      client.send(JSON.stringify({ type: "tick-result", gameState: state }));
    }

    await waitFor(300);

    expect(tickResults.length).toBe(numTicks);
    for (let i = 0; i < numTicks; i++) {
      expect(tickResults[i].gameState.tick).toBe(i + 1);
      expect(tickResults[i].gameState.players[0].resources).toBe(i + 1);
    }
  });

  it("receives tick-countdown messages", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const countdowns: any[] = [];
    conn.on("tick-countdown", (data) => {
      countdowns.push(data);
    });

    conn.connect();
    await waitFor(100);

    const client = connectedClients[0];
    client.send(JSON.stringify({ type: "tick-countdown", secondsRemaining: 5 }));
    client.send(JSON.stringify({ type: "tick-countdown", secondsRemaining: 4 }));
    client.send(JSON.stringify({ type: "tick-countdown", secondsRemaining: 3 }));

    await waitFor(200);

    expect(countdowns.length).toBe(3);
    expect(countdowns[0].secondsRemaining).toBe(5);
    expect(countdowns[1].secondsRemaining).toBe(4);
    expect(countdowns[2].secondsRemaining).toBe(3);
  });

  it("sends queue-actions message in correct format", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const receivedMessages: any[] = [];
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    conn.connect();
    await waitFor(100);

    conn.queueActions([
      { type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 200 } },
    ]);

    await waitFor(100);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].type).toBe("queue-actions");
    expect(receivedMessages[0].actions).toEqual([
      { type: "PlaceNode", nodeType: "generator", position: { x: 100, y: 200 } },
    ]);
  });

  it("queues multiple batched actions correctly", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const receivedMessages: any[] = [];
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    conn.connect();
    await waitFor(100);

    conn.queueActions([
      { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } },
      { type: "PlaceNode", nodeType: "turret", position: { x: 70, y: 320 } },
    ]);

    await waitFor(100);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].actions.length).toBe(2);
  });

  it("reports connection status transitions", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const statuses: string[] = [];
    conn.onStatusChange((status) => {
      statuses.push(status);
    });

    expect(conn.status).toBe("disconnected");

    conn.connect();
    await waitFor(200);

    expect(statuses).toContain("connected");
    expect(conn.status).toBe("connected");
  });

  it("tick-result handler receives full gameState with correct structure", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let receivedState: GameState | null = null;
    conn.on("tick-result", (data) => {
      receivedState = data.gameState;
    });

    conn.connect();
    await waitFor(100);

    const complexState: GameState = {
      nodes: [
        {
          id: "1",
          playerId: "player-1",
          nodeType: "root",
          position: { x: 50, y: 300 },
          health: 95,
          maxHealth: 100,
          parentId: null,
          connected: true,
        },
        {
          id: "2",
          playerId: "player-2",
          nodeType: "root",
          position: { x: 750, y: 300 },
          health: 100,
          maxHealth: 100,
          parentId: null,
          connected: true,
        },
        {
          id: "3",
          playerId: "player-1",
          nodeType: "generator",
          position: { x: 60, y: 310 },
          health: 30,
          maxHealth: 30,
          parentId: "1",
          connected: true,
        },
      ],
      edges: [
        { id: "e1", fromNodeId: "1", toNodeId: "3", health: 20, maxHealth: 20 },
      ],
      players: [
        { id: "player-1", resources: 15, spawnPoint: { x: 50, y: 300 } },
        { id: "player-2", resources: 10, spawnPoint: { x: 750, y: 300 } },
      ],
      tick: 5,
      winner: null,
    };

    connectedClients[0].send(JSON.stringify({ type: "tick-result", gameState: complexState }));
    await waitFor(200);

    expect(receivedState).not.toBeNull();
    expect(receivedState!.nodes.length).toBe(3);
    expect(receivedState!.edges.length).toBe(1);
    expect(receivedState!.tick).toBe(5);
    expect(receivedState!.nodes[0].health).toBe(95);
    expect(receivedState!.edges[0].fromNodeId).toBe("1");
  });

  it("handles rapid tick-results (10 ticks in quick succession)", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const tickResults: any[] = [];
    conn.on("tick-result", (data) => {
      tickResults.push(data);
    });

    conn.connect();
    await waitFor(100);

    const client = connectedClients[0];
    for (let i = 1; i <= 10; i++) {
      const state: GameState = {
        ...mockGameState,
        tick: i,
        nodes: [
          {
            ...mockGameState.nodes[0],
            health: 100 - i,
          },
          mockGameState.nodes[1],
        ],
      };
      client.send(JSON.stringify({ type: "tick-result", gameState: state }));
    }

    await waitFor(500);

    expect(tickResults.length).toBe(10);

    for (let i = 0; i < 10; i++) {
      expect(tickResults[i].gameState.tick).toBe(i + 1);
    }

    const lastTick = tickResults[9].gameState;
    expect(lastTick.nodes[0].health).toBe(90);
  });

  it("receives waiting message", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let waitingReceived = false;
    conn.on("waiting", () => {
      waitingReceived = true;
    });

    conn.connect();
    await waitFor(100);

    connectedClients[0].send(JSON.stringify({ type: "waiting" }));
    await waitFor(100);

    expect(waitingReceived).toBe(true);
  });

  it("receives error message", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let errorMsg: string | null = null;
    conn.on("error", (data) => {
      errorMsg = data.message;
    });

    conn.connect();
    await waitFor(100);

    connectedClients[0].send(JSON.stringify({ type: "error", message: "test error" }));
    await waitFor(100);

    expect(errorMsg).toBe("test error");
  });

  it("multiple handlers for same event type all fire", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let count1 = 0;
    let count2 = 0;
    conn.on("tick-result", () => { count1++; });
    conn.on("tick-result", () => { count2++; });

    conn.connect();
    await waitFor(100);

    connectedClients[0].send(JSON.stringify({ type: "tick-result", gameState: mockGameState }));
    await waitFor(100);

    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it("off removes handler so it no longer fires", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let count = 0;
    const handler = () => { count++; };
    conn.on("tick-result", handler);

    conn.connect();
    await waitFor(100);

    connectedClients[0].send(JSON.stringify({ type: "tick-result", gameState: mockGameState }));
    await waitFor(100);
    expect(count).toBe(1);

    conn.off("tick-result", handler);

    connectedClients[0].send(JSON.stringify({ type: "tick-result", gameState: mockGameState }));
    await waitFor(100);
    expect(count).toBe(1);
  });
});

describe("GameConnection + computeStateDiffs integration", () => {
  let servers: WebSocketServer[] = [];
  let connections: GameConnection[] = [];

  afterEach(async () => {
    for (const conn of connections) {
      conn.disconnect();
    }
    connections = [];
    for (const server of servers) {
      server.close();
    }
    servers = [];
    await waitFor(100);
  });

  it("tick-result messages trigger correct state diff computation", async () => {
    const { computeStateDiffs } = await import("./state-diff.js");

    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let gameState: GameState | null = null;
    let previousGameState: GameState | null = null;
    const allEffects: any[] = [];

    conn.on("tick-result", (data) => {
      previousGameState = gameState;
      gameState = data.gameState;

      if (previousGameState) {
        const effects = computeStateDiffs(previousGameState, gameState);
        allEffects.push(...effects);
      }
    });

    conn.connect();
    await waitFor(100);

    const client = connectedClients[0];

    const state1: GameState = {
      ...mockGameState,
      tick: 1,
      nodes: mockGameState.nodes.map((n) => ({ ...n, health: 100 })),
    };
    client.send(JSON.stringify({ type: "tick-result", gameState: state1 }));
    await waitFor(100);

    const state2: GameState = {
      ...mockGameState,
      tick: 2,
      nodes: [
        { ...mockGameState.nodes[0], health: 80 },
        { ...mockGameState.nodes[1], health: 100 },
      ],
    };
    client.send(JSON.stringify({ type: "tick-result", gameState: state2 }));
    await waitFor(100);

    expect(gameState).not.toBeNull();
    expect(gameState!.tick).toBe(2);
    expect(gameState!.nodes[0].health).toBe(80);
    expect(allEffects.length).toBe(1);
    expect(allEffects[0].type).toBe("DamageFlash");
    expect(allEffects[0].nodeId).toBe("1");
  });

  it("detects node death when node disappears between ticks", async () => {
    const { computeStateDiffs } = await import("./state-diff.js");

    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const connectedClients: WsWebSocket[] = [];
    wss.on("connection", (ws) => {
      connectedClients.push(ws);
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    let gameState: GameState | null = null;
    let previousGameState: GameState | null = null;
    const allEffects: any[] = [];

    conn.on("tick-result", (data) => {
      previousGameState = gameState;
      gameState = data.gameState;

      if (previousGameState) {
        const effects = computeStateDiffs(previousGameState, gameState);
        allEffects.push(...effects);
      }
    });

    conn.connect();
    await waitFor(100);

    const client = connectedClients[0];

    const stateWithGenerator: GameState = {
      ...mockGameState,
      tick: 1,
      nodes: [
        ...mockGameState.nodes,
        {
          id: "3",
          playerId: "player-1",
          nodeType: "generator" as const,
          position: { x: 60, y: 310 },
          health: 30,
          maxHealth: 30,
          parentId: "1",
          connected: true,
        },
      ],
      edges: [
        { id: "e1", fromNodeId: "1", toNodeId: "3", health: 20, maxHealth: 20 },
      ],
    };
    client.send(JSON.stringify({ type: "tick-result", gameState: stateWithGenerator }));
    await waitFor(100);

    const stateWithoutGenerator: GameState = {
      ...mockGameState,
      tick: 2,
      nodes: [...mockGameState.nodes],
      edges: [],
    };
    client.send(JSON.stringify({ type: "tick-result", gameState: stateWithoutGenerator }));
    await waitFor(100);

    expect(allEffects.length).toBeGreaterThanOrEqual(2);
    const deathEffect = allEffects.find((e) => e.type === "NodeDeath");
    expect(deathEffect).toBeDefined();
    expect(deathEffect.nodeId).toBe("3");

    const edgeBreakEffect = allEffects.find((e) => e.type === "EdgeBreak");
    expect(edgeBreakEffect).toBeDefined();
    expect(edgeBreakEffect.edgeId).toBe("e1");
  });
});

describe("Auto-submit: immediate action submission", () => {
  let servers: WebSocketServer[] = [];
  let connections: GameConnection[] = [];

  afterEach(async () => {
    for (const conn of connections) {
      conn.disconnect();
    }
    connections = [];
    for (const server of servers) {
      const clients = [...(server as any)._ws?.clients ?? []];
      for (const c of clients) {
        if (c.readyState === WsWebSocket.OPEN) c.close();
      }
      server.close();
    }
    servers = [];
    await waitFor(100);
  });

  it("sends a single action immediately via queueActions", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const receivedMessages: any[] = [];
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    conn.connect();
    await waitFor(100);

    conn.queueActions([
      { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } },
    ]);

    await waitFor(100);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].type).toBe("queue-actions");
    expect(receivedMessages[0].actions).toEqual([
      { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } },
    ]);
  });

  it("sends each action as a separate queue-actions message on rapid placement", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const receivedMessages: any[] = [];
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    conn.connect();
    await waitFor(100);

    const action1: import("@fungus/game").GameAction = {
      type: "PlaceNode",
      nodeType: "generator",
      position: { x: 60, y: 310 },
    };
    const action2: import("@fungus/game").GameAction = {
      type: "PlaceNode",
      nodeType: "turret",
      position: { x: 70, y: 320 },
    };

    conn.queueActions([action1]);
    conn.queueActions([action2]);

    await waitFor(100);

    expect(receivedMessages.length).toBe(2);
    expect(receivedMessages[0].actions).toEqual([action1]);
    expect(receivedMessages[1].actions).toEqual([action2]);
  });

  it("silently drops queueActions when not connected", async () => {
    const conn = new GameConnection(`ws://localhost:1`);
    connections.push(conn);

    expect(() => {
      conn.queueActions([
        { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } },
      ]);
    }).not.toThrow();
  });

  it("flushes buffered pending actions when connection is established", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const receivedMessages: any[] = [];
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const pendingActions: import("@fungus/game").GameAction[] = [
      { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } },
      { type: "PlaceNode", nodeType: "turret", position: { x: 70, y: 320 } },
    ];

    conn.onStatusChange((status) => {
      if (status === "connected" && pendingActions.length > 0) {
        conn.queueActions(pendingActions);
        pendingActions.length = 0;
      }
    });

    conn.connect();
    await waitFor(200);

    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0].type).toBe("queue-actions");
    expect(receivedMessages[0].actions.length).toBe(2);
    expect(receivedMessages[0].actions[0].nodeType).toBe("generator");
    expect(receivedMessages[0].actions[1].nodeType).toBe("turret");
  });

  it("does not re-flush after second connect if pending buffer is cleared", async () => {
    const wss = await createMockServer(0);
    servers.push(wss);
    const port = (wss.address() as { port: number }).port;

    const receivedMessages: any[] = [];
    wss.on("connection", (ws) => {
      ws.on("message", (data) => {
        receivedMessages.push(JSON.parse(data.toString()));
      });
    });

    const conn = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn);

    const pendingActions: import("@fungus/game").GameAction[] = [
      { type: "PlaceNode", nodeType: "generator", position: { x: 60, y: 310 } },
    ];

    conn.onStatusChange((status) => {
      if (status === "connected" && pendingActions.length > 0) {
        conn.queueActions(pendingActions);
        pendingActions.length = 0;
      }
    });

    conn.connect();
    await waitFor(200);

    expect(receivedMessages.length).toBe(1);

    conn.disconnect();
    await waitFor(200);

    const conn2 = new GameConnection(`ws://localhost:${port}`);
    connections.push(conn2);

    conn2.onStatusChange((status) => {
      if (status === "connected" && pendingActions.length > 0) {
        conn2.queueActions(pendingActions);
        pendingActions.length = 0;
      }
    });

    conn2.connect();
    await waitFor(200);

    expect(receivedMessages.length).toBe(1);
  });
});
