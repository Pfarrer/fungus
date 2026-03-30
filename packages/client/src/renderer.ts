import { Application, Container, Graphics } from "pixi.js";
import type { GameState, GameConfig, Node as GameNode, Edge as GameEdge } from "@fungus/game";

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
const EDGE_COLOR = 0x4a4e69;
const EDGE_DAMAGED_COLOR = 0xe94560;
const EDGE_WIDTH = 2;
const HEALTH_BG_COLOR = 0x333333;
const HEALTH_FG_COLOR = 0x00ff00;
const HEALTH_BAR_WIDTH = 24;
const HEALTH_BAR_HEIGHT = 3;

export class GameRenderer {
  private app: Application;
  private world: Container;
  private mapGraphics: Graphics;
  private edgesContainer: Container;
  private nodesContainer: Container;
  private isDragging = false;
  private lastDragPos = { x: 0, y: 0 };

  constructor() {
    this.app = new Application();
    this.world = new Container();
    this.mapGraphics = new Graphics();
    this.edgesContainer = new Container();
    this.nodesContainer = new Container();
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
    this.world.addChild(this.nodesContainer);
    this.app.stage.addChild(this.world);

    this.setupCamera();
  }

  render(state: GameState, config: GameConfig): void {
    this.renderMap(config);
    this.renderEdges(state.edges, state.nodes);
    this.renderNodes(state.nodes);
  }

  private renderMap(config: GameConfig): void {
    const { width, height } = config.map;
    this.mapGraphics.clear();
    this.mapGraphics.rect(0, 0, width, height);
    this.mapGraphics.fill(MAP_BG_COLOR);
    this.mapGraphics.rect(0, 0, width, height);
    this.mapGraphics.stroke({ color: MAP_BORDER_COLOR, width: 2 });
  }

  private renderEdges(edges: GameEdge[], nodes: GameNode[]): void {
    this.edgesContainer.removeChildren();

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const edge of edges) {
      const from = nodeMap.get(edge.fromNodeId);
      const to = nodeMap.get(edge.toNodeId);
      if (!from || !to) continue;

      const healthRatio = edge.health / edge.maxHealth;
      const lineColor = healthRatio < 0.5
        ? EDGE_DAMAGED_COLOR
        : EDGE_COLOR;

      const line = new Graphics();
      line.moveTo(from.position.x, from.position.y);
      line.lineTo(to.position.x, to.position.y);
      line.stroke({ color: lineColor, width: EDGE_WIDTH });
      this.edgesContainer.addChild(line);
    }
  }

  private renderNodes(nodes: GameNode[]): void {
    this.nodesContainer.removeChildren();

    for (const node of nodes) {
      const container = new Container();
      container.position.set(node.position.x, node.position.y);

      let radius: number;
      let color: number;

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

      const circle = new Graphics();
      circle.circle(0, 0, radius);
      circle.fill(color);
      circle.stroke({ color: 0xffffff, width: 1 });
      container.addChild(circle);

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

  private createHealthBar(current: number, max: number, width: number): Graphics {
    const bar = new Graphics();
    const ratio = Math.max(0, Math.min(1, current / max));
    const barHeight = HEALTH_BAR_HEIGHT;

    bar.rect(0, 0, width, barHeight);
    bar.fill(HEALTH_BG_COLOR);

    if (ratio > 0) {
      bar.rect(0, 0, width * ratio, barHeight);
      bar.fill(HEALTH_FG_COLOR);
    }

    return bar;
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
