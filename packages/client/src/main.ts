import { Container, Graphics } from "pixi.js";
import { GameRenderer } from "./renderer.js";
import {
  createInitialState,
  defaultGameConfig,
  validatePlaceNode,
  simulateTick,
  loadScenario,
  builtInScenarios,
} from "@fungus/game";
import type { GameState, GameAction, GameConfig, ScenarioData } from "@fungus/game";

const SCENARIOS: ScenarioData[] = builtInScenarios;

const PLAYER_ID = "player-1";
let gameState: GameState;
let config: GameConfig;
let renderer: GameRenderer;
let selectedNodeType: string | null = null;
let tickMode: "auto" | "manual" = "manual";
let autoTickInterval: ReturnType<typeof setInterval> | null = null;
let queuedActions: GameAction[] = [];
let debugOverlayVisible = false;
const debugContainer = new Container();

const previewContainer = new Container();
let previewGraphics: Graphics | null = null;

function init(): void {
  config = defaultGameConfig;
  gameState = createInitialState(config);

  const appEl = document.getElementById("app")!;
  renderer = new GameRenderer();

  renderer.init(appEl).then(() => {
    renderer.render(gameState, config);
    setupInteraction();
    setupDebugToggle();
    createUI();
    updateHUD();
  });
}

function setupInteraction(): void {
  const canvas = renderer["app"].canvas as HTMLCanvasElement;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0 && selectedNodeType && !gameState.winner) {
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
        PLAYER_ID,
        action.nodeType,
        action.position,
      );

      if (validation.valid) {
        queuedActions.push(action);
        updateActionPreview();
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

    const validation = validatePlaceNode(
      gameState,
      config,
      PLAYER_ID,
      selectedNodeType,
      roundedPos,
    );

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

  if (!debugOverlayVisible) return;

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
    pointer-events: auto;
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

  const controls = document.createElement("div");
  controls.id = "controls";
  controls.style.cssText = `
    position: absolute; bottom: 10px; right: 10px;
    background: rgba(0,0,0,0.7); padding: 10px 15px;
    border-radius: 5px; display: flex; flex-direction: column; gap: 5px;
    pointer-events: auto;
  `;

  const nextTickBtn = document.createElement("button");
  nextTickBtn.textContent = "Next Tick";
  nextTickBtn.style.cssText = `
    padding: 8px 16px; border: 2px solid #4a4e69;
    background: #16213e; color: #e0e0e0; cursor: pointer;
    border-radius: 4px; font-family: monospace; font-size: 13px;
  `;
  nextTickBtn.addEventListener("click", () => advanceTick());
  controls.appendChild(nextTickBtn);

  const autoBtn = document.createElement("button");
  autoBtn.textContent = "Auto: OFF";
  autoBtn.id = "auto-btn";
  autoBtn.style.cssText = `
    padding: 8px 16px; border: 2px solid #4a4e69;
    background: #16213e; color: #e0e0e0; cursor: pointer;
    border-radius: 4px; font-family: monospace; font-size: 13px;
  `;
  autoBtn.addEventListener("click", () => toggleAutoTick());
  controls.appendChild(autoBtn);

  const executeBtn = document.createElement("button");
  executeBtn.textContent = `Execute Actions (${queuedActions.length})`;
  executeBtn.id = "execute-btn";
  executeBtn.style.cssText = `
    padding: 8px 16px; border: 2px solid #e94560;
    background: #16213e; color: #e94560; cursor: pointer;
    border-radius: 4px; font-family: monospace; font-size: 13px;
  `;
  executeBtn.addEventListener("click", () => {
    advanceTick();
    queuedActions = [];
    updateActionPreview();
  });
  controls.appendChild(executeBtn);

  uiDiv.appendChild(controls);

  const scenarioPanel = createScenarioPanel();
  uiDiv.appendChild(scenarioPanel);

  document.body.appendChild(uiDiv);
}

