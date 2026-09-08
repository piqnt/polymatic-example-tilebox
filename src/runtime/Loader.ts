// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Middleware } from "polymatic";


import tileImage from "../../media/tile.png";
import { type MainContext } from "../model";

export class Loader extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
  }

  handleActivate = async () => {
    await Stage.atlas({
      image: { src: tileImage, ratio: 4 },
      ppu: 32, // point per unit
      textures: {
        "": { x: 0, y: 0, width: 1, height: 1 },
        "blue": { x: 1, y: 0, width: 1, height: 1 },
        "red": { x: 2, y: 0, width: 1, height: 1 },
        "yellow": { x: 3, y: 0, width: 1, height: 1 },
        "green": { x: 4, y: 0, width: 1, height: 1 },
        "purple": { x: 5, y: 0, width: 1, height: 1 },
        "orange": { x: 6, y: 0, width: 1, height: 1 },
        "cell": { x: 7, y: 0, width: 1, height: 1 },
      },
    });

    this.context.stage = Stage.mount();
    this.emit("stage-ready");
  };
}
