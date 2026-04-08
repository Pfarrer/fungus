import { Container, Graphics } from "pixi.js";
import { GameRenderer } from "./renderer.js";
import { GameConnection } from "./connection.js";
import type { ConnectionStatus } from "./connection.js";
import {
  createInitialState,
  defaultGameConfig,
  validatePlaceNode,
} from "@fungus/game";
import type { GameState, GameAction, GameConfig } from "@fungus/game";
import { computeStateDiffs } from "./state-diff.js";
import { ScreenManager } from "./screen-manager.js";
import { LocalGameLoop } from "./local-game-loop.js";
import {
  showMenu,
  renderHostingScreen,
  showJoinError,
  hideMenu,
} from "./menu.js";

let gameState: GameState | null = null;
let previousGameState: GameState | null = null;
let config: GameConfig = defaultGameConfig;
let renderer: GameRenderer;
let selectedNodeType: string | null = null;
let pendingActions: GameAction[] = [];
let debugOverlayVisible = false;
const debugContainer = new Container();
let connectionStatus: ConnectionStatus = "disconnected";
let waitingForOpponent = false;
let smoothCountdownValue: number | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;
let matchEndShown = false;

const previewContainer = new Container();
let previewGraphics: Graphics | null = null;

let connection: GameConnection | null = null;
let localLoop: LocalGameLoop | null = null;
let screenManager: ScreenManager;
let currentPlayerId: string | null = null;

function init(): void {
  renderer = new GameRenderer();
  const appEl = document.getElementById("app")!;
  screenManager = new ScreenManager();

  renderer.init(appEl).then(() => {
    setupInteraction();
    setupDebugToggle();

    const urlParams = new URLSearchParams(window.location.search);
    const urlMatchId = urlParams.get("matchId");
    const urlPlayerId = urlParams.get("playerId");

    if (urlMatchId && urlPlayerId) {
      currentPlayerId = urlPlayerId;
      screenManager.transition("playing");
      setupConnection(urlMatchId, urlPlayerId);
      createUI();
      updateHUD();
    } else {
      showMenu({
        onSinglePlayer: (playerName: string) => {
          currentPlayerId = "player-1";
          startSinglePlayer(playerName);
        },
        onHostGame: (playerName: string) => {
          startHosting(playerName);
        },
        onJoinGame: (playerName: string, code: string) => {
          startJoining(playerName, code);
        },
      });
    }
  });
}

async function startSinglePlayer(playerName: string): Promise<void> {
  const state = createInitialState(config);
  state.players[0].name = playerName;
  gameState = state;

  screenManager.transition("playing");
  hideMenu();
  createUI();
  updateHUD();

  localLoop = new LocalGameLoop((newState) => {
    previousGameState = gameState;
    gameState = newState;
    renderState();
  }, config, state);

  localLoop.start();
  connectionStatus = "connected";
}

