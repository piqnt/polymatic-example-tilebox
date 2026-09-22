// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Sprite, type Texture } from "pixi.js";
import { Memo } from "polymatic";
import { type TransitionSelection } from "@piqnt/transition";

import { ANIMATE_COLLECT_TIME } from "../model";

/**
 * A cell or a tile on the board, animated in, across and out.
 */
export class TileSprite extends Sprite {
  __size: number;
  __memo = Memo.init();
  // selection of this sprite in the board's transition manager
  transition: TransitionSelection<Sprite>;

  constructor(texture: Texture, size: number, transition: (sprite: Sprite) => TransitionSelection<Sprite>) {
    super(texture);
    this.__size = size;
    this.anchor.set(0.5);
    this.transition = transition(this);
  }

  enter(p: { i: number; j: number }) {
    this.__memo.update(p.i, p.j);
    this.position.set(p.i * this.__size, p.j * this.__size);
    this.scale.set(0.1);
    this.transition.tween(100).to({ scale: { x: 1, y: 1 } });
  }

  slide(p: { i: number; j: number }) {
    if (this.__memo.update(p.i, p.j)) {
      this.transition.tween(100).to({ position: { x: p.i * this.__size, y: p.j * this.__size }, scale: { x: 1, y: 1 } });
    }
  }

  exit(p: { i: number; j: number }, animate = false) {
    const remove = () => {
      this.removeFromParent();
      this.destroy();
    };
    if (animate) {
      const t = ANIMATE_COLLECT_TIME / 6;
      this.transition
        .tween(t)
        .to({ position: { x: p.i * this.__size, y: p.j * this.__size }, scale: { x: 1, y: 1 } })
        .tween(t)
        .to({ alpha: 0 })
        .tween(t)
        .to({ alpha: 1 })
        .tween(t)
        .to({ alpha: 0 })
        .tween(t)
        .to({ alpha: 1 })
        .tween(t)
        .to({ scale: { x: 0.1, y: 0.1 } })
        .done(remove);
    } else {
      this.transition.tween(100).to({ scale: { x: 0.1, y: 0.1 } }).done(remove);
    }
  }
}
