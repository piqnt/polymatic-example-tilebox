// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { type Application, type Container } from "pixi.js";
import { type Signal, signal } from "@preact/signals";

import { type Textures } from "../runtime/PixiManager";

import { type Board } from "./Model";
import { HudData } from "./Hud";

/**
 * Global context, shared between the runtime and the shell.
 *
 * The plain fields belong to the runtime - the board, the score, the pixi app -
 * and are written many times a frame. The signals are the bridge: the runtime
 * writes them, the shell subscribes by reading `.value` as it renders. What the
 * hud shows is mirrored onto `hud` once a frame (runtime/HudManager) rather
 * than being signals at the source, so a frame that changes no displayed number
 * re-renders nothing.
 */
export class MainContext {
  // the pixi application, the scene container and the textures, set by runtime/PixiManager
  pixi?: Application;
  scene?: Container;
  textures?: Textures;

  score = 0;
  inserted = 0;
  gameover = false;
  nextTileTimeout = 0;

  board: Board;

  maxScore = 0;

  // --- shell facing state ---

  /** atlas loaded and pixi mounted; the shell draws nothing before this */
  ready: Signal<boolean>;

  hud: HudData;

  constructor() {
    this.ready = signal(false);
    this.hud = new HudData();
  }
}
