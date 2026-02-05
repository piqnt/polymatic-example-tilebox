// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Dataset, Driver, Middleware } from "polymatic";

import { HEIGHT, WIDTH } from "./Config";

import { MainContext } from "./Main";
import { TileSprite } from "./TileSprite";
import { type Cell, type Tile, type Index } from "./Model";

const currentScorePin = {
  alignX: 0.05,
  alignY: 0,
  handleX: 0,
  handleY: 1,
  offsetY: -14,
  alpha: 1,
};

const maxScorePin = {
  alignX: 0.95,
  alignY: 0,
  handleX: 1,
  handleY: 1,
  offsetY: -14,
  alpha: 0.3,
};

export class Terminal extends Middleware<MainContext> {
  size = 32;

  board: Stage.Node;

  currentScore: Stage.Monotype;
  maxScore: Stage.Monotype;

  header: Stage.Node;
  logo: Stage.Node;

  tiles: Stage.Node;

  lastMaxScore = -1;

  mouseX = 0;
  mouseY = 0;
  mouseStarted = false;

  constructor() {
    super();
    this.on("stage-ready", this.handleActivate);
    this.on("game-over", this.handleGameover);
    this.on("game-start", this.handleStart);
    this.on("frame-render", this.handleFrameRender);
  }

  handleViewport = (viewport: Stage.Viewport) => {
    const stage = this.context.stage!;
    const w = viewport.width;
    const h = viewport.height;
    const r = viewport.ratio;
    stage.viewbox(Math.max(w / r / 2, 200), Math.max(h / r / 2, 250));
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

    this.header = Stage.component();
    this.header.appendTo(this.board);
    this.header.pin({
      width: WIDTH * this.size,
    });

    this.logo = Stage.sprite("logo");
    this.logo.appendTo(this.header);
    this.logo.pin({
      offsetX: 1,
      offsetY: -80,
      scale: 1.05,
    });

    this.currentScore = Stage.monotype("digit");
    this.currentScore.appendTo(this.board);
    this.currentScore.pin(currentScorePin);

    this.maxScore = Stage.monotype("digit");
    this.maxScore.appendTo(this.board);
    this.maxScore.pin(maxScorePin);

    this.board.on(Stage.POINTER_CLICK, () => {
      if (this.context.gameover) {
        this.emit("user-start");
      }
    });

    stage.on(Stage.POINTER_DOWN, this.handleMouseStart);
    stage.on(Stage.POINTER_MOVE, this.handleMouseMove);
    stage.on(Stage.POINTER_UP, this.handleMouseEnd);

    window.addEventListener("keydown", this.handleKeyDown);

    if (this.context.maxScore) {
      this.maxScore.value(this.context.maxScore + "S");
    } else {
      this.maxScore.hide()
    }
  };

  handleStart = () => {
    this.header.tween({ duration: 1000 }).pin("alpha", 0.4);
    if (this.lastMaxScore > -1 && this.context.maxScore > this.lastMaxScore) {
      // there is a new max

      this.maxScore.tween(200).alpha(0).remove();
      this.maxScore = this.currentScore;
      this.maxScore.value(this.context.maxScore + "S");
      this.maxScore.tween().pin(maxScorePin);

      this.currentScore = Stage.monotype("digit");
      this.currentScore.appendTo(this.board);
      this.currentScore.pin(currentScorePin);
      this.currentScore.value("0").pin(currentScorePin);
    }

    this.lastMaxScore = this.context.maxScore || 0;
  };

  handleGameover = () => {
    this.header.tween({ duration: 2000 }).pin("alpha", 1);

    if (this.context.score >= this.context.maxScore) {
      this.currentScore.value(this.context.score + "S");
      this.maxScore.value(this.lastMaxScore + "s");
    }
  };

  handleFrameRender = () => {
    if (this.context.gameover) return;
    this.currentScore.value(this.context.score);
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