function createScenarioPanel(): HTMLElement {
  const panel = document.createElement("div");
  panel.id = "scenario-panel";
  panel.style.cssText = `
    position: absolute; top: 10px; right: 10px;
    background: rgba(0,0,0,0.7); padding: 10px 15px;
    border-radius: 5px; pointer-events: auto;
    font-family: monospace; font-size: 13px; min-width: 180px;
  `;

  const title = document.createElement("div");
  title.textContent = "Scenarios";
  title.style.cssText = `font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #4ecdc4;`;
  panel.appendChild(title);

  for (const scenario of SCENARIOS) {
    const entry = document.createElement("div");
    entry.style.cssText = `margin-bottom: 6px;`;

    const name = document.createElement("div");
    name.textContent = scenario.name;
    name.style.cssText = `color: #e0e0e0; font-weight: bold;`;
    entry.appendChild(name);

    const desc = document.createElement("div");
    desc.textContent = scenario.description;
    desc.style.cssText = `color: #888; font-size: 11px; margin-bottom: 4px;`;
    entry.appendChild(desc);

    const loadBtn = document.createElement("button");
    loadBtn.textContent = "Load";
    loadBtn.style.cssText = `
      padding: 4px 12px; border: 2px solid #4ecdc4;
      background: #16213e; color: #4ecdc4; cursor: pointer;
      border-radius: 4px; font-family: monospace; font-size: 11px;
    `;
    loadBtn.addEventListener("click", () => {
      if (tickMode === "auto") toggleAutoTick();
      gameState = loadScenario(config, scenario);
      queuedActions = [];
      updateActionPreview();
      renderer.render(gameState, config);
      updateHUD();
      if (debugOverlayVisible) renderDebugOverlay();
    });
    entry.appendChild(loadBtn);

    panel.appendChild(entry);
  }

  return panel;
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

function updateActionPreview(): void {
  const executeBtn = document.getElementById("execute-btn") as HTMLElement;
  if (executeBtn) {
    executeBtn.textContent = `Execute Actions (${queuedActions.length})`;
    executeBtn.style.display = queuedActions.length > 0 ? "block" : "none";
  }
}

function updateHUD(): void {
  const hud = document.getElementById("hud");
  if (!hud) return;

  const player = gameState.players.find((p) => p.id === PLAYER_ID);
  const resources = player ? player.resources : 0;

  let winnerText = "";
  if (gameState.winner) {
    const isPlayerWin = gameState.winner === PLAYER_ID;
    winnerText = isPlayerWin
      ? `<div style="color:#53d769;font-weight:bold;margin-top:4px;">VICTORY!</div>`
      : `<div style="color:#e94560;font-weight:bold;margin-top:4px;">DEFEAT!</div>`;
  }

  hud.innerHTML = `
    <div>Resources: <span style="color:#53d769">${resources}</span> / ${config.resourceCap}</div>
    <div>Tick: <span style="color:#e94560">${gameState.tick}</span></div>
    <div>Mode: <span style="color:#4ecdc4">${tickMode}</span></div>
    <div>Queued: ${queuedActions.length} action(s)</div>
    ${winnerText}
  `;
}

function advanceTick(): void {
  if (gameState.winner) return;

  const playerActions = new Map<string, GameAction[]>();
  if (queuedActions.length > 0) {
    playerActions.set(PLAYER_ID, [...queuedActions]);
  }
  gameState = simulateTick(gameState, playerActions, config);
  queuedActions = [];
  updateActionPreview();
  renderer.render(gameState, config);
  updateHUD();
  if (debugOverlayVisible) renderDebugOverlay();
}

function toggleAutoTick(): void {
  const autoBtn = document.getElementById("auto-btn") as HTMLElement;

  if (tickMode === "auto") {
    tickMode = "manual";
    if (autoTickInterval) {
      clearInterval(autoTickInterval);
      autoTickInterval = null;
    }
    if (autoBtn) autoBtn.textContent = "Auto: OFF";
  } else {
    tickMode = "auto";
    autoTickInterval = setInterval(() => {
      advanceTick();
    }, config.tickDurationMs);
    if (autoBtn) autoBtn.textContent = "Auto: ON";
  }

  updateHUD();
}

init();
