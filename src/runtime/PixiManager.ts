// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { Application, Assets, Container, Rectangle, Texture } from "pixi.js";
import { Middleware } from "polymatic";

import tileImage from "../../media/tile.png";
import { type MainContext } from "../model";
import { type FrameLoopEvent } from "./FrameLoop";

export type TileTexture = "" | "blue" | "red" | "yellow" | "green" | "purple" | "orange" | "cell";

export interface Textures {
  tiles: Record<TileTexture, Texture>;
}

/**
 * Creates and owns the Pixi application, loads the tile atlas, and drives
 * Pixi's ticker from the FrameLoop so there is a single loop. The canvas goes
 * into the page's #board, under the Preact hud (#ui-root).
 */
export class PixiManager extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("deactivate", this.handleDeactivate);
    this.on("frame-after", this.handleFrameAfter);
  }

  handleActivate = async () => {
    const board = document.getElementById("board") ?? document.body;

    // Textures
    // The atlas image is 1024x256 at pixel ratio 4, so it is 256x64 logical pixels,
    // with 32x32 logical pixel tiles in a row: frames below are in logical pixels.
    const atlas = await Assets.load<Texture>({ src: tileImage, data: { resolution: 4 } });
    const ppu = 32;
    const names: TileTexture[] = ["", "blue", "red", "yellow", "green", "purple", "orange", "cell"];
    const tiles = {} as Record<TileTexture, Texture>;
    names.forEach((name, index) => {
      tiles[name] = new Texture({
        source: atlas.source,
        frame: new Rectangle(index * ppu, 0, ppu, ppu),
      });
    });

    const pixi = new Application();
    await pixi.init({
      resizeTo: board,
      backgroundAlpha: 0,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
      // ticker is updated manually in handleFrameAfter, see FrameLoop
      autoStart: false,
    });
    pixi.canvas.id = "stage";
    board.prepend(pixi.canvas);

    // scene container, scaled and positioned by BoardView
    const scene = new Container();
    pixi.stage.addChild(scene);

    this.context.pixi = pixi;
    this.context.scene = scene;
    this.context.textures = { tiles };

    this.emit("pixi-ready");
  };

  handleDeactivate = () => {
    this.context.pixi?.destroy({ removeView: true }, { children: true });
    this.context.pixi = undefined;
    this.context.scene = undefined;
  };

  handleFrameAfter = (ev: FrameLoopEvent) => {
    if (!this.context.pixi) return;
    // runs ticker listeners and then renders the stage
    this.context.pixi.ticker.update(ev.now);
  };
}
