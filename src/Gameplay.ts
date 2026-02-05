// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Middleware } from "polymatic";

import { MainContext } from "./Main";
import { NEXT_TILE_TIME, ANIMATE_COLLECT_TIME, WIDTH, HEIGHT } from "./Config";
import {
  type Index,
  Tile,
  Board,
  clearTiles,
  createBoard,
  insertTile,
  matchBoard,
  randomColor,
  randomEmptyCell,
  slideBoard,
  isGameover,
} from "./Model";
import { clearTimeline, runTask, stepTimeline, timeoutTask } from "./Timeline";
import { type FrameLoopEvent } from "./FrameLoop";

const DEBUG = false;

export class Gameplay extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("user-start", this.startGame);
    this.on("main-start", this.startGame);
    this.on("user-slide", this.handleUserSlide);
    this.on("frame-update", this.handleFrameUpdate);
  }

  handleActivate = () => {
    const board = createBoard(WIDTH, HEIGHT);
    this.context.board = board;
  };

  handleFrameUpdate = (e: FrameLoopEvent) => {
    if (this.context.gameover) return;
    stepTimeline(this.context.board, e.dt);

    // console.log(this.context.nextTileTimeout, e.dt);

    if (this.context.nextTileTimeout > 0) {
      this.context.nextTileTimeout -= e.dt;
      if (this.context.nextTileTimeout <= 0) {
        this.handleNextTimeout();
      }
    }
    if (!this.context.board.tiles.length && !this.context.board?.timeline?.length) {
      this.addNewTile();
    }
  };

  startGame = () => {
    this.context.gameover = false;
    this.context.score = 0;
    this.context.inserted = 0;
    this.context.nextTileTimeout = 400;

    clearTiles(this.context.board);
    clearTimeline(this.context.board);

    this.emit("game-start");
  };

  handleNextTimeout = () => {
    DEBUG && console.log("handleNextTimeout");
    this.addNewTile();
  };

  resetNextTileTimeout = () => {
    if (this.context.gameover) return;
    DEBUG && console.log("resetNextTileTimeout");
    this.context.nextTileTimeout = Math.max(NEXT_TILE_TIME - this.context.inserted, 400);
    DEBUG && console.log(this.context.nextTileTimeout);
  };

  checkGameover = () => {
    DEBUG && console.log("checkGameover");
    if (this.context.gameover) return;
    if (!isGameover(this.context.board)) return;
    this.context.gameover = true;
    clearTimeline(this.context.board);
    if (!this.context.maxScore || this.context.maxScore < this.context.score) {
      this.context.maxScore = this.context.score;
    }
    this.emit("game-over");
  };

  addNewTile = () => {
    if (this.context.gameover) return;
    DEBUG && console.log("addNewTile");

    const cell = randomEmptyCell(this.context.board);
    if (!cell) return; // gameover
    const tile = new Tile(cell.position, randomColor());

    insertTile(this.context.board, tile);
    this.context.inserted += 1;

    this.context.nextTileTimeout = -1;

    runTask(this.context.board, [
      timeoutTask(() => {}, 100, "new-tile-delay"), // new tile animation delay
      timeoutTask(() => this.collectTiles(), 0, "new-tile-collect"),
      timeoutTask(() => this.checkGameover(), 0, "new-tile-check"),
      timeoutTask(() => this.resetNextTileTimeout(), 0, "new-tile-next"),
    ]);
  };

  handleUserSlide = (direction: Index) => {
    if (this.context.board?.timeline?.length) return;

    DEBUG && console.log("handleUserSlide");

    const moved = slideBoard(this.context.board, direction);
    if (!moved) return;

    this.context.nextTileTimeout = -1;

    runTask(this.context.board, [
      timeoutTask(() => {}, 100, "slide-delay"), // slide animation delay
      timeoutTask(() => this.collectTiles(), 0, "slide-collect"),
      timeoutTask(() => this.addNewTile(), 0, "slide-add"),
    ]);
  };

  collectTiles = () => {
    const animateExit = this.context.score < 12;
    const matched = matchBoard(this.context.board, animateExit);
    DEBUG && console.log("collectTiles", matched, animateExit);
    if (!matched) return;

    this.context.score += matched;
    const delay = animateExit ? ANIMATE_COLLECT_TIME : 0;

    runTask(this.context.board, [
      //
      timeoutTask(() => {}, delay, "collect-delay"),
    ]);
  };
}
