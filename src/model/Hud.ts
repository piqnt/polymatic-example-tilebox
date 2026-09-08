// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { type Signal, signal } from "@preact/signals";

/**
 * What the hud draws, mirrored out of the game state by runtime/HudManager -
 * the scores once per frame, the board's place on screen whenever the viewport
 * changes. The shell reads only these.
 */
export class HudData {
  score: Signal<number>;
  /** the record to beat; once beaten it holds the old one until the next game */
  maxScore: Signal<number>;
  gameOver: Signal<boolean>;

  /**
   * Where the board sits, in css pixels, and how big one board unit is.
   *
   * The other examples derive this in css, but they cannot here: this stage
   * sizes its viewbox from the window (see runtime/BoardView), and css `calc`
   * cannot divide by a length, so the mapping has to come from the runtime.
   */
  boardLeft: Signal<number>;
  boardTop: Signal<number>;
  boardUnit: Signal<number>;

  constructor() {
    this.score = signal(0);
    this.maxScore = signal(0);
    this.gameOver = signal(false);

    this.boardLeft = signal(0);
    this.boardTop = signal(0);
    this.boardUnit = signal(0);
  }
}
