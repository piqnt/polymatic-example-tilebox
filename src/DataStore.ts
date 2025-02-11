// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import store from "store";
import { Middleware } from "polymatic";

import { MainContext } from "./Main";

const KEY = "tilebox-v1-max";

export class DataStore extends Middleware<MainContext> {
  constructor() {
    super();
    this.on("activate", this.handleActivate);
    this.on("game-over", this.handleGameover);
  }

  handleActivate = () => {
    const maxScore = store.get(KEY);
    if (maxScore > 0) {
      this.context.maxScore = maxScore;
    }
  };

  handleGameover = () => {
    store.set(KEY, this.context.maxScore);
  };
}
