import { Container, Graphics } from "pixi.js";
import { GameRenderer } from "./renderer.js";
import {
  createInitialState,
  defaultGameConfig,
  validatePlaceNode,
  simulateTick,
} from "@fungus/game";
import type { GameState, GameAction, GameConfig } from "@fungus/game";

const PLAYER_ID = "player-1";
let gameState: GameState;
let config: GameConfig;
let renderer: GameRenderer;
let selectedNodeType: string | null = null;
let tickMode: "auto" | "manual" = "manual";
let autoTickInterval: ReturnType<typeof setInterval> | null = null;
let queuedActions: GameAction[] = [];

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
    createUI();
    updateHUD();
  });
}

function setupInteraction(): void {
  const canvas = renderer["app"].canvas as HTMLCanvasElement;

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button === 0 && selectedNodeType) {
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

function showPlacementPreview(
  position: { x: number; y: number },
  valid: boolean,
): void {
  clearPreview();

  previewGraphics = new Graphics();

  const maxDist = config.map.maxConnectionDistance;
  previewGraphics.circle(position.x, position.y, maxDist);
  previewGraphics.fill(valid ? 0x00ff0033 : 0xff000033);
  previewGraphics.circle(position.x, position.y, maxDist);
  previewGraphics.stroke({
    color: valid ? 0x00ff00 : 0xff0000,
    width: 1,
    alpha: 0.5,
  });

  const nodeColor =
    selectedNodeType === "root" ? 0xe9456088 : 0x53d76988;
  const radius = selectedNodeType === "root" ? 12 : 8;
  previewGraphics.circle(position.x, position.y, radius);
  previewGraphics.fill(nodeColor);

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

  hud.innerHTML = `
    <div>Resources: <span style="color:#53d769">${resources}</span> / ${config.resourceCap}</div>
    <div>Tick: <span style="color:#e94560">${gameState.tick}</span></div>
    <div>Mode: <span style="color:#4ecdc4">${tickMode}</span></div>
    <div>Queued: ${queuedActions.length} action(s)</div>
  `;
}

function advanceTick(): void {
  const playerActions = new Map<string, GameAction[]>();
  if (queuedActions.length > 0) {
    playerActions.set(PLAYER_ID, [...queuedActions]);
  }
  gameState = simulateTick(gameState, playerActions, config);
  queuedActions = [];
  updateActionPreview();
  renderer.render(gameState, config);
  updateHUD();
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
