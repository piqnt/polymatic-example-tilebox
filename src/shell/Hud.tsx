// Copyright (c) Ali Shakiba
// Licensed under the MIT License

import { TbTrophy, TbTrophyFilled } from "react-icons/tb";

import { useRuntime } from "./context";
import styles from "./Shell.module.css";

/**
 * The title and the two scores above the board. There is no game-over panel:
 * the board simply freezes and the title comes up to full, and a click on the
 * board or the enter key starts the next game - both handled by
 * runtime/BoardView, as they always were. So this hud only reads.
 */
export function Hud() {
  return (
    <>
      <Title />
      <Score />
      <Best />
    </>
  );
}

/** Dimmed while a game is running, full once the board fills up. */
function Title() {
  const { gameOver } = useRuntime().context.hud;
  return <h1 class={`${styles.title} ${gameOver.value ? "" : styles.titleDim}`}>Tile Box</h1>;
}

/**
 * A filled trophy appears when the game ends on a score that beat the record.
 * The record itself stays on the right, still showing the number that was
 * beaten, until the next game starts. The sprite hud marked the pair with its
 * "S" and "s" glyphs.
 */
function Score() {
  const { score, maxScore, gameOver } = useRuntime().context.hud;
  const isBest = gameOver.value && score.value > 0 && score.value >= maxScore.value;

  return (
    <span class={styles.score} aria-label="Score">
      {score.value}
      {isBest && <TbTrophyFilled aria-hidden size="1em" />}
    </span>
  );
}

/** The trophy is what says this number is the best rather than the current score. */
function Best() {
  const { maxScore } = useRuntime().context.hud;
  if (!maxScore.value) return null;
  return (
    <span class={styles.best} aria-label="Best score">
      <TbTrophy aria-hidden size="1em" />
      {maxScore.value}
    </span>
  );
}
