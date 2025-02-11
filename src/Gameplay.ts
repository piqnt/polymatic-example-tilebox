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

import { clearTimeline, queueEvent } from "./Timeline";

export class Gameplay extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("user-start", this.startGame);
    this.on("main-start", this.startGame);
    this.on("user-slide", this.handleUserSlide);
  }

  handleActivate = () => {
    const board = createBoard(WIDTH, HEIGHT);

    this.setContext((context) => {
      context.board = board;
    });
  };


  startGame = () => {
    this.context.gameover = false;
    this.context.score = 0;
    this.context.inserted = 0;

    clearTiles(this.context.board);
    clearTimeline(this.context);

    queueEvent(this.context, {
      name: "start-game",
      start: () => {
        return 0;
      },
      finish: () => {
        this.emit("game-start");
        this.awaitUserMove();
      },
    });
  };

  awaitUserMove = () => {
    if (this.context.gameover) return;
    queueEvent(this.context, {
      name: "await-user",
      start: () => {
        return Math.max(NEXT_TILE_TIME - this.context.inserted, 200);
      },
      finish: () => {
        this.addNewTile();
      },
    });
  };

  checkGameover = () => {
    if (this.context.gameover) return;
    const gameover = isGameover(this.context.board);
    if (!gameover) return;
    this.context.gameover = true;
    clearTimeline(this.context);
    if (!this.context.maxScore || this.context.maxScore < this.context.score) {
      this.context.maxScore = this.context.score;
    }
    this.emit("game-over");
  };

  addNewTile = () => {
    queueEvent(this.context, {
      name: "new-tile",
      start: () => {
        if (this.context.gameover) return;

        let tile: Tile;
          const cell = randomEmptyCell(this.context.board);
          if (!cell) return; // gameover
          tile = new Tile(cell.position, randomColor());

        insertTile(this.context.board, tile);
        this.context.inserted += 1;

        return 100;
      },
      finish: () => {
        this.collectTiles();
        this.checkGameover();
        if (this.context.gameover) return;
        this.awaitUserMove();
      },
    });
  };

  handleUserSlide = (direction: Index) => {
    if (this.context.timeline[0]?.name !== "await-user") return;

    const moved = slideBoard(this.context.board, direction);
    if (!moved) return;

    // clear await user
    clearTimeline(this.context);

    queueEvent(this.context, {
      name: "slide-board",
      start: () => {
        return 100;
      },
      finish: () => {
        this.collectTiles();
        this.addNewTile();
      },
    });
  };

  collectTiles = () => {
    queueEvent(this.context, {
      name: "collect-tiles",
      start: () => {
        const animateExit = this.context.score < 12;
        const matched = matchBoard(this.context.board, animateExit);
        if (matched) {
          this.context.score += matched;
          return animateExit ? ANIMATE_COLLECT_TIME : 0;
        }
      },
      finish: () => {
        if (!this.context.board.tiles.length) {
          clearTimeline(this.context);
          this.addNewTile();
        }
      },
    });
  };
}
