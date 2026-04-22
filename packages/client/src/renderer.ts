import { Application, Container, Graphics } from "pixi.js";
import type { GameState, GameConfig, Node as GameNode, Edge as GameEdge } from "@fungus/game";
import type { VisualEffect } from "./effects.js";
import { MAX_EFFECTS } from "./effects.js";
import { getPalette } from "./player-palette.js";
import type { PlayerPalette } from "./player-palette.js";

interface PendingNode {
  position: { x: number; y: number };
  nodeType: string;
  playerId: string;
}

const MAP_BG_COLOR = 0x16213e;
const MAP_BORDER_COLOR = 0x0f3460;
const ROOT_COLOR = 0xe94560;
const ROOT_RADIUS = 12;
const GENERATOR_COLOR = 0x53d769;
const GENERATOR_RADIUS = 8;
const TURRET_COLOR = 0xff8c00;
const TURRET_RADIUS = 9;
const SHIELD_COLOR = 0x00bfff;
const SHIELD_RADIUS = 9;
const SHIELD_AURA_COLOR = 0x00bfff;
const GHOST_OPACITY = 0.4;
const EDGE_COLOR = 0x4a4e69;
const EDGE_DAMAGED_COLOR = 0xe94560;
const EDGE_WIDTH = 2;
const HEALTH_BG_COLOR = 0x333333;
const HEALTH_FG_COLOR = 0x00ff00;
const HEALTH_BAR_WIDTH = 24;
const HEALTH_BAR_HEIGHT = 3;
const HEALTH_LERP_DURATION = 200;

interface HealthLerp {
  from: number;
  to: number;
  elapsed: number;
}

export class GameRenderer {
  private app: Application;
  private world: Container;
  private mapGraphics: Graphics;
  private edgesContainer: Container;
  private ghostContainer: Container;
  private nodesContainer: Container;
  private effectsContainer: Container;
  private isDragging = false;
  private lastDragPos = { x: 0, y: 0 };
  private effects: VisualEffect[] = [];
  private healthLerps: Map<string, HealthLerp> = new Map();
  private prevHealthMap: Map<string, number> = new Map();
  private shieldPulseTime = 0;
  private currentNodeState: GameNode[] = [];
  private currentConfig: GameConfig | null = null;

  constructor() {
    this.app = new Application();
    this.world = new Container();
    this.mapGraphics = new Graphics();
    this.edgesContainer = new Container();
    this.ghostContainer = new Container();
    this.nodesContainer = new Container();
    this.effectsContainer = new Container();
  }

  async init(canvasContainer: HTMLElement): Promise<void> {
    await this.app.init({
      background: 0x1a1a2e,
      resizeTo: canvasContainer,
      antialias: true,
    });

    canvasContainer.appendChild(this.app.canvas as HTMLCanvasElement);

    this.world.addChild(this.mapGraphics);
    this.world.addChild(this.edgesContainer);
    this.world.addChild(this.ghostContainer);
    this.world.addChild(this.nodesContainer);
    this.world.addChild(this.effectsContainer);
    this.app.stage.addChild(this.world);

    this.app.ticker.add(this.processFrame.bind(this));
    this.setupCamera();
  }

  addEffect(effect: VisualEffect): void {
    if (this.effects.length >= MAX_EFFECTS) {
      this.effects.shift();
    }
    this.effects.push(effect);
  }

  updateHealthTargets(nodes: GameNode[]): void {
    for (const node of nodes) {
      const prev = this.prevHealthMap.get(node.id);
      if (prev !== undefined && prev !== node.health) {
        this.healthLerps.set(node.id, {
          from: prev,
          to: node.health,
          elapsed: 0,
        });
      } else {
        this.healthLerps.delete(node.id);
      }
      this.prevHealthMap.set(node.id, node.health);
    }
  }

  private processFrame(): void {
    try {
      const dt = this.app.ticker.elapsedMS;
      this.shieldPulseTime += dt;

      this.updateEffects(dt);
      this.renderEffects();

      if (this.currentNodeState.length > 0 && this.currentConfig) {
        this.renderHealthBars(this.currentNodeState);
      }
    } catch (e) {
      console.error("Renderer processFrame error:", e);
    }
  }