async function startHosting(playerName: string): Promise<void> {
  try {
    const response = await fetch("http://localhost:3001/host", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    const data = await response.json();
    const { code, matchId, playerId } = data;

    currentPlayerId = playerId;
    renderHostingScreen(code);

    const url = new URL(window.location.href);
    url.searchParams.set("matchId", matchId);
    url.searchParams.set("playerId", playerId);
    window.history.replaceState({}, "", url.toString());

    setupConnection(matchId, playerId, playerName);
    createUI();
    updateHUD();
  } catch (err) {
    console.error("Failed to host game:", err);
  }
}

async function startJoining(playerName: string, code: string): Promise<void> {
  try {
    const response = await fetch(`http://localhost:3001/join?code=${encodeURIComponent(code)}`);
    const data = await response.json();

    if (!data.valid) {
      showJoinError("Invalid game code");
      return;
    }

    const { matchId, playerId } = data;
    currentPlayerId = playerId;

    const url = new URL(window.location.href);
    url.searchParams.set("matchId", matchId);
    url.searchParams.set("playerId", playerId);
    window.history.replaceState({}, "", url.toString());

    screenManager.transition("playing");
    hideMenu();
    setupConnection(matchId, playerId, playerName);
    createUI();
    updateHUD();
  } catch (err) {
    console.error("Failed to join game:", err);
    showJoinError("Failed to connect to server");
  }
}

function setupConnection(matchId: string, playerId: string, playerName?: string): void {
  let wsUrl = `ws://localhost:3001?matchId=${encodeURIComponent(matchId)}&playerId=${encodeURIComponent(playerId)}`;
  if (playerName) {
    wsUrl += `&playerName=${encodeURIComponent(playerName)}`;
  }
  connection = new GameConnection(wsUrl);

  connection.on("match-state", (data) => {
    previousGameState = gameState;
    gameState = data.gameState;
    if (screenManager.state !== "playing") {
      screenManager.transition("playing");
      hideMenu();
    }
    renderState();
  });

  connection.on("tick-result", (data) => {
    previousGameState = gameState;
    gameState = data.gameState;
    smoothCountdownValue = null;
    clearCountdownInterval();

    if (previousGameState) {
      const effects = computeStateDiffs(previousGameState, gameState);
      for (const effect of effects) {
        renderer.addEffect(effect);
      }
      renderer.updateHealthTargets(gameState.nodes);
    }

    renderState();
  });

  connection.on("tick-countdown", (data) => {
    smoothCountdownValue = data.secondsRemaining;
    startCountdownInterval();
    updateHUD();
  });

  connection.on("waiting", () => {
    waitingForOpponent = true;
    updateHUD();
  });

  connection.onStatusChange((status) => {
    connectionStatus = status;
    if (status === "connected" && pendingActions.length > 0 && connection) {
      connection.queueActions(pendingActions);
      pendingActions = [];
    }
    updateHUD();
  });

  connection.connect();
}

function startCountdownInterval(): void {
  clearCountdownInterval();
  countdownInterval = setInterval(() => {
    if (smoothCountdownValue !== null && smoothCountdownValue > 0) {
      smoothCountdownValue = Math.max(0, smoothCountdownValue - 0.1);
      updateCountdownDisplay();
    }
  }, 100);
}

function clearCountdownInterval(): void {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function updateCountdownDisplay(): void {
  const el = document.getElementById("countdown-value");
  if (el && smoothCountdownValue !== null) {
    el.textContent = smoothCountdownValue.toFixed(1);
  }
}

function renderState(): void {
  if (!gameState) return;
  waitingForOpponent = false;
  renderer.render(gameState, config);
  updateHUD();
  if (debugOverlayVisible) renderDebugOverlay();
  checkMatchEnd();
}

function checkMatchEnd(): void {
  if (gameState?.winner && !matchEndShown) {
    matchEndShown = true;
    showMatchEndScreen();
  }
}

function showMatchEndScreen(): void {
  const existing = document.getElementById("match-end-screen");
  if (existing) return;

  const overlayEl = document.createElement("div");
  overlayEl.id = "match-end-screen";
  overlayEl.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
    align-items: center; justify-content: center; z-index: 200;
    font-family: monospace; color: #e0e0e0;
  `;

  const isVictory = gameState?.winner === currentPlayerId;
  const title = document.createElement("h1");
  title.textContent = isVictory ? "Victory!" : "Defeat!";
  title.style.cssText = `
    font-size: 48px; margin-bottom: 20px;
    color: ${isVictory ? "#53d769" : "#e94560"};
  `;
  overlayEl.appendChild(title);

  const stats = document.createElement("div");
  stats.style.cssText = `font-size: 16px; line-height: 1.8; text-align: center; margin-bottom: 30px;`;
  stats.innerHTML = `
    <div>Tick: <span style="color:#4ecdc4">${gameState?.tick ?? 0}</span></div>
    <div>Your nodes: <span style="color:#53d769">${gameState?.nodes.filter((n) => n.playerId === currentPlayerId).length ?? 0}</span></div>
    <div>Resources: <span style="color:#53d769">${gameState?.players.find((p) => p.id === currentPlayerId)?.resources ?? 0}</span></div>
  `;
  overlayEl.appendChild(stats);

  const newMatchBtn = document.createElement("button");
  newMatchBtn.textContent = "New Match";
  newMatchBtn.style.cssText = `
    padding: 12px 32px; border: 2px solid #4ecdc4;
    background: #16213e; color: #4ecdc4; cursor: pointer;
    border-radius: 6px; font-family: monospace; font-size: 18px;
    pointer-events: auto;
  `;
  newMatchBtn.addEventListener("click", () => {
    cleanupGame();
    const url = new URL(window.location.href);
    url.searchParams.delete("matchId");
    url.searchParams.delete("playerId");
    window.history.replaceState({}, "", url.toString());
    showMenu({
      onSinglePlayer: (playerName: string) => {
        currentPlayerId = "player-1";
        startSinglePlayer(playerName);
      },
      onHostGame: (playerName: string) => {
        startHosting(playerName);
      },
      onJoinGame: (playerName: string, code: string) => {
        startJoining(playerName, code);
      },
    });
  });
  overlayEl.appendChild(newMatchBtn);

  const hud = document.getElementById("hud");
  if (hud) hud.style.display = "none";
  const palette = document.getElementById("palette");
  if (palette) palette.style.display = "none";

  document.body.appendChild(overlayEl);
}

function cleanupGame(): void {
  if (localLoop) {
    localLoop.stop();
    localLoop = null;
  }
  if (connection) {
    connection.disconnect();
    connection = null;
  }
  gameState = null;
  previousGameState = null;
  matchEndShown = false;
  waitingForOpponent = false;
  selectedNodeType = null;
  pendingActions = [];
  smoothCountdownValue = null;
  clearCountdownInterval();

  const matchEnd = document.getElementById("match-end-screen");
  if (matchEnd) matchEnd.remove();
  const uiOverlay = document.getElementById("ui-overlay");
  if (uiOverlay) uiOverlay.remove();
  const debugHtml = document.getElementById("debug-html-overlay");
  if (debugHtml) debugHtml.remove();
}

function setupInteraction(): void {
  const canvas = renderer["app"].canvas as HTMLCanvasElement;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0 && selectedNodeType && gameState && !gameState.winner && currentPlayerId) {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = renderer.screenToWorld(screenX, screenY);

      const action: GameAction = {
        type: "PlaceNode",
        nodeType: selectedNodeType,
        position: { x: Math.round(worldPos.x), y: Math.round(worldPos.y) },
      };

      const validation = validatePlaceNode(
        gameState,
        config,
        currentPlayerId,
        action.nodeType,
        action.position,
      );

      if (validation.valid) {
        if (localLoop) {
          localLoop.queueAction(action);
        } else if (connectionStatus === "connected" && connection) {
          connection.queueActions([action]);
        } else {
          pendingActions.push(action);
        }
      }
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!selectedNodeType) {
      clearPreview();
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = renderer.screenToWorld(screenX, screenY);

    const roundedPos = {
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
    };

    const validation = gameState && currentPlayerId
      ? validatePlaceNode(gameState, config, currentPlayerId, selectedNodeType, roundedPos)
      : { valid: false };

    showPlacementPreview(roundedPos, validation.valid);
  });
}

function setupDebugToggle(): void {
  window.addEventListener("keydown", (e) => {
    if (e.key === "d" || e.key === "D") {
      debugOverlayVisible = !debugOverlayVisible;
      renderDebugOverlay();
    }
  });
}

function renderDebugOverlay(): void {
  debugContainer.removeChildren();

  if (!debugOverlayVisible || !gameState) return;

  for (const node of gameState.nodes) {
    const g = new Graphics();

    const dotColor = node.connected ? 0x00ff00 : 0xff0000;
    g.circle(14, -14, 4);
    g.fill(dotColor);

    if (node.nodeType === "turret") {
      const attackRange = config.map.nodeTypeConfigs.turret?.attackRange;
      if (attackRange) {
        g.circle(node.position.x, node.position.y, attackRange);
        g.stroke({ color: 0xff8c00, width: 1, alpha: 0.4 });
      }
    }

    debugContainer.addChild(g);
  }

  let existingDebugHtml = document.getElementById("debug-html-overlay");
  if (!existingDebugHtml) {
    existingDebugHtml = document.createElement("div");
    existingDebugHtml.id = "debug-html-overlay";
    existingDebugHtml.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none; font-family: monospace; font-size: 10px;
      color: white; z-index: 100; display: none;
    `;
    document.body.appendChild(existingDebugHtml);
  }

  if (debugOverlayVisible) {
    existingDebugHtml.style.display = "block";
    existingDebugHtml.innerHTML = gameState.nodes.map((node) => {
      const color = node.connected ? "#0f0" : "#f00";
      const bgColor = node.connected ? "rgba(0,255,0,0.15)" : "rgba(255,0,0,0.15)";
      return `<div style="position:absolute;left:${node.position.x + 18}px;top:${node.position.y - 20}px;color:${color};background:${bgColor};padding:1px 4px;border-radius:2px;white-space:nowrap;">${node.health}/${node.maxHealth}</div>`;
    }).join("");
  } else {
    existingDebugHtml.style.display = "none";
  }

  const world = (renderer as any)["world"] as Container;
  world.addChild(debugContainer);
}

function showPlacementPreview(
  position: { x: number; y: number },
  valid: boolean,
): void {
  clearPreview();

  previewGraphics = new Graphics();

  const maxDist = config.map.maxConnectionDistance;
  previewGraphics.circle(position.x, position.y, maxDist);
  previewGraphics.fill({
    color: valid ? 0x00ff00 : 0xff0000,
    alpha: 0.2,
  });
  previewGraphics.circle(position.x, position.y, maxDist);
  previewGraphics.stroke({
    color: valid ? 0x00ff00 : 0xff0000,
    width: 1,
    alpha: 0.5,
  });

  let nodeColor: number;
  let nodeAlpha: number;
  let radius: number;
  switch (selectedNodeType) {
    case "turret":
      nodeColor = 0xff8c00;
      nodeAlpha = 0.53;
      radius = 9;
      break;
    case "shield":
      nodeColor = 0x00bfff;
      nodeAlpha = 0.53;
      radius = 9;
      break;
    case "root":
      nodeColor = 0xe94560;
      nodeAlpha = 0.53;
      radius = 12;
      break;
    default:
      nodeColor = 0x53d769;
      nodeAlpha = 0.53;
      radius = 8;
      break;
  }

  previewGraphics.circle(position.x, position.y, radius);
  previewGraphics.fill({ color: nodeColor, alpha: nodeAlpha });

  previewContainer.addChild(previewGraphics);

  const world = (renderer as any)["world"] as Container;
  world.addChild(previewContainer);
}

function clearPreview(): void {
  previewContainer.removeChildren();
  previewGraphics = null;
}

function createUI(): void {
  const uiDiv = document.createElement("div");
  uiDiv.id = "ui-overlay";
  uiDiv.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none; font-family: monospace; color: #e0e0e0;
  `;

  const hud = document.createElement("div");
  hud.id = "hud";
  hud.style.cssText = `
    position: absolute; top: 10px; left: 10px;
    background: rgba(0,0,0,0.7); padding: 10px 15px;
    border-radius: 5px; font-size: 14px; line-height: 1.6;
    pointer-events: auto; min-width: 220px;
  `;
  uiDiv.appendChild(hud);

  const palette = document.createElement("div");
  palette.id = "palette";
  palette.style.cssText = `
    position: absolute; bottom: 10px; left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7); padding: 10px 15px;
    border-radius: 5px; display: flex; gap: 10px;
    pointer-events: auto;
  `;

  for (const [type, typeConfig] of Object.entries(config.map.nodeTypeConfigs)) {
    if (type === "root") continue;
    const btn = document.createElement("button");
    btn.textContent = `${type} (${typeConfig.cost})`;
    btn.dataset.type = type;
    btn.style.cssText = `
      padding: 8px 16px; border: 2px solid #4a4e69;
      background: #16213e; color: #e0e0e0; cursor: pointer;
      border-radius: 4px; font-family: monospace; font-size: 13px;
    `;
    btn.addEventListener("click", () => {
      selectedNodeType = selectedNodeType === type ? null : type;
      updatePaletteSelection();
      if (!selectedNodeType) clearPreview();
    });
    palette.appendChild(btn);
  }

  uiDiv.appendChild(palette);

  document.body.appendChild(uiDiv);
}

function updatePaletteSelection(): void {
  const buttons = document.querySelectorAll("#palette button");
  buttons.forEach((btn) => {
    const btnType = (btn as HTMLElement).dataset.type;
    if (btnType === selectedNodeType) {
      (btn as HTMLElement).style.borderColor = "#e94560";
      (btn as HTMLElement).style.background = "#2a2a4e";
    } else {
      (btn as HTMLElement).style.borderColor = "#4a4e69";
      (btn as HTMLElement).style.background = "#16213e";
    }
  });
}

function updateHUD(): void {
  const hud = document.getElementById("hud");
  if (!hud) return;

  const player = currentPlayerId ? gameState?.players.find((p) => p.id === currentPlayerId) : null;
  const resources = player ? player.resources : 0;
  const playerName = player?.name;

  const statusColor: Record<ConnectionStatus, string> = {
    connected: "#53d769",
    reconnecting: "#ff8c00",
    disconnected: "#e94560",
  };

  let html = "";

  if (playerName) {
    html += `<div style="font-size:16px;font-weight:bold;color:#4ecdc4;margin-bottom:4px;">${playerName}</div>`;
  }

  if (localLoop) {
    html += `<div>Mode: <span style="color:#53d769">Single Player</span></div>`;
  } else {
    html += `<div>Connection: <span style="color:${statusColor[connectionStatus]}">${connectionStatus}</span></div>`;
  }

  if (gameState) {
    html += `<div>Tick: <span style="color:#e94560">${gameState.tick}</span></div>`;
  }

  html += `<div>Resources: <span style="color:#53d769">${resources}</span> / ${config.resourceCap}</div>`;

  if (smoothCountdownValue !== null) {
    html += `<div>Next tick: <span style="color:#4ecdc4" id="countdown-value">${smoothCountdownValue.toFixed(1)}</span>s</div>`;
  }

  if (gameState && currentPlayerId) {
    const enemyNodes = gameState.nodes.filter((n) => n.playerId !== currentPlayerId);
    const enemyByType: Record<string, number> = { root: 0, generator: 0, turret: 0, shield: 0 };
    for (const node of enemyNodes) {
      enemyByType[node.nodeType] = (enemyByType[node.nodeType] ?? 0) + 1;
    }
    html += `<div style="margin-top:6px;font-size:12px;color:#999;">`;
    html += `<div style="color:#ccc;">Enemy: R:${enemyByType.root} G:${enemyByType.generator} T:${enemyByType.turret} S:${enemyByType.shield}</div>`;
    html += `</div>`;
  }

  if (waitingForOpponent) {
    html += `<div style="color:#ff8c00">Waiting for opponent...</div>`;
  }

  if (gameState?.winner && currentPlayerId) {
    const isPlayerWin = gameState.winner === currentPlayerId;
    html += isPlayerWin
      ? `<div style="color:#53d769;font-weight:bold;margin-top:4px;">VICTORY!</div>`
      : `<div style="color:#e94560;font-weight:bold;margin-top:4px;">DEFEAT!</div>`;
  }

  hud.innerHTML = html;
}

init();
