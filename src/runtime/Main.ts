// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Middleware } from "polymatic";

import { type MainContext } from "../model";
import { BoardView } from "./BoardView";
import { Gameplay } from "./Gameplay";
import { PixiManager } from "./PixiManager";
import { DataStore } from "./DataStore";
import { FrameLoop } from "./FrameLoop";
import { HudManager } from "./HudManager";

/**
 * The runtime. It owns the board and the tiles on the canvas; the scores, the
 * title and the game-over card are the shell's (see shell/App), and the two
 * meet at the signals on MainContext.
 */
export class Main extends Middleware<MainContext> {
  constructor() {
    super();
    this.use(new PixiManager());
    this.use(new FrameLoop());
    this.use(new DataStore());
    this.on("pixi-ready", this.handlePixiReady);
  }

  handlePixiReady = () => {
    this.use(new BoardView());
    this.use(new Gameplay());
    this.use(new HudManager());
    this.context.ready.value = true;
    this.emit("main-start");
  };
}