  private updateEffects(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].elapsed += dt;
      if (this.effects[i].elapsed >= this.effects[i].duration) {
        this.effects.splice(i, 1);
      }
    }
  }

  private renderEffects(): void {
    while (this.effectsContainer.children.length > this.effects.length) {
      const child = this.effectsContainer.getChildAt(this.effectsContainer.children.length - 1);
      this.effectsContainer.removeChild(child);
      (child as Graphics).destroy();
    }

    while (this.effectsContainer.children.length < this.effects.length) {
      const g = new Graphics();
      this.effectsContainer.addChild(g);
    }

    for (let i = 0; i < this.effects.length; i++) {
      const effect = this.effects[i];
      const g = this.effectsContainer.getChildAt(i) as Graphics;
      const progress = Math.min(1, effect.elapsed / effect.duration);

      g.clear();

      switch (effect.type) {
        case "DamageFlash": {
          const alpha = 1 - progress;
          g.circle(effect.x, effect.y, 14);
          g.fill({ color: 0xffffff, alpha });
          break;
        }
        case "NodeDeath": {
          const alpha = 1 - progress;
          const expandedRadius = effect.radius * (1 + progress * 0.8);
          g.circle(effect.x, effect.y, expandedRadius);
          g.fill({ color: effect.color, alpha });
          break;
        }
        case "EdgeBreak": {
          const alpha = 1 - progress;
          g.moveTo(effect.fromX, effect.fromY);
          g.lineTo(effect.toX, effect.toY);
          g.stroke({ color: 0xff0000, width: 3, alpha });
          break;
        }
      }
    }
  }

  private renderHealthBars(nodes: GameNode[]): void {
    const nodeContainers = this.nodesContainer.children as Container[];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const container of nodeContainers) {
      const nodeId = container.label;
      if (!nodeId) continue;

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const lerp = this.healthLerps.get(nodeId);
      let currentHealth: number;

      if (lerp) {
        lerp.elapsed += this.app.ticker.elapsedMS;
        const t = Math.min(1, lerp.elapsed / HEALTH_LERP_DURATION);
        currentHealth = lerp.from + (lerp.to - lerp.from) * t;

        if (lerp.elapsed >= HEALTH_LERP_DURATION) {
          this.healthLerps.delete(nodeId);
        }
      } else {
        currentHealth = node.health;
      }

      const healthBarIndex = container.children.length - 1;
      if (healthBarIndex < 0) continue;

      const bar = container.getChildAt(healthBarIndex) as Graphics;
      if (bar) {
        this.redrawHealthBar(bar, currentHealth, node.maxHealth, HEALTH_BAR_WIDTH);
      }
    }
  }

  render(state: GameState, config: GameConfig, currentPlayerId?: string): void {
    this.currentNodeState = state.nodes;
    this.currentConfig = config;

    this.renderMap(config);
    this.renderEdges(state.edges, state.nodes, currentPlayerId);
    this.renderNodes(state.nodes, config, currentPlayerId);
  }

  private renderMap(config: GameConfig): void {
    const { width, height } = config.map;
    this.mapGraphics.clear();
    this.mapGraphics.rect(0, 0, width, height);
    this.mapGraphics.fill(MAP_BG_COLOR);
    this.mapGraphics.rect(0, 0, width, height);
    this.mapGraphics.stroke({ color: MAP_BORDER_COLOR, width: 2 });
  }

  private destroyChildren(container: Container): void {
    const children = container.removeChildren();
    for (const child of children) {
      (child as Graphics).destroy();
    }
  }

  private renderEdges(edges: GameEdge[], nodes: GameNode[], currentPlayerId?: string): void {
    this.destroyChildren(this.edgesContainer);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const edge of edges) {
      const from = nodeMap.get(edge.fromNodeId);
      const to = nodeMap.get(edge.toNodeId);
      if (!from || !to) continue;

      const healthRatio = edge.health / edge.maxHealth;
      let lineColor: number;
      if (currentPlayerId) {
        const palette = getPalette(to.playerId, currentPlayerId);
        lineColor = healthRatio < 0.5 ? palette.edgeDamaged : palette.edge;
      } else {
        lineColor = healthRatio < 0.5 ? EDGE_DAMAGED_COLOR : EDGE_COLOR;
      }

      const line = new Graphics();
      line.moveTo(from.position.x, from.position.y);
      line.lineTo(to.position.x, to.position.y);
      line.stroke({ color: lineColor, width: EDGE_WIDTH });
      this.edgesContainer.addChild(line);
    }
  }

  private renderNodes(nodes: GameNode[], config: GameConfig, currentPlayerId?: string): void {
    this.destroyChildren(this.nodesContainer);

    const shieldNodes = nodes.filter((n) => n.nodeType === "shield" && n.connected);
    const protectedNodeIds = new Set<string>();

    for (const shield of shieldNodes) {
      protectedNodeIds.add(shield.id);
      if (shield.parentId !== null) protectedNodeIds.add(shield.parentId);
      for (const other of nodes) {
        if (other.parentId === shield.id) {
          protectedNodeIds.add(other.id);
        }
      }
    }

    for (const node of nodes) {
      const container = new Container();
      container.label = node.id;
      container.position.set(node.position.x, node.position.y);

      let radius: number;
      let color: number;

      if (currentPlayerId) {
        const palette = getPalette(node.playerId, currentPlayerId);
        radius = this.getRadiusForNodeType(node.nodeType);
        color = this.getColorFromPalette(node.nodeType, palette);
      } else {
        switch (node.nodeType) {
          case "root":
            radius = ROOT_RADIUS;
            color = ROOT_COLOR;
            break;
          case "turret":
            radius = TURRET_RADIUS;
            color = TURRET_COLOR;
            break;
          case "shield":
            radius = SHIELD_RADIUS;
            color = SHIELD_COLOR;
            break;
          default:
            radius = GENERATOR_RADIUS;
            color = GENERATOR_COLOR;
            break;
        }
      }

      const circle = new Graphics();
      circle.circle(0, 0, radius);
      circle.fill(color);
      circle.stroke({ color: 0xffffff, width: 1 });
      container.addChild(circle);

      if (node.nodeType === "shield") {
        const shieldConfig = config.map.nodeTypeConfigs.shield;
        const auraRadius = shieldConfig?.attackRange ?? 60;
        const aura = new Graphics();
        aura.circle(0, 0, auraRadius);
        const auraColor = currentPlayerId
          ? getPalette(node.playerId, currentPlayerId).shieldAura
          : SHIELD_AURA_COLOR;
        aura.stroke({ color: auraColor, width: 2, alpha: 0.4 });
        container.addChild(aura);
      }

      if (protectedNodeIds.has(node.id) && node.nodeType !== "shield") {
        const pulseAlpha = 0.1 + 0.1 * Math.sin(this.shieldPulseTime / 500);
        const auraG = new Graphics();
        auraG.circle(0, 0, this.getRadiusForNodeType(node.nodeType) + 6);
        const auraColor = currentPlayerId
          ? getPalette(node.playerId, currentPlayerId).shieldAura
          : SHIELD_AURA_COLOR;
        auraG.fill({ color: auraColor, alpha: pulseAlpha });
        container.addChild(auraG);
      }

      const healthBar = this.createHealthBar(
        node.health,
        node.maxHealth,
        HEALTH_BAR_WIDTH,
      );
      healthBar.position.set(-HEALTH_BAR_WIDTH / 2, -(radius + 6));
      container.addChild(healthBar);

      this.nodesContainer.addChild(container);
    }
  }

  renderGhostNodes(pendingNodes: PendingNode[], state: GameState, config: GameConfig, currentPlayerId?: string): void {
    this.destroyChildren(this.ghostContainer);

    for (const pending of pendingNodes) {
      const radius = this.getRadiusForNodeType(pending.nodeType);
      let color: number;
      let edgeColor: number;

      if (currentPlayerId) {
        const palette = getPalette(pending.playerId, currentPlayerId);
        color = this.getColorFromPalette(pending.nodeType, palette);
        edgeColor = palette.edge;
      } else {
        color = this.getColorForNodeType(pending.nodeType);
        edgeColor = EDGE_COLOR;
      }

      const circle = new Graphics();
      circle.circle(pending.position.x, pending.position.y, radius);
      circle.fill({ color, alpha: GHOST_OPACITY });
      circle.circle(pending.position.x, pending.position.y, radius);
      circle.stroke({ color: 0xffffff, width: 1, alpha: GHOST_OPACITY });
      this.ghostContainer.addChild(circle);

      if (pending.funded !== undefined && pending.totalCost !== undefined && pending.totalCost > 0) {
        const progress = pending.funded / pending.totalCost;
        const barWidth = radius * 2;
        const barHeight = 3;
        const barX = pending.position.x - barWidth / 2;
        const barY = pending.position.y + radius + 4;

        const bg = new Graphics();
        bg.rect(barX, barY, barWidth, barHeight);
        bg.fill({ color: 0x333333, alpha: GHOST_OPACITY });
        this.ghostContainer.addChild(bg);

        const fill = new Graphics();
        fill.rect(barX, barY, barWidth * progress, barHeight);
        fill.fill({ color: 0x53d769, alpha: GHOST_OPACITY });
        this.ghostContainer.addChild(fill);
      }

      const closestNode = this.findClosestFriendlyNodeWithinRange(
        pending.position,
        pending.playerId,
        state,
        config,
      );
      if (closestNode) {
        const edgeLine = new Graphics();
        edgeLine.moveTo(pending.position.x, pending.position.y);
        edgeLine.lineTo(closestNode.position.x, closestNode.position.y);
        edgeLine.stroke({ color: edgeColor, width: EDGE_WIDTH, alpha: GHOST_OPACITY });
        this.ghostContainer.addChild(edgeLine);
      }
    }
  }

  private findClosestFriendlyNodeWithinRange(
    position: { x: number; y: number },
    playerId: string,
    state: GameState,
    config: GameConfig,
  ): GameNode | null {
    const maxDist = config.map.maxConnectionDistance;
    let closest: GameNode | null = null;
    let closestDist = maxDist;

    for (const node of state.nodes) {
      if (node.playerId !== playerId) continue;
      const dx = node.position.x - position.x;
      const dy = node.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = node;
      }
    }

    return closest;
  }

  private getRadiusForNodeType(nodeType: string): number {
    switch (nodeType) {
      case "root": return ROOT_RADIUS;
      case "turret": return TURRET_RADIUS;
      case "shield": return SHIELD_RADIUS;
      default: return GENERATOR_RADIUS;
    }
  }

  private getColorForNodeType(nodeType: string): number {
    switch (nodeType) {
      case "root": return ROOT_COLOR;
      case "turret": return TURRET_COLOR;
      case "shield": return SHIELD_COLOR;
      default: return GENERATOR_COLOR;
    }
  }

  private getColorFromPalette(nodeType: string, palette: PlayerPalette): number {
    switch (nodeType) {
      case "root": return palette.root;
      case "turret": return palette.turret;
      case "shield": return palette.shield;
      default: return palette.generator;
    }
  }

  private createHealthBar(current: number, max: number, width: number): Graphics {
    const bar = new Graphics();
    this.redrawHealthBar(bar, current, max, width);
    return bar;
  }

  private redrawHealthBar(bar: Graphics, current: number, max: number, width: number): void {
    const ratio = Math.max(0, Math.min(1, current / max));
    bar.clear();
    bar.rect(0, 0, width, HEALTH_BAR_HEIGHT);
    bar.fill(HEALTH_BG_COLOR);
    if (ratio > 0) {
      bar.rect(0, 0, width * ratio, HEALTH_BAR_HEIGHT);
      bar.fill(HEALTH_FG_COLOR);
    }
  }

  private setupCamera(): void {
    const canvas = this.app.canvas as HTMLCanvasElement;

    canvas.addEventListener("pointerdown", (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.lastDragPos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastDragPos.x;
      const dy = e.clientY - this.lastDragPos.y;
      this.world.x += dx;
      this.world.y += dy;
      this.lastDragPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("pointerup", () => {
      this.isDragging = false;
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(5, this.world.scale.x * zoomFactor));

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - this.world.x) / this.world.scale.x;
      const worldY = (mouseY - this.world.y) / this.world.scale.y;

      this.world.scale.set(newScale);
      this.world.x = mouseX - worldX * newScale;
      this.world.y = mouseY - worldY * newScale;
    }, { passive: false });
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.world.x) / this.world.scale.x,
      y: (screenY - this.world.y) / this.world.scale.y,
    };
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
