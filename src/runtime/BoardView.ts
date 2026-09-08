// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Dataset, Driver, Middleware } from "polymatic";

import { HEIGHT, WIDTH, type MainContext, type Cell, type Tile, type Index } from "../model";
import { TileSprite } from "./TileSprite";

/**
 * The board: the cells and the tiles on the stage, plus the drag and key input
 * that slides them. The scores, the title and the game-over card are the Preact
 * hud now (shell/), fed by runtime/HudManager.
 */
export class BoardView extends Middleware<MainContext> {
  size = 32;

  board: Stage.Node;
  tiles: Stage.Node;

  mouseX = 0;
  mouseY = 0;
  mouseStarted = false;

  constructor() {
    super();
    this.on("stage-ready", this.handleActivate);
    this.on("frame-render", this.handleFrameRender);
  }

  handleViewport = (viewport: Stage.Viewport) => {
    const stage = this.context.stage!;
    const w = viewport.width;
    const h = viewport.height;
    const r = viewport.ratio;

    // the viewbox follows the window rather than being fixed, so the hud cannot
    // work out the board's place on screen in css - publish it instead
    const boxWidth = Math.max(w / r / 2, 200);
    const boxHeight = Math.max(h / r / 2, 250);
    stage.viewbox(boxWidth, boxHeight);

    const cssWidth = w / r;
    const cssHeight = h / r;
    // "in-pad" fits the viewbox inside the canvas and pads the rest
    const unit = Math.min(cssWidth / boxWidth, cssHeight / boxHeight);
    this.emit("board-layout", {
      // the board is pinned centred, by the point 50% across and 20% down
      left: cssWidth / 2 - 0.5 * WIDTH * this.size * unit,
      top: cssHeight / 2 - 0.2 * HEIGHT * this.size * unit,
      unit,
    });
  };

  handleActivate = () => {
    const stage = this.context.stage!;

    stage.on("viewport", this.handleViewport);

    this.handleViewport(stage.viewport());

    this.board = Stage.component();
    this.board.appendTo(stage);
    this.board.pin({
      width: WIDTH * this.size,
      height: HEIGHT * this.size,
      align: 0.5,
      handleY: 0.2,
      handleX: 0.5,
    });

    this.tiles = Stage.component();
    this.tiles.appendTo(this.board);
    this.tiles.offset(this.size / 2, this.size / 2);

    this.board.on(Stage.POINTER_CLICK, () => {
      if (this.context.gameover) {
        this.emit("user-start");
      }
    });

    stage.on(Stage.POINTER_DOWN, this.handleMouseStart);
    stage.on(Stage.POINTER_MOVE, this.handleMouseMove);
    stage.on(Stage.POINTER_UP, this.handleMouseEnd);

    window.addEventListener("keydown", this.handleKeyDown);
  };

  handleFrameRender = () => {
    if (this.context.gameover) return;
    this.binder.data([...this.context.board.cells, ...this.context.board.tiles]);
  };

  cellDriver = Driver.create<Cell, TileSprite>({
    filter: (d) => d.type === "cell",
    enter: (cell: Cell) => {
      const ui = new TileSprite(this.size);
      ui.texture("cell");
      ui.appendTo(this.tiles);
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
      const ui = new TileSprite(this.size);
      ui.texture(tile.color || "");
      ui.appendTo(this.tiles);
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

  binder = Dataset.create<Cell | Tile>({
    key: (d) => d.key,
    drivers: [this.cellDriver, this.tileDriver],
  });

  handleMouseStart = (point: Stage.Vec2Value) => {
    if (this.context.gameover) return;

    this.mouseX = point.x;
    this.mouseY = point.y;
    this.mouseStarted = true;
  };

  handleMouseMove = (point: Stage.Vec2Value) => {
    if (!this.mouseStarted) return;

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

  handleMouseEnd = (point: Stage.Vec2Value) => {
    this.handleMouseMove(point);
    this.mouseStarted = false;
  };

  handleKeyDown = (ev) => {
    const key: number = ev.keyCode;
    if (this.context.gameover) {
      if (key == 13 || key == 32) {
        this.emit("user-start");
        return false;
      }
    } else {
      const i = (key == 39 ? 1 : 0) - (key == 37 ? 1 : 0);
      const j = (key == 40 ? 1 : 0) - (key == 38 ? 1 : 0);
      if (i || j) {
        this.emit("user-slide", { i, j });
        return false;
      }
    }
  };
}
