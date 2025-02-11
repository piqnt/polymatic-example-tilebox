// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Middleware } from "polymatic";

import { Terminal } from "./Terminal";
import { Gameplay } from "./Gameplay";
import { Loader } from "./Loader";
import { DataStore } from "./DataStore";
import type { Board, Cell, Tile } from "./Model";
import { FrameLoop } from "./FrameLoop";
import { TimelineManager, type TimelineEvent } from "./Timeline";

export class MainContext {
  stage?: Stage.Root;

  score = 0;
  inserted = 0;
  gameover = false;

  board: Board;

  maxScore = 0;

  timeline: TimelineEvent[] = [];
}

export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new Loader());
    this.use(new FrameLoop());
    this.use(new TimelineManager());
    this.use(new DataStore());
    this.on("stage-ready", this.handleStageReady);
  }

  handleStageReady = () => {
    this.use(new Terminal());
    this.use(new Gameplay());
    this.emit("main-start");
  };
}
