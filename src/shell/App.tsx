// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import "./fonts.css";

import { GameContext } from "./context";
import { runtime } from "../async-signals";
import { Hud } from "./Hud";
import styles from "./Shell.module.css";

/**
 * The shell. It mounts before the runtime exists (see index.tsx), so every read
 * below is guarded: `runtime` fills in once the game has been activated, and
 * `ready` once the atlas is loaded and pixi is mounted.
 *
 * The frame is placed from the board's published rect rather than from css -
 * see model/Hud for why.
 */
export function App() {
  const context = runtime.value?.context;
  const ready = context?.ready.value;
  const unit = context?.hud.boardUnit.value ?? 0;

  return (
    <GameContext.Provider value={runtime.value ?? null}>
      <div
        class={styles.frame}
        style={{
          left: `${context?.hud.boardLeft.value ?? 0}px`,
          top: `${context?.hud.boardTop.value ?? 0}px`,
          "--u": `${unit}px`,
        }}
      >
        {runtime.value && ready && unit > 0 && <Hud />}
      </div>
    </GameContext.Provider>
  );
}
