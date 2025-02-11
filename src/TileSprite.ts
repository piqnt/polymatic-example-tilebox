// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Memo } from "polymatic";
import * as Stage from "stage-js";

import { ANIMATE_COLLECT_TIME } from "./Config";

export class TileSprite extends Stage.Sprite {
  __size: number;
  __memo = Memo.init();

  constructor(size: number) {
    super();
    this.__size = size;
    this.pin({ handle: 0.5 });
  }

  enter(p: { i: number; j: number }) {
    this.__memo.update(p.i, p.j);
    this.offset(p.i * this.__size, p.j * this.__size);
    this.scale(0.1, 0.1);
    this.tween(100).scale(1, 1);
  }

  slide(p: { i: number; j: number }) {
    if (this.__memo.update(p.i, p.j)) {
      this.tween(100)
        .offset(p.i * this.__size, p.j * this.__size)
        .scale(1, 1);
    }
  }

  exit(p: { i: number; j: number }, animate = false) {
    if (animate) {
      const t = ANIMATE_COLLECT_TIME / 6;
      this.tween(t)
        .offset(p.i * this.__size, p.j * this.__size)
        .scale(1, 1)
        .tween(t)
        .pin("alpha", 0)
        .tween(t)
        .pin("alpha", 1)
        .tween(t)
        .pin("alpha", 0)
        .tween(t)
        .pin("alpha", 1)
        .tween(t)
        .scale(0.1, 0.1)
        .remove();
    } else {
      this.tween(100).scale(0.1, 0.1).remove();
    }
  }
}
