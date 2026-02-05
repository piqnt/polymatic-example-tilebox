// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import * as Stage from "stage-js";
import { Middleware } from "polymatic";

import textImage from "../media/text.png";
import logoImage from "../media/logo.png";
import tileImage from "../media/tile.png";
import { type MainContext } from "./Main";

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

    await Stage.atlas({
      image: { src: textImage, ratio: 4 },
      ppu: 16,
      textures: {
        "digit": {
          "0": { x: 0, y: 0, width: 0.775, height: 1 },
          "1": { x: 1, y: 0, width: 0.34375, height: 1 },
          "2": { x: 2, y: 0, width: 0.65625, height: 1 },
          "3": { x: 3, y: 0, width: 0.61875, height: 1 },
          "4": { x: 4, y: 0, width: 0.71875, height: 1 },
          "5": { x: 5, y: 0, width: 0.575, height: 1 },
          "6": { x: 6, y: 0, width: 0.7, height: 1 },
          "7": { x: 7, y: 0, width: 0.6375, height: 1 },
          "8": { x: 8, y: 0, width: 0.65625, height: 1 },
          "9": { x: 9, y: 0, width: 0.7, height: 1 },
          "-": { x: 10, y: 0, width: 0.49375, height: 1 },
          "+": { x: 11, y: 0, width: 0.7, height: 1 },
          "=": { x: 12, y: 0, width: 0.4125, height: 1 },
          "s": { x: 13, y: 0, width: 1, height: 1 },
          "S": { x: 14, y: 0, width: 1, height: 1 },
          "o": { x: 13, y: 1, width: 1, height: 1 },
          "O": { x: 14, y: 1, width: 1, height: 1 },
        },
      },
    });

    await Stage.atlas({
      image: { src: logoImage, ratio: 4 },
      textures: {
        "logo": { x: 0, y: 0, width: 120, height: 40 },
      },
    });

    this.context.stage = Stage.mount();
    this.emit("stage-ready");
  };
}
