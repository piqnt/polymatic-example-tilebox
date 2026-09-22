// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Container, Rectangle, type FederatedPointerEvent } from "pixi.js";
import { Binder, Driver, Middleware } from "polymatic";
import { TransitionManager } from "@piqnt/transition";

import { HEIGHT, WIDTH, type MainContext, type Cell, type Tile } from "../model";
import { type FrameLoopEvent } from "./FrameLoop";
import { TileSprite } from "./TileSprite";

/**
 * The board: the cells and the tiles on the canvas, plus the drag and key input
 * that slides them. The scores, the title and the game-over card are the Preact
 * hud (shell/), fed by runtime/HudManager.
 */
export class BoardView extends Middleware<MainContext> {
  size = 32;

  board: Container;
  tiles: Container;

  transitionManager = new TransitionManager();

  mouseX = 0;
  mouseY = 0;
  mouseStarted = false;

  constructor() {
    super();
    this.on("pixi-ready", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-render", this.handleFrameRender);
  }

  /**
   * The viewbox follows the window: half the css size, at least 200x250 units,
   * fitted inside the screen and centered. The board is pinned by the point 50%
   * across and 20% down, at the center of the screen.
   */
  handleViewport = () => {
    const pixi = this.context.pixi!;
    const scene = this.context.scene!;

    const cssWidth = pixi.screen.width;
    const cssHeight = pixi.screen.height;

    const boxWidth = Math.max(cssWidth / 2, 200);
    const boxHeight = Math.max(cssHeight / 2, 250);
    const unit = Math.min(cssWidth / boxWidth, cssHeight / boxHeight);

    scene.scale.set(unit);
    scene.position.set(cssWidth / 2, cssHeight / 2);

    // the hud cannot work out the board's place on screen in css - publish it instead
    this.emit("board-layout", {
      left: cssWidth / 2 - 0.5 * WIDTH * this.size * unit,
      top: cssHeight / 2 - 0.2 * HEIGHT * this.size * unit,
      unit,
    });
  };

  handleActivate = () => {
    const pixi = this.context.pixi!;
    const scene = this.context.scene!;

    const boardWidth = WIDTH * this.size;
    const boardHeight = HEIGHT * this.size;

    this.board = new Container();
    this.board.position.set(-0.5 * boardWidth, -0.2 * boardHeight);
    this.board.eventMode = "static";
    this.board.hitArea = new Rectangle(0, 0, boardWidth, boardHeight);
    this.board.on("pointertap", () => {
      if (this.context.gameover) {
        this.emit("user-start");
      }
    });
    scene.addChild(this.board);

    // tiles are placed by their centers
    this.tiles = new Container();
    this.tiles.position.set(this.size / 2, this.size / 2);
    this.board.addChild(this.tiles);

    // slide gestures start anywhere on the screen
    pixi.stage.eventMode = "static";
    pixi.stage.hitArea = pixi.screen;
    pixi.stage.on("pointerdown", this.handleMouseStart);
    pixi.stage.on("pointermove", this.handleMouseMove);
    pixi.stage.on("pointerup", this.handleMouseEnd);
    pixi.stage.on("pointerupoutside", this.handleMouseEnd);

    window.addEventListener("keydown", this.handleKeyDown);

    pixi.renderer.on("resize", this.handleViewport);
    this.handleViewport();
  };

  handleDeactivate = () => {
    this.context.pixi?.renderer.off("resize", this.handleViewport);
    window.removeEventListener("keydown", this.handleKeyDown);
  };

  handleFrameRender = (ev: FrameLoopEvent) => {
    if (!this.board) return;
    if (!this.context.gameover) {
      this.binder.data([...this.context.board.cells, ...this.context.board.tiles]);
    }
    this.transitionManager.update(ev.dt);
  };

  createSprite = (texture: keyof typeof this.context.textures.tiles) => {
    return new TileSprite(this.context.textures!.tiles[texture], this.size, (sprite) => this.transitionManager.select(sprite));
  };

  cellDriver = Driver.create<Cell, TileSprite>({
    filter: (d) => d.type === "cell",
    enter: (cell: Cell) => {
      const ui = this.createSprite("cell");
      this.tiles.addChild(ui);
      ui.enter(cell.position);
      return ui;
    },
    exit: (cell: Cell, ui: TileSprite) => {
      ui.exit(cell.position);
    },
    update: (cell: Cell, ui: TileSprite) => {
      //
    },
  });

  tileDriver = Driver.create<Tile, TileSprite>({
    filter: (d) => d.type === "tile",
    enter: (tile: Tile) => {
      const ui = this.createSprite((tile.color || "") as keyof typeof this.context.textures.tiles);
      this.tiles.addChild(ui);
      ui.enter(tile.position);
      return ui;
    },
    exit: (tile: Tile, ui: TileSprite) => {
      ui.exit(tile.position, tile.animateExit);
    },
    update: (tile: Tile, ui: TileSprite) => {
      ui.slide(tile.position);
    },
  });

  binder = Binder.create<Cell | Tile>({
    key: (d) => d.key,
    drivers: [this.cellDriver, this.tileDriver],
  });

  toScene = (e: FederatedPointerEvent) => {
    return this.context.scene!.toLocal(e.global);
  };

  handleMouseStart = (e: FederatedPointerEvent) => {
    if (this.context.gameover) return;

    const point = this.toScene(e);
    this.mouseX = point.x;
    this.mouseY = point.y;
    this.mouseStarted = true;
  };

  handleMouseMove = (e: FederatedPointerEvent) => {
    if (!this.mouseStarted) return;

    const point = this.toScene(e);
    const x = point.x - this.mouseX;
    const y = point.y - this.mouseY;
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    if (ax > ay && ax > this.size / 3) {
      this.emit("user-slide", { i: x > 0 ? 1 : -1, j: 0 });
      this.mouseStarted = false;
    } else if (ay > ax && ay > this.size / 3) {
      this.emit("user-slide", { i: 0, j: y > 0 ? 1 : -1 });
      this.mouseStarted = false;
    }
  };

  handleMouseEnd = (e: FederatedPointerEvent) => {
    this.handleMouseMove(e);
    this.mouseStarted = false;
  };

  handleKeyDown = (ev: KeyboardEvent) => {
    const key: number = ev.keyCode;
    if (this.context.gameover) {
      if (key == 13 || key == 32) {
        this.emit("user-start");
        ev.preventDefault();
      }
    } else {
      const i = (key == 39 ? 1 : 0) - (key == 37 ? 1 : 0);
      const j = (key == 40 ? 1 : 0) - (key == 38 ? 1 : 0);
      if (i || j) {
        this.emit("user-slide", { i, j });
        ev.preventDefault();
      }
    }
  };
}
