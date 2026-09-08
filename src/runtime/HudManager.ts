// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Middleware } from "polymatic";

import { type MainContext } from "../model";

interface BoardLayout {
  left: number;
  top: number;
  unit: number;
}

/**
 * The one place the runtime talks to the shell.
 *
 * Gameplay keeps writing plain fields as tiles land and match; once a frame
 * this copies whatever the hud shows onto `context.hud`'s signals. Signals only
 * notify on a real change, so a frame that scores nothing re-renders nothing.
 * The board's place on screen comes through the same way, but only when the
 * viewport changes.
 */
export class HudManager extends Middleware<MainContext> {
  /**
   * The best score as it stood when this game began. Beating it updates
   * `context.maxScore` immediately, but the hud goes on showing the record that
   * was just broken until the next game starts - the sprite hud did the same,
   * off its own `lastMaxScore`.
   */
  lastMaxScore = 0;

  constructor() {
    super();
    this.on("frame-render", this.handleFrameRender);
    this.on("board-layout", this.handleBoardLayout);
    this.on("game-start", this.handleGameStart);
  }

  handleGameStart = () => {
    this.lastMaxScore = this.context.maxScore ?? 0;
  };

  handleFrameRender = () => {
    const { hud } = this.context;
    hud.score.value = this.context.score;
    hud.maxScore.value = this.context.gameover ? this.lastMaxScore : this.context.maxScore;
    hud.gameOver.value = this.context.gameover;
  };

  handleBoardLayout = ({ left, top, unit }: BoardLayout) => {
    const { hud } = this.context;
    hud.boardLeft.value = left;
    hud.boardTop.value = top;
    hud.boardUnit.value = unit;
  };
}
